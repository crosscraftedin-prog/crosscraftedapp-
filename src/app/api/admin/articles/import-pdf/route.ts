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

const MAX_PDF_SIZE = 20 * 1024 * 1024;
const BUCKET_NAME = "believ-comic-artwork";

export const runtime = "nodejs";

async function requireAdmin(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>; response: null }
  | { user: null; response: NextResponse }
> {
  const user = await getAuthUser();
  if (!user) return { user: null, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (user.role !== "admin") return { user: null, response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  return { user, response: null };
}

function slugify(input: string): string {
  return input.toString().toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 80);
}

async function generateUniqueSlug(base: string): Promise<string> {
  const root = base || "article";
  let candidate = root;
  let n = 2;
  while (n < 22) {
    const existing = await db.koinoArticle.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
  return `${root}-${Date.now()}`;
}

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
  `\\b(?:[1-3]\\s)?(?:${BIBLE_BOOKS.join("|")})\\s+\\d+(?::\\d+(?:-\\d+)?)?`, "gi"
);

function detectBibleRefs(text: string): string[] {
  const matches = text.match(BIBLE_REF_REGEX) || [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of matches) {
    const ref = raw.replace(/\s+/g, " ").trim();
    const key = ref.toLowerCase();
    if (!seen.has(key)) { seen.add(key); result.push(ref); }
  }
  return result;
}

function cleanupPdfText(rawPages: string[]): { title: string; content: string; excerpt: string } {
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
  if (!title) title = "Imported PDF Article";
  const flat = content.replace(/\s+/g, " ").trim();
  const excerpt = flat.slice(0, 200).trim() + (flat.length > 200 ? "…" : "");
  return { title, content, excerpt };
}

// ─── Configure pdfjs-dist worker ──────────────────────────────────────────
let workerConfigured = false;
async function ensureWorkerConfigured(): Promise<void> {
  if (workerConfigured) return;
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Approach 1: Read the worker file from disk and inline as a base64 data URL.
  try {
    const workerPath = nodeRequire.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
    console.log("[PDF IMPORT] worker: resolved workerPath =", workerPath);
    const workerCode = readFileSync(workerPath, "utf8");
    console.log("[PDF IMPORT] worker: read workerCode, length =", workerCode.length);
    const dataUrl = "data:application/javascript;base64," + Buffer.from(workerCode).toString("base64");
    console.log("[PDF IMPORT] worker: created data URL, length =", dataUrl.length);
    pdfjsLib.GlobalWorkerOptions.workerSrc = dataUrl;
    console.log("[PDF IMPORT] worker: set GlobalWorkerOptions.workerSrc successfully");
    workerConfigured = true;
    return;
  } catch (e: any) {
    console.error("[PDF IMPORT] worker: FAILED to inline worker as data URL:", {
      name: e?.name, message: e?.message,
    });
  }

  // Approach 2: Try import.meta.resolve (Node 20.6+).
  try {
    const workerUrl = import.meta.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
    console.log("[PDF IMPORT] worker: resolved via import.meta.resolve:", workerUrl);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    workerConfigured = true;
    return;
  } catch (e: any) {
    console.error("[PDF IMPORT] worker: import.meta.resolve failed:", e?.message);
  }

  // Approach 3: Last resort — dummy data URL.
  console.warn("[PDF IMPORT] worker: FALLING BACK to dummy data URL");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "data:application/javascript,";
  workerConfigured = true;
}

// ─── PDF text extraction ──────────────────────────────────────────────────
async function loadPdf(buffer: Buffer): Promise<{ pages: string[] }> {
  console.log("[PDF IMPORT] loadPdf: starting, buffer.length =", buffer.length);
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  console.log("[PDF IMPORT] loadPdf: pdfjsLib imported, keys:", Object.keys(pdfjsLib).slice(0, 5).join(","));

  await ensureWorkerConfigured();
  console.log("[PDF IMPORT] loadPdf: worker configured =", workerConfigured);

  const data = new Uint8Array(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  );
  console.log("[PDF IMPORT] loadPdf: data.length =", data.length, "first 5 bytes:", Array.from(data.slice(0, 5)).join(","));

  console.log("[PDF IMPORT] loadPdf: calling getDocument...");
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: false,
    useWorkerFetch: false,
    isEvalSupported: false,
    verbosity: 0,
  });
  console.log("[PDF IMPORT] loadPdf: loadingTask created, awaiting promise...");

  const pdf = await loadingTask.promise;
  console.log("[PDF IMPORT] loadPdf: PDF loaded! numPages =", pdf.numPages);

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let line = "";
    const pageLines: string[] = [];
    for (const item of textContent.items as any[]) {
      const str = item?.str ?? "";
      line += str;
      if (item?.hasEOL) { pageLines.push(line); line = ""; }
    }
    if (line) pageLines.push(line);
    pages.push(pageLines.join("\n"));
    console.log("[PDF IMPORT] loadPdf: page", i, "extracted", pageLines.length, "lines");
    page.cleanup();
  }

  try { await pdf.destroy(); await loadingTask.destroy(); } catch {}
  console.log("[PDF IMPORT] loadPdf: complete, returning", pages.length, "pages");
  return { pages };
}

// ─── Cover image: best-effort ─────────────────────────────────────────────
async function tryGenerateCover(buffer: Buffer, userId: string): Promise<string | null> {
  let pdfjsLib: any;
  let createCanvas: any;

  try { pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs"); await ensureWorkerConfigured(); }
  catch { return null; }

  try { const canvasMod = await import("canvas"); createCanvas = canvasMod.createCanvas; }
  catch { console.log("[PDF IMPORT] cover: canvas not available, skipping"); return null; }

  try {
    const data = new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: false, useWorkerFetch: false, isEvalSupported: false, verbosity: 0 });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const pngBuffer = canvas.toBuffer("image/png");
    const processedBuffer = await sharp(pngBuffer).resize(1920, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    const timestamp = Date.now();
    const storagePath = `apologetics/covers/${userId}/${timestamp}.webp`;
    const supabase = createServiceClient();
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, processedBuffer, { contentType: "image/webp", upsert: true });
    if (uploadError) return null;
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) return null;
    page.cleanup(); await pdf.destroy(); await loadingTask.destroy();
    return `${publicUrl}?v=${timestamp}`;
  } catch { return null; }
}

// ─── POST ────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log("[PDF IMPORT] ===== POST request received =====");
  const auth = await requireAdmin();
  if (auth.response) { console.log("[PDF IMPORT] auth failed"); return auth.response; }
  const { user } = auth;
  console.log("[PDF IMPORT] auth success, user =", user.email);

  try {
    // 1. Parse multipart form data.
    let formData: FormData;
    try {
      formData = await req.formData();
      console.log("[PDF IMPORT] formData parsed");
    } catch (e: any) {
      console.error("[PDF IMPORT] formData parse failed:", e?.message);
      return NextResponse.json({ error: "Expected multipart/form-data with a 'file' field." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file) { console.error("[PDF IMPORT] no file field"); return NextResponse.json({ error: "No file provided." }, { status: 400 }); }
    if (!(file instanceof File)) { console.error("[PDF IMPORT] file is not a File instance"); return NextResponse.json({ error: "Invalid file." }, { status: 400 }); }

    console.log("[PDF IMPORT] file received:", { name: file.name, size: file.size, type: file.type });

    // 2. Validate.
    const isValidMime = file.type === "application/pdf" || file.type === "application/octet-stream" || file.type === "";
    if (!isValidMime) { console.error("[PDF IMPORT] invalid MIME:", file.type); return NextResponse.json({ error: `File must be a PDF (got MIME type: ${file.type}).` }, { status: 400 }); }
    if (!file.name.toLowerCase().endsWith(".pdf")) { console.error("[PDF IMPORT] no .pdf extension"); return NextResponse.json({ error: "File must have a .pdf extension." }, { status: 400 }); }
    if (file.size > MAX_PDF_SIZE) { console.error("[PDF IMPORT] file too large:", file.size); return NextResponse.json({ error: "PDF must be under 20 MB." }, { status: 400 }); }

    // 3. Read PDF into a Buffer.
    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    console.log("[PDF IMPORT] buffer created, length =", pdfBuffer.length, "first 5 bytes:", Array.from(pdfBuffer.slice(0, 5)).join(","));

    if (pdfBuffer.length === 0) { console.error("[PDF IMPORT] empty buffer"); return NextResponse.json({ error: "PDF buffer is empty." }, { status: 400 }); }

    // 4. Extract text (PRIMARY step).
    let pages: string[];
    try {
      console.log("[PDF IMPORT] calling loadPdf...");
      const extraction = await loadPdf(pdfBuffer);
      pages = extraction.pages;
      console.log("[PDF IMPORT] loadPdf succeeded, pages =", pages.length, "total text length =", pages.join(" ").length);
    } catch (e: any) {
      console.error("[PDF IMPORT] ===== TEXT_EXTRACTION FAILED =====", {
        name: e instanceof Error ? e.name : typeof e,
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack?.slice(0, 1000) : undefined,
        constructor: e?.constructor?.name,
      });
      return NextResponse.json({ error: "PDF processing failed on the server. Please try again." }, { status: 500 });
    }

    // 5. Check for scanned PDFs.
    const totalText = pages.join(" ").replace(/\s+/g, " ").trim();
    if (totalText.length < 100) {
      console.log("[PDF IMPORT] scanned PDF detected, text length =", totalText.length);
      return NextResponse.json({ error: "This PDF appears to be scanned or image-based. Text could not be extracted automatically.", scanned: true }, { status: 400 });
    }

    // 6. Clean up text.
    const { title, content, excerpt } = cleanupPdfText(pages);
    const bibleRefs = detectBibleRefs(content);
    console.log("[PDF IMPORT] text cleaned. title =", title.slice(0, 50), "content length =", content.length, "bibleRefs =", bibleRefs.length);

    // 7. Best-effort cover.
    let coverImageUrl: string | null = null;
    try {
      coverImageUrl = await tryGenerateCover(pdfBuffer, user.id);
      console.log("[PDF IMPORT] cover result:", coverImageUrl ? "generated" : "not generated");
    } catch (e: any) {
      console.error("[PDF IMPORT] COVER_GENERATION failed:", e?.message);
    }

    // 8. Create article.
    const baseSlug = slugify(title) || "imported-pdf-article";
    const slug = await generateUniqueSlug(baseSlug);
    const authorName = user.name?.trim() || "Koino";

    console.log("[PDF IMPORT] creating KoinoArticle...");
    const created = await db.koinoArticle.create({
      data: {
        title, slug, contentType: "APOLOGETICS", content, excerpt: excerpt || null,
        coverImageUrl, authorName, status: "draft", difficulty: "BEGINNER",
        bibleRefs: JSON.stringify(bibleRefs), reviewedBy: user.id, reviewedAt: new Date(),
        seoTitle: title, seoDescription: excerpt || null,
      },
    });
    console.log("[PDF IMPORT] article created! id =", created.id);

    try { revalidatePath("/", "layout"); } catch {}

    return NextResponse.json({
      success: true, articleId: created.id, coverGenerated: !!coverImageUrl,
      message: coverImageUrl
        ? "PDF imported successfully with cover image. Review the draft and publish when ready."
        : "PDF imported successfully. No cover image was generated — upload one manually in the editor.",
    }, { status: 201 });
  } catch (e: any) {
    console.error("[PDF IMPORT] ===== UNKNOWN STAGE FAILED =====", {
      name: e instanceof Error ? e.name : typeof e,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack?.slice(0, 1000) : undefined,
    });
    return NextResponse.json({ error: e?.message || "Failed to import PDF" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed — use POST" }, { status: 405 });
}
