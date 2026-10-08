import type { Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import MarkdownRenderer from "@/components/crosscrafted/MarkdownRenderer";
import CopyLinkButton from "@/components/crosscrafted/CopyLinkButton";
import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar } from "lucide-react";
import { notFound } from "next/navigation";

const db = new PrismaClient();
export const dynamic = "force-dynamic";

// ─── URL sanitizer (kept for the cover image <img> tag) ────────────────────
function safeUrl(url: string | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

// Safe JSON parser for array fields — verifies the parsed value is actually
// an array (not just that JSON.parse didn't throw).
function safeParseArray<T>(value: string | null | undefined, fallback: T[]): T[] {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as T[];
    return fallback;
  } catch {
    return fallback;
  }
}


export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.koinoArticle.findUnique({ where: { slug } });
  if (!article || article.status !== "published" || article.contentType !== "APOLOGETICS") {
    return { title: "Article Not Found — Koino" };
  }
  const canonical = article.canonicalUrl || `https://www.koino.in/apologetics/${article.slug}`;
  return {
    title: article.seoTitle || `${article.title} — Koino`,
    description: article.seoDescription || article.excerpt || "",
    alternates: { canonical },
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt || "",
      images: article.coverImageUrl ? [article.coverImageUrl] : [],
      siteName: "Koino",
      type: "article",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt || "",
      images: article.coverImageUrl ? [article.coverImageUrl] : [],
    },
  };
}

export default async function ApologeticsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const article = await db.koinoArticle.findUnique({
    where: { slug },
  });

  // Article not found, or not published, or not APOLOGETICS → 404
  if (!article || article.status !== "published" || article.contentType !== "APOLOGETICS") notFound();

  // ─── Safe JSON parsing (null-safe + type-safe) ────────────────────
  const bibleRefs: string[] = safeParseArray<string>(article.bibleRefs, []);
  const sources: any[] = safeParseArray<any>(article.sources, []);
  const relatedIds: string[] = safeParseArray<string>(article.relatedIds, []);

  // Fetch related articles (only published ones) — wrapped in try/catch
  // so a DB error on the related query doesn't crash the entire page.
  let relatedArticles: any[] = [];
  if (relatedIds.length > 0) {
    try {
      relatedArticles = await db.koinoArticle.findMany({
        where: { id: { in: relatedIds }, status: "published" },
        select: { id: true, title: true, slug: true, category: true, excerpt: true, coverImageUrl: true },
      });
    } catch (error) {
      console.error("[apologetics/[slug]] Related articles query error:", error);
    }
  }

  // Difficulty badge color
  const difficultyColor: Record<string, string> = {
    BEGINNER: "#22C55E",
    INTERMEDIATE: "#F59E0B",
    ADVANCED: "#EF4444",
  };

  return (
    <PublicPageLayout>
      <article className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/apologetics" className="text-xs text-[#A78BFA] hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft size={12} /> Back to Apologetics
        </Link>

        {/* Category + difficulty badges */}
        <div className="flex items-center gap-2 mb-3">
          {article.category && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#F39B9B]">{article.category}</span>
          )}
          {article.difficulty && (
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${difficultyColor[article.difficulty] || "#94A3B8"}20`, color: difficultyColor[article.difficulty] || "#94A3B8" }}
            >
              {article.difficulty}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-3 leading-tight">{article.title}</h1>

        {article.excerpt && <p className="text-base text-[#A09DB1] leading-relaxed mb-4 font-semibold">{article.excerpt}</p>}

        {/* Author display — uses denormalized authorName field (no DB relation needed) */}
        {article.authorName && (
          <div className="flex items-center gap-2 mb-6 text-[11px] text-[#94A3B8]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#F39B9B] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {article.authorName.charAt(0).toUpperCase()}
            </div>
            <span>by <span className="font-bold text-white">{article.authorName}</span></span>
          </div>
        )}

        {article.publishedAt && (
          <p className="text-[10px] text-[#64748B] mb-4 flex items-center gap-1">
            <Calendar size={10} /> Published {new Date(article.publishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}

        {article.coverImageUrl && (
          <img src={article.coverImageUrl} alt={article.title} className="w-full rounded-2xl mb-6 max-h-96 object-cover" />
        )}

        {/* Short Answer (for Apologetics) */}
        {article.shortAnswer && (
          <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl p-4 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] mb-1">Short Answer</p>
            <p className="text-sm text-[#A09DB1] leading-relaxed">{article.shortAnswer}</p>
          </div>
        )}

        {/* Article body — rendered as markdown via client component */}
        {/* react-markdown v10 uses useState/useEffect internally, so it
            MUST be rendered in a client component. This wrapper is marked
            "use client" and includes the safeUrl() sanitizer for links
            and images. */}
        <div className="apologetics-article mb-8">
          <MarkdownRenderer content={article.content} />
        </div>

        {/* Bible References */}
        {bibleRefs.length > 0 && (
          <div className="bg-[#1C1929] border border-white/[0.06] rounded-xl p-4 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2 flex items-center gap-1">
              <BookOpen size={10} /> Bible References
            </p>
            <div className="flex flex-wrap gap-2">
              {bibleRefs.map((ref, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8] text-[11px] font-semibold">{ref}</span>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <div className="bg-[#1C1929] border border-white/[0.06] rounded-xl p-4 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Sources & Further Reading</p>
            <ol className="space-y-1.5">
              {sources.map((src, i) => (
                <li key={i} className="text-[11px] text-[#A09DB1]">
                  {i + 1}. {src.author ? `${src.author} — ` : ""}
                  {src.title || src.publication || "Source"}
                  {src.year ? ` (${src.year})` : ""}
                  {src.url ? <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-[#38BDF8] ml-1 underline">↗</a> : null}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-3">Related Articles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedArticles.map((ra) => (
                <Link
                  key={ra.id}
                  href={`/apologetics/${ra.slug}`}
                  className="block bg-[#1C1929] border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.15] transition-all group"
                >
                  {ra.coverImageUrl && (
                    <img src={ra.coverImageUrl} alt="" className="w-full h-20 object-cover rounded-lg mb-2" />
                  )}
                  {ra.category && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#F39B9B]">{ra.category}</span>
                  )}
                  <h3 className="text-xs font-bold text-white mt-0.5 group-hover:text-[#A78BFA] transition-colors line-clamp-2">{ra.title}</h3>
                  {ra.excerpt && <p className="text-[10px] text-[#A09DB1] mt-1 line-clamp-2">{ra.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="flex items-center gap-2 pt-4 border-t border-white/[0.04]">
          <CopyLinkButton />
        </div>

        {/* Continue exploring */}
        <div className="mt-8 p-4 bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/15 rounded-2xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] mb-3">Continue exploring Koino</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/?view=bible" className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white text-[10px] font-bold transition-all">📖 Read the Bible</Link>
            <Link href="/?view=prayer-wall" className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white text-[10px] font-bold transition-all">🙏 Prayer Wall</Link>
            <Link href="/?view=churches" className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white text-[10px] font-bold transition-all">⛪ Find a Church</Link>
          </div>
        </div>
      </article>
    </PublicPageLayout>
  );
}
