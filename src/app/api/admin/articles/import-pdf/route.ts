import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { createRequire } from "module";
import sharp from "sharp";

const db = new PrismaClient();

// createRequire lets us use require.resolve inside an ESM module so we can
// point pdfjs-dist's worker at the correct absolute path on disk.
const nodeRequire = createRequire(import.meta.url);

// ─── Constants ────────────────────────────────────────────────────────────

const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20 MB
const BUCKET_NAME = "believ-comic-artwork";

// ─── Admin auth helper ────────────────────────────────────────────────────
// Mirrors the pattern in /api/admin/articles/route.ts. Returns 401 (not
// signed in) vs 403 (signed in but not admin) so the client can distinguish.
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

// ─── Helpers ──────────────────────────────────────────────────────────────

// Slugify a title into a URL-safe slug. Lowercase, hyphen-separated, ASCII.
// Inlined (not imported from /api/admin/articles/route.ts) because Next.js
// route files are endpoints, not regular modules — importing from them is
// fragile under Turbopack.
function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Generate a unique slug for a KoinoArticle. If the base slug is taken,
// append `-2`, `-3`, etc. Scoped to KoinoArticle (not BlogPost).
async function generateUniqueSlug(base: string): Promise<string> {
  const root = base || "article";
  let candidate = root;
  let n = 2;
  while (n < 22) {
    const existing = await db.koinoArticle.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
  return `${root}-${Date.now()}`;
}

// ─── Bible reference detection ────────────────────────────────────────────
// Matches patterns like:
//   John 3:16
//   1 Cor 15:3-4
//   Romans 1:20
//   1 John 4:8
//   Genesis 1:1
// Captures the full reference (book + chapter:verse[-verse]) and de-dupes.
const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "Samuel", "Kings", "Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalm", "Psalms", "Proverbs", "Ecclesiastes",
  "Song of Solomon", "Song of Songs", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "Thessalonians",
  "Timothy", "Titus", "Philemon", "Hebrews", "James", "Peter", "Jude",
  "Revelation",
];

// Build a regex that matches:
//   (optional 1/2/3 prefix + space) + (book name) + (space) + (chapter[:verse[-verse]])
const BIBLE_REF_REGEX = new RegExp(
  `\\b(?:[1-3]\\s)?(?:${BIBLE_BOOKS.join("|")})\\s+\\d+(?::\\d+(?:-\\d+)?)?`,
  "gi"
);

function detectBibleRefs(text: string): string[] {
  const matches = text.match(BIBLE_REF_REGEX) || [];
  // Normalize whitespace (collapse "1  Cor" → "1 Cor") and de-dupe case-insensitively.
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of matches) {
    const ref = raw.replace(/\s+/g, " ").trim();
    const key = ref.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ref);
    }
  }
  return result;
}

// ─── PDF text cleanup ─────────────────────────────────────────────────────
// Join page texts, strip page numbers + obvious running headers/footers,
// collapse excessive blank lines, derive a title from the first non-empty
// line, and generate an excerpt from the first 200 chars of body content.
function cleanupPdfText(rawPages: string[]): {
  title: string;
  content: string;
  excerpt: string;
} {
  // Join all pages with a blank line separator.
  const joined = rawPages.join("\n\n");

  // Split into lines and filter out noise.
  const lines = joined.split(/\r?\n/);
  const cleanedLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip lines that are just a number (page numbers).
    if (/^\d{1,4}$/.test(trimmed)) continue;
    // Skip lines that look like "Page X of Y" running footers.
    if (/^page\s+\d+\s+(of\s+\d+)?$/i.test(trimmed)) continue;
    cleanedLines.push(line);
  }

  // Re-join, then collapse 3+ consecutive newlines into 2 (one blank line).
  let content = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  // Derive a title from the first non-empty line.
  let title = "";
  const firstLineMatch = content.match(/^\s*([^\n]+)/);
  if (firstLineMatch) {
    const firstLine = firstLineMatch[1].trim();
    // Heuristic: if the first line is short (≤ 120 chars) and doesn't end with
    // a period, treat it as a title. Otherwise derive a fallback title.
    if (firstLine.length > 0 && firstLine.length <= 120 && !/[.;]$/.test(firstLine)) {
      title = firstLine;
      // Remove the title line from the content so the body starts cleanly.
      content = content.slice(firstLineMatch[0].length).replace(/^\n+/, "").trim();
    }
  }
  if (!title) {
    title = "Imported PDF Article";
  }

  // Generate an excerpt from the first 200 chars of body content (after the
  // title is removed). Strip newlines for a single-line excerpt.
  const flat = content.replace(/\s+/g, " ").trim();
  const excerpt = flat.slice(0, 200).trim() + (flat.length > 200 ? "…" : "");

  return { title, content, excerpt };
}

// ─── PDF text extraction ──────────────────────────────────────────────────

type PdfExtractionResult = {
  pages: string[];
  loadingTask: { destroy: () => Promise<void> };
};

// Dynamically import pdfjs-dist so its ESM bundle is only loaded when this
// endpoint is actually called (keeps the Next.js server bundle small and
// avoids any build-time ESM/CJS interop issues).
async function loadPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Point pdfjs at its worker file. On Node.js the worker is spawned via
  // worker_threads using this path. createRequire gives us the absolute
  // path on disk regardless of how Next.js bundled the route.
  try {
    const workerPath = nodeRequire.resolve(
      "pdfjs-dist/legacy/build/pdf.worker.mjs"
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
  } catch {
    // If the worker file can't be resolved for some reason, leave the
    // default — pdfjs will fall back to a fake worker on the main thread.
  }

  // getDocument transfers the typed array to the worker. Pass a fresh copy
  // so the original Buffer stays intact for the cover-image render step.
  const data = new Uint8Array(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );
  const loadingTask = pdfjsLib.getDocument({
    data,
    // Disable system fonts + worker fetch — these would try to use the
    // browser Fetch API which doesn't exist on Node.js.
    useSystemFonts: false,
    useWorkerFetch: false,
    // Don't try to evaluate PostScript calculator functions — safer on Node.
    isEvalSupported: false,
    // Quieten the chatty pdfjs console output.
    verbosity: 0,
  });

  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // Reconstruct text preserving line breaks where pdfjs signals them.
    // Items with a `hasEOL` flag mark the end of a line.
    let line = "";
    const pageLines: string[] = [];
    for (const item of textContent.items as any[]) {
      const str = item?.str ?? "";
      line += str;
      if (item?.hasEOL) {
        pageLines.push(line);
        line = "";
      }
    }
    if (line) pageLines.push(line);
    pages.push(pageLines.join("\n"));
    // Clean up the page to free memory.
    page.cleanup();
  }

  return { pages, loadingTask };
}

// ─── Cover image: render first PDF page to a PNG buffer ────────────────────

// Returns a PNG image Buffer of the first page rendered at 2x scale, or null
// if rendering fails for any reason. The caller will further process this
// with sharp (resize + WebP) before uploading to Supabase Storage.
async function renderFirstPageToPng(buffer: Buffer): Promise<Buffer | null> {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const { createCanvas } = await import("canvas");

    try {
      const workerPath = nodeRequire.resolve(
        "pdfjs-dist/legacy/build/pdf.worker.mjs"
      );
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
    } catch {
      // ignore — fake worker fallback
    }

    const data = new Uint8Array(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    );
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: false,
      useWorkerFetch: false,
      isEvalSupported: false,
      verbosity: 0,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // 2x scale gives a high-res render suitable for a 1920px-wide cover.
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const ctx = canvas.getContext("2d");

    // White background so transparent PDFs (rare but possible) don't render
    // as black on the cover.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx as any,
      viewport,
    }).promise;

    const pngBuffer = canvas.toBuffer("image/png");

    // Clean up.
    page.cleanup();
    await pdf.destroy();
    await loadingTask.destroy();

    return pngBuffer;
  } catch (e) {
    // Rendering can fail for many reasons (encrypted PDFs, malformed PDFs,
    // missing fonts, etc.). Return null so the caller can still create the
    // article without a cover image.
    console.error("[import-pdf] renderFirstPageToPng failed:", e);
    return null;
  }
}

// Process a PNG image buffer into a 1920px-wide WebP for use as a cover.
// Returns the processed buffer.
async function processCoverImage(pngBuffer: Buffer): Promise<Buffer> {
  return sharp(pngBuffer)
    .resize(1920, null, { withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

// Upload a processed image buffer to Supabase Storage. Returns the public
// URL (with cache-busting ?v=) or null if the upload failed.
async function uploadCoverImage(
  imageBuffer: Buffer,
  userId: string
): Promise<string | null> {
  try {
    const timestamp = Date.now();
    const storagePath = `apologetics/covers/${userId}/${timestamp}.webp`;

    const supabase = createServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imageBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("[import-pdf] Supabase upload error:", uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) return null;
    return `${publicUrl}?v=${timestamp}`;
  } catch (e) {
    console.error("[import-pdf] uploadCoverImage failed:", e);
    return null;
  }
}

// ─── POST /api/admin/articles/import-pdf ──────────────────────────────────

/**
 * POST /api/admin/articles/import-pdf
 *
 * Admin-only. Accepts multipart/form-data with a `file` field containing a
 * PDF. Extracts text from every page, derives a title + excerpt, detects
 * Bible references, renders the first page to an image for the cover, then
 * creates a KoinoArticle (contentType="APOLOGETICS", status="draft").
 *
 * Validation:
 *   - file field is required (400 if missing)
 *   - MIME type must be application/pdf (400 otherwise)
 *   - extension must be .pdf (400 otherwise)
 *   - size ≤ 20 MB (400 otherwise)
 *
 * Returns:
 *   - 201: { success: true, articleId, message }
 *   - 400 (scanned PDF): { error: "...scanned/image-based…", scanned: true }
 *   - 400/401/403/500: { error: "..." }
 */
export async function POST(req: NextRequest) {
  // 1. Admin auth.
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { user } = auth;

  // 2. Supabase Storage must be configured for cover-image upload.
  if (
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY === "placeholder-service-role-key"
  ) {
    return NextResponse.json(
      { error: "Supabase Storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  try {
    // 3. Parse multipart form data.
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Expected multipart/form-data with a 'file' field." },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Upload a PDF using the 'file' field." },
        { status: 400 }
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Invalid file. The 'file' field must be a file upload." },
        { status: 400 }
      );
    }

    // 4. Validate type / extension / size.
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF (MIME type application/pdf)." },
        { status: 400 }
      );
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "File must have a .pdf extension." },
        { status: 400 }
      );
    }
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: "PDF must be under 20 MB." },
        { status: 400 }
      );
    }

    // 5. Read PDF into a Buffer.
    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    // 6. Extract text from all pages.
    let extraction: PdfExtractionResult;
    try {
      extraction = await loadPdf(pdfBuffer);
    } catch (e: any) {
      console.error("[import-pdf] loadPdf failed:", e);
      return NextResponse.json(
        {
          error:
            "Could not read this PDF. It may be corrupted, encrypted, or in an unsupported format.",
        },
        { status: 400 }
      );
    }

    const { pages, loadingTask } = extraction;

    // 7. Check for scanned / image-only PDFs. If the total extracted text
    //    is very short, it's almost certainly a scanned PDF — surface a
    //    clear error so the admin knows OCR would be needed.
    const totalText = pages.join(" ").replace(/\s+/g, " ").trim();
    if (totalText.length < 100) {
      try {
        await loadingTask.destroy();
      } catch {
        // ignore
      }
      return NextResponse.json(
        {
          error:
            "This PDF appears to be scanned or image-based. Text could not be extracted automatically.",
          scanned: true,
        },
        { status: 400 }
      );
    }

    // 8. Clean up text + derive title / excerpt / Bible refs.
    const { title, content, excerpt } = cleanupPdfText(pages);
    const bibleRefs = detectBibleRefs(content);

    // 9. Try to render the first page → cover image. If rendering or upload
    //    fails, we still create the article — admin can upload a cover
    //    manually via the existing ImageUploader in the editor.
    let coverImageUrl: string | null = null;
    const pngBuffer = await renderFirstPageToPng(pdfBuffer);
    if (pngBuffer) {
      try {
        const processedBuffer = await processCoverImage(pngBuffer);
        coverImageUrl = await uploadCoverImage(processedBuffer, user.id);
      } catch (e) {
        console.error("[import-pdf] cover image processing failed:", e);
        // Continue without a cover.
      }
    }

    // 10. Clean up the pdfjs loading task.
    try {
      await loadingTask.destroy();
    } catch {
      // ignore
    }

    // 11. Generate a unique slug from the title.
    const baseSlug = slugify(title) || "imported-pdf-article";
    const slug = await generateUniqueSlug(baseSlug);

    // 12. Author name — fall back to "Koino" if the admin has no name set.
    const authorName = user.name?.trim() || "Koino";

    // 13. Create the KoinoArticle as a DRAFT. Admin reviews/edits/publishes
    //     via the existing editor.
    const created = await db.koinoArticle.create({
      data: {
        title,
        slug,
        contentType: "APOLOGETICS",
        content,
        excerpt: excerpt || null,
        coverImageUrl,
        authorName,
        status: "draft",
        difficulty: "BEGINNER",
        bibleRefs: JSON.stringify(bibleRefs),
        reviewedBy: user.id,
        reviewedAt: new Date(),
        seoTitle: title,
        seoDescription: excerpt || null,
      },
    });

    // 14. Invalidate the public apologetics page cache so the new draft
    //     doesn't appear until the admin publishes it (the public page
    //     filters by status="published", so this is a no-op until then,
    //     but we revalidate anyway in case the listing page changes).
    try {
      revalidatePath("/", "layout");
    } catch {
      // ignore
    }

    return NextResponse.json(
      {
        success: true,
        articleId: created.id,
        message: coverImageUrl
          ? "PDF imported successfully. Review the draft and publish when ready."
          : "PDF imported successfully, but no cover image could be generated. Upload one manually in the editor.",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("[admin/articles/import-pdf] POST error:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to import PDF" },
      { status: 500 }
    );
  }
}

// GET — return 405 so the route doesn't accidentally serve a 404 / empty body
// if someone hits it in a browser. Mirrors the /api/admin/comics/upload
// pattern.
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed — use POST" },
    { status: 405 }
  );
}
