import type { Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, BookOpen, Calendar, Share2 } from "lucide-react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

const db = new PrismaClient();
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.koinoArticle.findUnique({ where: { slug } });
  if (!article) return { title: "Article Not Found — Koino" };
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
    include: {
      author: { select: { displayName: true, slug: true, profilePhoto: true, verified: true, churchRole: true, church: true, bio: true } },
    },
  });

  if (!article || article.status !== "published") notFound();

  const bibleRefs: string[] = JSON.parse(article.bibleRefs || "[]");
  const sources: any[] = JSON.parse(article.sources || "[]");
  const relatedIds: string[] = JSON.parse(article.relatedIds || "[]");

  // Fetch related articles (only published ones)
  const relatedArticles = relatedIds.length > 0
    ? await db.koinoArticle.findMany({
        where: { id: { in: relatedIds }, status: "published" },
        select: { id: true, title: true, slug: true, category: true, excerpt: true, coverImageUrl: true },
      })
    : [];

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

        {/* Author card */}
        {article.author && (
          <div className="flex items-center gap-3 mb-6 bg-[#1C1929] border border-white/[0.06] rounded-xl p-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#7C3AED] to-[#F39B9B] shrink-0">
              {article.author.profilePhoto && <img src={article.author.profilePhoto} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-white">{article.author.displayName}</p>
                {article.author.verified && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#38BDF8]">
                    <BadgeCheck size={10} /> Verified
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#94A3B8]">
                {article.author.churchRole}{article.author.churchRole && article.author.church ? " • " : ""}{article.author.church}
              </p>
            </div>
          </div>
        )}

        {/* If no author relation but authorName is set, show it */}
        {!article.author && article.authorName && (
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

        {/* Article body — rendered as markdown */}
        <div className="apologetics-article mb-8">
          <ReactMarkdown
            components={{
              // Headings
              h1: ({ children }) => <h1 className="text-2xl font-black text-white mt-8 mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-extrabold text-white mt-7 mb-3 pb-1 border-b border-white/[0.06]">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-bold text-white mt-5 mb-2">{children}</h3>,
              h4: ({ children }) => <h4 className="text-sm font-bold text-white mt-4 mb-2">{children}</h4>,
              // Paragraphs
              p: ({ children }) => <p className="text-[15px] text-[#A09DB1] leading-[1.75] mb-4">{children}</p>,
              // Bold + italic
              strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
              em: ({ children }) => <em className="italic text-[#C4BFD1]">{children}</em>,
              // Lists
              ul: ({ children }) => <ul className="list-disc list-outside pl-6 mb-4 space-y-1.5 text-[15px] text-[#A09DB1] leading-[1.75]">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-outside pl-6 mb-4 space-y-1.5 text-[15px] text-[#A09DB1] leading-[1.75]">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              // Blockquote — used for Bible verses + key quotes
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[#7C3AED] bg-[#7C3AED]/5 pl-4 pr-3 py-2 my-4 rounded-r-lg">
                  <div className="text-[15px] text-[#C4BFD1] italic leading-[1.75]">{children}</div>
                </blockquote>
              ),
              // Links
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#38BDF8] underline decoration-[#38BDF8]/40 underline-offset-2 hover:decoration-[#38BDF8] transition-all">
                  {children}
                </a>
              ),
              // Images
              img: ({ src, alt }) => (
                <img src={src as string} alt={alt || ""} className="w-full rounded-xl my-4 max-h-96 object-cover" />
              ),
              // Horizontal rule
              hr: () => <hr className="border-white/[0.08] my-6" />,
              // Code
              code: ({ children }) => <code className="bg-white/[0.06] text-[#A78BFA] px-1.5 py-0.5 rounded text-[13px] font-mono">{children}</code>,
              // Inline code vs block
              pre: ({ children }) => <pre className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4 overflow-x-auto mb-4 text-[13px]">{children}</pre>,
            }}
          >
            {article.content}
          </ReactMarkdown>
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
          <button
            onClick={() => { if (typeof navigator !== "undefined") navigator.clipboard?.writeText(window.location.href); }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white text-xs font-bold transition-all"
          >
            <Share2 size={12} /> Copy Link
          </button>
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
