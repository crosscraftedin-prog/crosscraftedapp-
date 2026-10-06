import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import sharp from "sharp";

/**
 * POST /api/admin/comics/upload
 *
 * Uploads comic panel artwork to Supabase Storage (persistent across deployments).
 * Converts to WebP for optimization. Returns the public URL.
 *
 * Body: multipart/form-data with:
 *   - file: the image file (PNG/JPG/WEBP, max 10MB)
 *   - bookId: e.g. "genesis"
 *   - chapter: e.g. "2"
 *   - panelId: e.g. "GEN2-P01"
 *
 * Response: { url: "https://ffslazyedqbbuuyfytnq.supabase.co/storage/v1/object/public/believ-comic-artwork/bible-comics/genesis/2/GEN2-P01.webp" }
 *
 * Storage architecture:
 *   - Bucket: believ-comic-artwork (public — artwork is publicly viewable)
 *   - Path: bible-comics/{bookId}/{chapter}/{panelId}.webp
 *   - Uploads use the service-role key (server-side only, bypasses RLS)
 *   - Public read access allows ComicView to load artwork without auth
 *   - Write/delete access is admin-only (enforced by requireAdmin())
 *
 * Security:
 *   - Admin-only (requireAdmin server-side check)
 *   - File type validation (image/* only, checked via MIME type)
 *   - File size validation (max 10MB)
 *   - Path is sanitized and constructed server-side (no client control over path)
 *   - Service role key is NEVER exposed to the browser
 */

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const BUCKET_NAME = "believ-comic-artwork";

export async function POST(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Check that the service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === "placeholder-service-role-key") {
      return NextResponse.json(
        {
          error: "Supabase Storage not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable in Vercel.",
          missing: "SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bookId = formData.get("bookId") as string | null;
    const chapter = formData.get("chapter") as string | null;
    const panelId = formData.get("panelId") as string | null;

    if (!file || !bookId || !chapter || !panelId) {
      return NextResponse.json(
        { error: "Missing required fields: file, bookId, chapter, panelId" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: PNG, JPG, JPEG, WEBP` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` },
        { status: 400 }
      );
    }

    // Sanitize inputs — only allow alphanumeric + hyphens
    const safeBookId = bookId.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const safeChapter = String(chapter).replace(/[^0-9]/g, "");
    const safePanelId = panelId.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();

    if (!safeBookId || !safeChapter || !safePanelId) {
      return NextResponse.json({ error: "Invalid bookId, chapter, or panelId" }, { status: 400 });
    }

    // Build the storage path: bible-comics/{bookId}/{chapter}/{panelId}.webp
    const storagePath = `bible-comics/${safeBookId}/${safeChapter}/${safePanelId}.webp`;

    // Read the uploaded file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert to WebP using sharp (optimized for web, good quality at smaller size)
    // Quality 90 preserves comic artwork detail while reducing file size
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 90 })
      .toBuffer();

    // Upload to Supabase Storage using the service-role client
    const supabase = createServiceClient();

    // Ensure the bucket exists (create if it doesn't)
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // public read access — artwork is viewable by all users
        allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
        fileSizeLimit: MAX_FILE_SIZE,
      });

      if (createError) {
        console.error("[upload] Failed to create bucket:", createError.message);
        return NextResponse.json(
          { error: `Failed to create storage bucket: ${createError.message}` },
          { status: 500 }
        );
      }
      console.log(`[upload] Created bucket: ${BUCKET_NAME} (public)`);
    }

    // Upload the WebP file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, webpBuffer, {
        contentType: "image/webp",
        upsert: true, // replace if file already exists at this path
      });

    if (uploadError) {
      console.error("[upload] Supabase upload error:", uploadError.message);
      return NextResponse.json(
        { error: `Upload to storage failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath,
      filename: `${safePanelId}.webp`,
      originalSize: file.size,
      optimizedSize: webpBuffer.length,
      format: "webp",
    });
  } catch (error: any) {
    console.error("[admin/comics/upload] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload artwork" },
      { status: 500 }
    );
  }
}
