import type { Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

const db = new PrismaClient();

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });
  if (!post) return { title: "Article Not Found — Koino Blog" };
  return {
    title: post.seoTitle || `${post.title} — Koino Blog`,
    description: post.seoDescription || post.excerpt || "",
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || "",
      images: post.featuredImage ? [post.featuredImage] : [],
      siteName: "Koino",
      type: "article",
    },
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });

  if (!post || !post.published) {
    notFound();
  }

  return (
    <PublicPageLayout>
      <article className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/blog" className="text-xs text-[#A78BFA] hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft size={12} /> Back to Blog
        </Link>

        <span className="text-[9px] font-bold uppercase tracking-wider text-[#F39B9B]">{post.category}</span>
        <h1 className="text-2xl font-black text-white mt-1 mb-3">{post.title}</h1>

        {post.publishedAt && (
          <p className="text-[10px] text-[#64748B] mb-4 flex items-center gap-1">
            <Calendar size={10} /> {new Date(post.publishedAt).toLocaleDateString()}
            {post.author && <span> · by {post.author}</span>}
          </p>
        )}

        {post.featuredImage && (
          <img src={post.featuredImage} alt={post.title} className="w-full rounded-2xl mb-6 max-h-80 object-cover" />
        )}

        {post.excerpt && <p className="text-sm text-[#A09DB1] leading-relaxed mb-6 font-semibold">{post.excerpt}</p>}

        <div className="prose prose-invert max-w-none">
          <p className="text-sm text-[#A09DB1] leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      </article>
    </PublicPageLayout>
  );
}
