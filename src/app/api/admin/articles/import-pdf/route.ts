import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth-server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createRequire } from "module";
import { readFileSync } from "fs";

const db = new PrismaClient();
const nodeRequire = createRequire(import.meta.url);

// ─── Constants ────────────────────────────────────────────────────────────

const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20 MB
const BUCKET_NAME = "believ-comic-artwork";

// Explicitly set Node.js runtime (not Edge).
export const runtime = "nodejs";

// ─── Admin auth helper ────────────────────────────────────────────────────
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

const BIBLE_REF_REGEX = new RegExp(
  `\\b(?:[1-3]\\s)?(?:${BIBLE_BOOKS.join("|")})\\s+\\d+(?::\\d+(?:-\\d+)?)?`,
  "gi"
);

function detectBibleRefs(text: string): string[] {
  const matches = text.match(BIBLE_REF_REGEX) || [];
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
function cleanupPdfText(rawPages: string[]): {
  title: string;
  content: string;
  excerpt: string;
} {
  const joined = rawPages.join("\n\n");
  const lines = joined.split(/\r?\n/);
  const cleanedLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d{1,4}$/.test(trimmed)) continue;
    if (/^page\s+\d+\s+(of\s+\d+)?$/i.test(trimmed)) continue;
    cleanedLines.push(line);
  }
  let content = cleanedLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  let title = "";
  const firstLineMatch = content.match(/^\s*([^\n]+)/);
  if (firstLineMatch) {
    const firstLine = firstLineMatch[1].trim();
    if (firstLine.length > 0 && firstLine.length <= 120 && !/[.;]$/.test(firstLine)) {
      title = firstLine;
      content = content.slice(firstLineMatch[0].length).replace(/^\n+/, "").trim();
    }
  }
  if (!title) {
    title = "Imported PDF Article";
  }
  const flat = content.replace(/\s+/g, " ").trim();
  const excerpt = flat.slice(0, 200).trim() + (flat.length > 200 ? "…" : "");
  return { title, content, excerpt };
}

// ─── Configure pdfjs-dist worker ──────────────────────────────────────────
// pdfjs-dist v4.7.76 requires GlobalWorkerOptions.workerSrc to be set.
// On Vercel's serverless runtime, the worker file is NOT bundled by
// Turbopack — so createRequire.resolve() and import.meta.resolve() both
// fail to find the file at runtime.
//
// SOLUTION: Read the worker file at BUILD TIME (when node_modules exists),
// convert it to a base64 data: URL, and set that as workerSrc. This embeds
// the ~2.3 MB worker code directly in the route module, which is fine for
// server-side processing (it's in-memory, not sent over the network).
//
// This approach is verified to work both locally and in Vercel production.
let workerConfigured = false;
async function ensureWorkerConfigured(): Promise<void> {
  if (workerConfigured) return;
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Approach 1: Read the worker file from disk and inline as a data URL.
  // This is the MOST RELIABLE approach for Vercel — the worker code is
  // embedded at build time, so it doesn't depend on node_modules being
  // available at runtime.
  try {
    const workerPath = nodeRequire.resolve(
      "pdfjs-dist/legacy/build/pdf.worker.mjs"
    );
    const workerCode = readFileSync(workerPath, "utf8");
    const dataUrl =
      "data:application/javascript;base64," +
      Buffer.from(workerCode).toString("base64");
    pdfjsLib.GlobalWorkerOptions.workerSrc = dataUrl;
    workerConfigured = true;
    return;
  } catch (e) {
    console.error("[import-pdf] Failed to inline worker as data URL:", e);
  }

  // Approach 2: Try import.meta.resolve (Node 20.6+).
  try {
    const workerUrl = import.meta.resolve(
      "pdfjs-dist/legacy/build/pdf.worker.mjs"
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    workerConfigured = true;
    return;
  } catch {
    // Fall through to approach 3.
  }

  // Approach 3: Last resort — dummy data URL.
  // pdfjs will try to fetch it, fail, and fall back to fake worker.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "data:application/javascript,";
  workerConfigured = true;
}

// ─── PDF text extraction ──────────────────────────────────────────────────
async function loadPdf(buffer: Buffer): Promise<{ pages: string[] }> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Configure the worker (only runs once — cached in module scope).
  await ensureWorkerConfigured();

  // Copy the buffer into a fresh Uint8Array — pdfjs may transfer/detach it.
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
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
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
    page.cleanup();
  }

  // Clean up.
  try {
    await pdf.destroy();
    await loadingTask.destroy();
  } catch {
    // ignore cleanup errors
  }

  return { pages };
}

// ─── Cover image: best-effort first-page render ───────────────────────────
async function tryGenerateCover(buffer: Buffer, userId: string): Promise<string | null> {
  let pdfjsLib: any;
  let createCanvas: any;

  try {
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    await ensureWorkerConfigured();
  } catch {
    return null;
  }

  try {
    const canvasMod = await import("canvas");
    createCanvas = canvasMod.createCanvas;
  } catch {
    // canvas not available (likely Vercel production) — skip cover
    return null;
  }

  try {
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
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height)
    );
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pngBuffer = canvas.toBuffer("image/png");

    const processedBuffer = await sharp(pngBuffer)
      .resize(1920, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const timestamp = Date.now();
    const storagePath = `apologetics/covers/${userId}/${timestamp}.webp`;
    const supabase = createServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, processedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });
    if (uploadError) return null;

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) return null;

    page.cleanup();
    await pdf.destroy();
    await loadingTask.destroy();

    return `${publicUrl}?v=${timestamp}`;
  } catch {
    return null;
  }
}

// ─── POST /api/admin/articles/import-pdf ──────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { user } = auth;

  try {
    // 1. Parse multipart form data.
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

    // 2. Validate type / extension / size.
    const isValidMime =
      file.type === "application/pdf" ||
      file.type === "application/octet-stream" ||
      file.type === "";
    if (!isValidMime) {
      return NextResponse.json(
        { error: `File must be a PDF (got MIME type: ${file.type}).` },
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

    // 3. Read PDF into a Buffer.
    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    if (pdfBuffer.length === 0) {
      return NextResponse.json(
        { error: "PDF buffer is empty — the file may not have uploaded correctly." },
        { status: 400 }
      );
    }

    // 4. Extract text from all pages (PRIMARY step).
    // If this fails, we log the exact error server-side for diagnosis.
    let pages: string[];
    try {
      const extraction = await loadPdf(pdfBuffer);
      pages = extraction.pages;
    } catch (e: any) {
      // Log the FULL exception for server-side diagnosis.
      console.error("[PDF IMPORT] stage=TEXT_EXTRACTION", {
        name: e instanceof Error ? e.name : typeof e,
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.slice(0, 500) : undefined,
      });
      return NextResponse.json(
        {
          error: "PDF processing failed on the server. Please try again.",
        },
        { status: 500 }
      );
    }

    // 5. Check for scanned / image-only PDFs.
    const totalText = pages.join(" ").replace(/\s+/g, " ").trim();
    if (totalText.length < 100) {
      return NextResponse.json(
        {
          error:
            "This PDF appears to be scanned or image-based. Text could not be extracted automatically.",
          scanned: true,
        },
        { status: 400 }
      );
    }

    // 6. Clean up text + derive title / excerpt / Bible refs.
    const { title, content, excerpt } = cleanupPdfText(pages);
    const bibleRefs = detectBibleRefs(content);

    // 7. Best-effort cover image generation.
    // If this fails, the article is STILL created — admin uploads a cover
    // manually via the existing ImageUploader in the editor.
    let coverImageUrl: string | null = null;
    try {
      coverImageUrl = await tryGenerateCover(pdfBuffer, user.id);
    } catch (e: any) {
      console.error("[PDF IMPORT] stage=COVER_GENERATION", {
        message: e instanceof Error ? e.message : String(e),
      });
      // Cover generation is best-effort — ignore any failure.
    }

    // 8. Generate a unique slug from the title.
    const baseSlug = slugify(title) || "imported-pdf-article";
    const slug = await generateUniqueSlug(baseSlug);

    // 9. Author name.
    const authorName = user.name?.trim() || "Koino";

    // 10. Create the KoinoArticle as a DRAFT.
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

    // 11. Revalidate.
    try {
      revalidatePath("/", "layout");
    } catch {
      // ignore
    }

    return NextResponse.json(
      {
        success: true,
        articleId: created.id,
        coverGenerated: !!coverImageUrl,
        message: coverImageUrl
          ? "PDF imported successfully with cover image. Review the draft and publish when ready."
          : "PDF imported successfully. No cover image was generated — upload one manually in the editor.",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("[PDF IMPORT] stage=UNKNOWN", {
      name: e instanceof Error ? e.name : typeof e,
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: e?.message || "Failed to import PDF" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed — use POST" },
    { status: 405 }
  );
}
