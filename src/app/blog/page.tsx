import type { Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import Link from "next/link";
import { Calendar } from "lucide-react";

const db = new PrismaClient();

export const metadata: Metadata = {
  title: "Koino Blog — Faith, Fellowship & Christian Community",
  description: "Read the latest articles on Bible, faith, Christian living, prayer, church, events, Bible trivia, community stories, and Koino news.",
  openGraph: { title: "Koino Blog", siteName: "Koino" },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
  });

  const featured = posts.find((p) => p.featured) || posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <PublicPageLayout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-black text-white mb-2 text-center">Koino Blog</h1>
        <p className="text-sm text-[#A09DB1] mb-8 text-center">Faith, fellowship, and Christian community stories.</p>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-[#94A3B8] mb-2">No blog posts published yet.</p>
            <p className="text-xs text-[#64748B]">Articles are being prepared. Please check back soon.</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            {featured && (
              <Link href={`/blog/${featured.slug}`} className="block bg-[#1C1929] border border-white/[0.06] rounded-2xl overflow-hidden mb-6 hover:border-white/[0.15] transition-all group">
                {featured.featuredImage && (
                  <div className="relative h-48 bg-[#0f0f1a]">
                    <img src={featured.featuredImage} alt={featured.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#F39B9B]">{featured.category}</span>
                  <h2 className="text-lg font-bold text-white mt-1 mb-2">{featured.title}</h2>
                  {featured.excerpt && <p className="text-xs text-[#A09DB1] leading-relaxed">{featured.excerpt}</p>}
                  {featured.publishedAt && (
                    <p className="text-[10px] text-[#64748B] mt-2 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(featured.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            )}

            {/* Rest of posts */}
            <div className="space-y-3">
              {rest.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block bg-[#1C1929] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.15] transition-all">
                  <div className="flex items-start gap-3">
                    {post.featuredImage && (
                      <img src={post.featuredImage} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8]">{post.category}</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">{post.title}</h3>
                      {post.excerpt && <p className="text-[11px] text-[#A09DB1] mt-1 line-clamp-2">{post.excerpt}</p>}
                      {post.publishedAt && (
                        <p className="text-[9px] text-[#64748B] mt-1">{new Date(post.publishedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </PublicPageLayout>
  );
}
