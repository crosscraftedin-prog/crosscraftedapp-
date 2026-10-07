import type { Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import Link from "next/link";
import { Search, Sparkles, MessageCircle, BookOpen } from "lucide-react";

const db = new PrismaClient();

export const metadata: Metadata = {
  title: "Apologetics — Koino",
  description: "Explore thoughtful, Bible-grounded answers to difficult questions about God, Jesus, the Bible, faith, science and life.",
  openGraph: { title: "Apologetics — Koino", siteName: "Koino" },
};

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { name: "God & Existence", icon: "🌍" },
  { name: "Jesus Christ", icon: "✝️" },
  { name: "Resurrection", icon: "🌅" },
  { name: "Bible", icon: "📖" },
  { name: "Science & Faith", icon: "🔬" },
  { name: "Suffering & Evil", icon: "💔" },
  { name: "Morality & Ethics", icon: "⚖️" },
  { name: "Other Worldviews", icon: "🌐" },
  { name: "Doubt & Faith", icon: "🙏" },
  { name: "Culture & Christianity", icon: "🏛️" },
  { name: "Salvation", icon: "🕊️" },
];

export default async function ApologeticsPage() {
  const articles = await db.koinoArticle.findMany({
    where: { status: "published", contentType: "APOLOGETICS" },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: 12,
    select: {
      id: true, title: true, slug: true, category: true, excerpt: true,
      coverImageUrl: true, authorName: true, difficulty: true, featured: true, publishedAt: true,
    },
  });

  const featured: any = articles.find((a: any) => (a as any).featured) || articles[0];
  const rest = articles.filter(a => a.id !== featured?.id);

  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F39B9B]/10 border border-[#F39B9B]/20 text-[#F39B9B] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles size={12} fill="currentColor" /> Apologetics
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          Have questions about{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F39B9B] to-[#9786E3]">
            Christianity?
          </span>
        </h1>
        <p className="text-base text-[#A09DB1] leading-relaxed max-w-2xl mx-auto mb-8">
          Explore thoughtful, Bible-grounded answers to difficult questions about God,
          Jesus, the Bible, faith, science and life.
        </p>
      </section>

      {/* Explore Topics */}
      <section className="py-8 px-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">Explore Topics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/apologetics?category=${encodeURIComponent(cat.name)}`}
              className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.15] transition-all group"
            >
              <p className="text-2xl mb-2">{cat.icon}</p>
              <p className="text-xs font-bold text-white group-hover:text-[#A78BFA] transition-colors">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured + Recent Articles */}
      {articles.length > 0 ? (
        <section className="py-8 px-6 max-w-5xl mx-auto">
          {featured && (
            <Link href={`/apologetics/${featured.slug}`} className="block bg-[#1C1929] border border-white/[0.06] rounded-2xl overflow-hidden mb-6 hover:border-white/[0.15] transition-all group">
              {featured.coverImageUrl && (
                <div className="relative h-48 bg-[#0f0f1a]">
                  <img src={featured.coverImageUrl} alt={featured.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#F39B9B]">{featured.category}</span>
                <h2 className="text-lg font-bold text-white mt-1 mb-2">{featured.title}</h2>
                {featured.excerpt && <p className="text-xs text-[#A09DB1]">{featured.excerpt}</p>}
                {featured.authorName && <p className="text-[10px] text-[#64748B] mt-2">by {featured.authorName}</p>}
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rest.map((article) => (
                <Link key={article.id} href={`/apologetics/${article.slug}`} className="block bg-[#1C1929] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.15] transition-all">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">{article.category}</span>
                  <h3 className="text-sm font-bold text-white mt-1">{article.title}</h3>
                  {article.excerpt && <p className="text-[11px] text-[#A09DB1] mt-1 line-clamp-2">{article.excerpt}</p>}
                  {article.authorName && <p className="text-[9px] text-[#64748B] mt-2">by {article.authorName}</p>}
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="py-12 px-6 max-w-2xl mx-auto text-center">
          <BookOpen size={32} className="mx-auto text-[#475569] mb-3" />
          <p className="text-sm text-[#94A3B8] mb-2">No apologetics articles published yet.</p>
          <p className="text-xs text-[#64748B]">Articles are being prepared by Koino contributors. Check back soon.</p>
        </section>
      )}

      {/* Ask a Question CTA */}
      <section className="py-8 px-6 max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-3xl p-6 text-center">
          <MessageCircle size={24} className="mx-auto text-[#A78BFA] mb-3" />
          <h2 className="text-lg font-bold text-white mb-1">Still have a question?</h2>
          <p className="text-xs text-[#A09DB1] mb-4">Submit your question and our team may address it in a future article.</p>
          <Link href="/contact?subject=Apologetics+Question" className="inline-block px-6 py-3 rounded-xl bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-all">
            Ask Koino
          </Link>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="py-8 px-6 max-w-3xl mx-auto">
        <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-1">Partner With Koino</h2>
          <p className="text-[11px] text-[#A09DB1] leading-relaxed mb-3">
            Are you a pastor, Bible teacher, apologist or Christian writer? Apply to become a Koino contributor and help Christians ask better questions, grow deeper in Scripture and explore the Christian faith.
          </p>
          <Link href="/partner" className="text-[#A78BFA] text-xs font-bold hover:text-white transition-colors">
            Apply to Become a Contributor →
          </Link>
        </div>
      </section>
    </PublicPageLayout>
  );
}
