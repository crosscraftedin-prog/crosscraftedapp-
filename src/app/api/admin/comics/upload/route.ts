import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

/**
 * POST /api/admin/comics/upload
 *
 * Uploads comic panel artwork to Supabase Storage (persistent across deployments).
 * Converts to WebP via sharp. Returns the public URL.
 *
 * Body: multipart/form-data with:
 *   - file:     the image file (PNG/JPG/JPEG/WEBP, max 10MB)
 *   - bookId:   e.g. "genesis"
 *   - chapter:  e.g. "2"
 *   - panelId:  e.g. "GEN2-P01"
 *   - chapterId (optional): Prisma ComicChapter.id — when provided, the route
 *                            also writes the resulting URL to ComicPanel.artworkUrl
 *                            immediately (the PanelFormModal's Save button is
 *                            still the canonical source of truth, but providing
 *                            chapterId lets us persist right after upload).
 *
 * Successful response (200):
 *   {
 *     success: true,
 *     url:          "<public Supabase URL>",
 *     artworkUrl:   "<same as url>",                // alias preferred by frontend
 *     path:         "<storage path>",
 *     artworkPath:  "<same as path>",               // alias
 *     message:      "Artwork uploaded successfully"
 *   }
 *
 * Error response (always JSON — never empty / never HTML):
 *   { success: false, error: "<human-readable message>", missing?: "<env var name>" }
 *
 * Storage architecture:
 *   - Provider: Supabase Storage (same Supabase project as auth + DB)
 *   - Bucket:   believ-comic-artwork (public — artwork viewable by all users)
 *   - Path:     bible-comics/{bookId}/{chapter}/{panelId}.webp
 *   - Uploads use the service-role key (server-side only, bypasses RLS)
 *   - Public read access — ComicView loads artwork without auth
 *   - Write/delete access is admin-only (enforced by requireAdmin())
 *
 * Security:
 *   - Admin-only (requireAdmin server-side check) — non-admins get HTTP 403 JSON
 *   - File type validation (image/png|jpeg|webp only, MIME-checked)
 *   - File size validation (max 10MB)
 *   - Path is sanitized and constructed server-side (no client control)
 *   - SUPABASE_SERVICE_ROLE_KEY is NEVER exposed to the browser
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const BUCKET_NAME = "believ-comic-artwork";

// Single shared Prisma client (avoid spawning a new one per request)
const db = new PrismaClient();

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------
async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

// ---------------------------------------------------------------------------
// Always-JSON helpers (so we NEVER return an empty body that would trigger
// "Unexpected end of JSON input" on the frontend)
// ---------------------------------------------------------------------------
function jsonOk(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(error: string, status = 500, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { success: false, error, ...extra },
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // 1) Admin check — non-admins get HTTP 403 with JSON (never empty)
    const admin = await requireAdmin();
    if (!admin) {
      return jsonError("Forbidden — admin access required", 403);
    }

    // 2) Verify Supabase service-role key is configured server-side
    if (
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY === "placeholder-service-role-key"
    ) {
      return jsonError(
        "Supabase Storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable in Vercel.",
        500,
        { missing: "SUPABASE_SERVICE_ROLE_KEY" }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return jsonError(
        "Supabase URL is not configured. Set NEXT_PUBLIC_SUPABASE_URL environment variable in Vercel.",
        500,
        { missing: "NEXT_PUBLIC_SUPABASE_URL" }
      );
    }

    // 3) Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bookId = formData.get("bookId") as string | null;
    const chapter = formData.get("chapter") as string | null;
    const panelId = formData.get("panelId") as string | null;
    const chapterId = formData.get("chapterId") as string | null;

    if (!file || !bookId || !chapter || !panelId) {
      return jsonError(
        "Missing required fields: file, bookId, chapter, panelId",
        400
      );
    }

    // 4) Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError(
        `Unsupported file type: ${file.type}. Allowed: PNG, JPG, JPEG, WEBP`,
        400
      );
    }

    // 5) Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return jsonError(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB`,
        400
      );
    }

    // 6) Sanitize path inputs — alphanumeric + hyphens only
    const safeBookId = bookId.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const safeChapter = String(chapter).replace(/[^0-9]/g, "");
    const safePanelId = panelId.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();

    if (!safeBookId || !safeChapter || !safePanelId) {
      return jsonError(
        `Invalid path inputs (bookId/chapter/panelId). Got: bookId="${bookId}", chapter="${chapter}", panelId="${panelId}"`,
        400
      );
    }

    // 7) Build the storage path: bible-comics/{bookId}/{chapter}/{panelId}.webp
    const storagePath = `bible-comics/${safeBookId}/${safeChapter}/${safePanelId}.webp`;

    // 8) Convert to WebP via sharp (quality 90 preserves comic detail)
    const buffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();

    // 9) Upload to Supabase Storage using the service-role client
    const supabase = createServiceClient();

    // Ensure the bucket exists (create if missing — idempotent)
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error("[upload] listBuckets error:", listError.message);
      return jsonError(
        `Failed to verify storage bucket: ${listError.message}`,
        500
      );
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        {
          public: true, // public read — artwork viewable by all users
          allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
          fileSizeLimit: MAX_FILE_SIZE,
        }
      );
      if (createError) {
        console.error("[upload] createBucket error:", createError.message);
        return jsonError(
          `Failed to create storage bucket "${BUCKET_NAME}": ${createError.message}`,
          500
        );
      }
      console.log(`[upload] Created bucket: ${BUCKET_NAME} (public)`);
    }

    // 10) Upload (upsert — replace if a file already exists at this path)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload] Supabase upload error:", uploadError.message);
      return jsonError(
        `Upload to Supabase Storage failed: ${uploadError.message}`,
        500
      );
    }

    // 11) Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      return jsonError(
        "Upload succeeded but Supabase returned no public URL",
        500
      );
    }

    // 12) Optionally persist the URL to ComicPanel.artworkUrl immediately.
    //     This is a convenience: the PanelFormModal Save button is still the
    //     canonical write path, but if chapterId is supplied we mirror the
    //     upload result into the DB so the panel reflects the new artwork
    //     even before the admin clicks Save.
    let dbUpdated = false;
    if (chapterId) {
      try {
        // Normalize panelId for the DB lookup (DB stores panelId uppercased
        // like "GEN2-P01", which matches safePanelId).
        const updated = await db.comicPanel.updateMany({
          where: {
            comicChapterId: chapterId,
            panelId: safePanelId,
          },
          data: { artworkUrl: publicUrl },
        });
        dbUpdated = updated.count > 0;
        if (!dbUpdated) {
          // Not fatal — the PanelFormModal Save will persist later.
          console.warn(
            `[upload] No ComicPanel row matched chapterId="${chapterId}" panelId="${safePanelId}" — DB update skipped (will be saved by panel Save).`
          );
        }
      } catch (dbErr: any) {
        console.error("[upload] DB update error:", dbErr?.message);
        // Don't fail the upload — the URL is already in Supabase Storage and
        // the PanelFormModal Save will persist it. Surface a warning instead.
        return jsonOk({
          success: true,
          url: publicUrl,
          artworkUrl: publicUrl,
          path: storagePath,
          artworkPath: storagePath,
          message:
            "Artwork uploaded to Supabase Storage, but DB update failed (will be saved when you click Save).",
          dbUpdated: false,
          dbWarning: dbErr?.message || "Unknown DB error",
        });
      }
    }

    // 13) Return success JSON (always valid JSON — never empty)
    return jsonOk({
      success: true,
      url: publicUrl,
      artworkUrl: publicUrl,
      path: storagePath,
      artworkPath: storagePath,
      filename: `${safePanelId}.webp`,
      originalSize: file.size,
      optimizedSize: webpBuffer.length,
      format: "webp",
      dbUpdated,
      message: "Artwork uploaded successfully",
    });
  } catch (error: any) {
    // Catch-all — ALWAYS return JSON, never let the runtime produce an empty
    // 500 response (which is what causes "Unexpected end of JSON input").
    console.error("[admin/comics/upload] Uncaught error:", error);
    return jsonError(
      error?.message || "Failed to upload artwork (unknown server error)",
      500
    );
  }
}

// ---------------------------------------------------------------------------
// Non-POST methods — return JSON 405 (never empty body)
// ---------------------------------------------------------------------------
export async function GET() {
  return jsonError("Method not allowed — use POST", 405);
}
export async function PUT() {
  return jsonError("Method not allowed — use POST", 405);
}
export async function DELETE() {
  return jsonError("Method not allowed — use POST", 405);
}
