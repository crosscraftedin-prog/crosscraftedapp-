import type { Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, BookOpen, Calendar, Share2 } from "lucide-react";
import { notFound } from "next/navigation";

const db = new PrismaClient();
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.koinoArticle.findUnique({ where: { slug } });
  if (!article) return { title: "Article Not Found — Koino" };
  return {
    title: article.seoTitle || `${article.title} — Koino`,
    description: article.seoDescription || article.excerpt || "",
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || article.excerpt || "",
      images: article.coverImageUrl ? [article.coverImageUrl] : [],
      siteName: "Koino",
      type: "article",
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

  return (
    <PublicPageLayout>
      <article className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/apologetics" className="text-xs text-[#A78BFA] hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft size={12} /> Back to Apologetics
        </Link>

        {article.category && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#F39B9B]">{article.category}</span>
        )}
        <h1 className="text-2xl font-black text-white mt-1 mb-3">{article.title}</h1>

        {article.excerpt && <p className="text-sm text-[#A09DB1] leading-relaxed mb-4 font-semibold">{article.excerpt}</p>}

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

        {article.publishedAt && (
          <p className="text-[10px] text-[#64748B] mb-4 flex items-center gap-1">
            <Calendar size={10} /> Published {new Date(article.publishedAt).toLocaleDateString()}
          </p>
        )}

        {article.coverImageUrl && (
          <img src={article.coverImageUrl} alt={article.title} className="w-full rounded-2xl mb-6 max-h-80 object-cover" />
        )}

        {/* Short Answer (for Apologetics) */}
        {article.shortAnswer && (
          <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl p-4 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA] mb-1">Short Answer</p>
            <p className="text-sm text-[#A09DB1] leading-relaxed">{article.shortAnswer}</p>
          </div>
        )}

        {/* Article body */}
        <div className="prose prose-invert max-w-none mb-8">
          <p className="text-sm text-[#A09DB1] leading-relaxed whitespace-pre-wrap">{article.content}</p>
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
