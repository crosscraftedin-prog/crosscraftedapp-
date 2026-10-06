import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

/**
 * POST /api/admin/comics/upload
 *
 * Uploads comic panel artwork to the server's public/ directory.
 * Converts to WebP for optimization. Returns the public URL path.
 *
 * Body: multipart/form-data with:
 *   - file: the image file (PNG/JPG/WEBP, max 10MB)
 *   - bookId: e.g. "genesis"
 *   - chapter: e.g. "2"
 *   - panelId: e.g. "GEN2-P01"
 *
 * Response: { url: "/comic-artwork/genesis/2/GEN2-P01.webp" }
 */
async function requireAdmin() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: PNG, JPG, JPEG, WEBP` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` },
        { status: 400 }
      );
    }

    const safeBookId = bookId.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
    const safeChapter = String(chapter).replace(/[^0-9]/g, "");
    const safePanelId = panelId.replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase();

    if (!safeBookId || !safeChapter || !safePanelId) {
      return NextResponse.json({ error: "Invalid bookId, chapter, or panelId" }, { status: 400 });
    }

    const storageDir = path.join(process.cwd(), "public", "comic-artwork", safeBookId, safeChapter);
    const filename = `${safePanelId}.webp`;
    const filePath = path.join(storageDir, filename);
    const publicUrl = `/comic-artwork/${safeBookId}/${safeChapter}/${filename}`;

    await mkdir(storageDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());

    await sharp(buffer)
      .webp({ quality: 90 })
      .toFile(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
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
