import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import sharp from "sharp";

// ─── Configuration ─────────────────────────────────────────────────────────
// Reuses the existing Koino storage architecture:
//   - Bucket: "believ-comic-artwork" (same bucket used for events, avatars,
//     comic panels — single shared Supabase Storage bucket)
//   - Service client: createServiceClient() from @/lib/supabase/service
//     (uses SUPABASE_SERVICE_ROLE_KEY — server-only, never exposed to browser)
//   - Image processing: sharp (resize + WebP conversion — same as events)
//
// Storage path pattern: apologetics/<admin-user-id>/<timestamp>-<random>.webp
// Unique filenames prevent accidental overwrites.

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (per spec)
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const BUCKET_NAME = "believ-comic-artwork";

// Admin auth helper — same pattern as all other admin routes.
// Returns 401 (not signed in) vs 403 (signed in but not admin).
async function requireAdmin(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>; response: null }
  | { user: null; response: NextResponse }
> {
  const user = await getAuthUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }
  if (user.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }
  return { user, response: null };
}

/**
 * POST /api/admin/upload
 *
 * Admin-only — uploads an image to Supabase Storage and returns the public URL.
 * Used by the Apologetics article editor for:
 *   1. Cover images (stored in KoinoArticle.coverImageUrl)
 *   2. Inline article images (stored in markdown content as ![alt](url))
 *
 * Security:
 *   - Requires server-side admin authentication (getAuthUser + role=admin)
 *   - Validates MIME type AND file extension
 *   - Validates file size (max 10 MB)
 *   - Processes the image with sharp (resize max 1920px wide, convert to WebP)
 *   - Stores via server-side Supabase service client (service-role key never
 *     exposed to browser)
 *   - Uses unique filenames (timestamp + random suffix) to prevent overwrites
 *
 * Request: multipart/form-data with `file` field (the image)
 * Response: { success: true, url: "https://..." } | { error: "..." }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const user = auth.user;

    // ─── Verify Supabase is configured ────────────────────────────────
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY === "placeholder-service-role-key") {
      return NextResponse.json(
        { error: "Supabase Storage is not configured." },
        { status: 500 }
      );
    }

    // ─── Parse the multipart form ──────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // ─── Validate MIME type ────────────────────────────────────────────
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Image must be JPG, PNG, or WEBP." },
        { status: 400 }
      );
    }

    // ─── Validate file extension (defense-in-depth) ───────────────────
    const fileName = (file.name || "").toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: "Image must have a .jpg, .jpeg, .png, or .webp extension." },
        { status: 400 }
      );
    }

    // ─── Validate file size ────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 10 MB." },
        { status: 400 }
      );
    }

    // ─── Process the image with sharp ──────────────────────────────────
    // Resize to max 1920px wide (preserve aspect ratio, no enlargement),
    // convert to WebP for smaller file size + browser compatibility.
    const buffer = Buffer.from(await file.arrayBuffer());
    const processedBuffer = await sharp(buffer)
      .resize(1920, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // ─── Generate a unique storage path ────────────────────────────────
    // Pattern: apologetics/<admin-user-id>/<timestamp>-<random>.webp
    // The timestamp + random suffix ensures uniqueness even if the same
    // admin uploads multiple images in rapid succession.
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const storagePath = `apologetics/${user.id}/${timestamp}-${randomSuffix}.webp`;

    // ─── Upload to Supabase Storage ───────────────────────────────────
    const supabase = createServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, processedBuffer, {
        contentType: "image/webp",
        upsert: false, // never overwrite — unique paths
      });

    if (uploadError) {
      console.error("[api/admin/upload] Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Unable to upload image. Please try again." },
        { status: 500 }
      );
    }

    // ─── Get the public URL ───────────────────────────────────────────
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json(
        { error: "Upload succeeded but no URL returned." },
        { status: 500 }
      );
    }

    // Add cache-bust query param so the browser fetches the new image
    // instead of serving a stale cached version.
    const versionedUrl = `${publicUrl}?v=${timestamp}`;

    console.log(`[api/admin/upload] Image uploaded: ${storagePath} (by ${user.email})`);

    return NextResponse.json({
      success: true,
      url: versionedUrl,
      path: storagePath, // for potential future cleanup (not used by client)
    });
  } catch (error: any) {
    console.error("[api/admin/upload] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image." },
      { status: 500 }
    );
  }
}
