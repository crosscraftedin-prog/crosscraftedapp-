"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  X,
  Search,
  Sparkles,
  ThumbsUp,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  APOLOGETICS_POSTS,
  APOLOGETICS_TOPICS,
  CHURCH_GRADIENTS,
  type ApologeticsPost,
} from "@/lib/crosscrafted-data";

export default function ApologeticsView() {
  const [posts] = useState<ApologeticsPost[]>(APOLOGETICS_POSTS);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [openPost, setOpenPost] = useState<ApologeticsPost | null>(null);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (filterTopic && p.topic !== filterTopic) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.body.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [posts, filterTopic, search]);

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        toast.success("Liked!", { description: "Thanks for engaging with this content." });
      }
      return next;
    });
  };

  const sharePost = (p: ApologeticsPost) => {
    navigator.clipboard.writeText(`"${p.title}" by ${p.author} on CrossCrafted Apologetics`);
    toast.success("Post link copied!");
  };

  return (
    <div className="max-w-[680px] mx-auto px-4 py-5">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Apologetics</h1>
        <p className="text-xs text-[#94A3B8] mt-0.5">Defend the faith with reason & Scripture</p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search articles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="neo-input text-sm mb-3"
      />

      {/* Topic Pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 mb-2">
        <button
          onClick={() => setFilterTopic("")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            !filterTopic
              ? "bg-white text-slate-950"
              : "bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06]"
          }`}
        >
          All Topics
        </button>
        {APOLOGETICS_TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTopic(t.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTopic === t.id ? "text-slate-950" : "text-[#94A3B8] hover:text-white border border-white/[0.06]"
            }`}
            style={filterTopic === t.id ? { background: t.color } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Featured Post */}
      {filtered[0] && !filterTopic && !search && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setOpenPost(filtered[0])}
          className="relative rounded-2xl overflow-hidden cursor-pointer mb-4 border border-white/[0.06]"
        >
          <div className="relative h-44" style={{ background: CHURCH_GRADIENTS[filtered[0].cover_gradient] }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1929] via-[#1C1929]/40 to-transparent" />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#22C55E]/15 backdrop-blur-sm border border-[#22C55E]/30 text-[#22C55E] text-[10px] font-bold uppercase tracking-wider">
              Featured
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-lg font-extrabold text-white mb-1 leading-tight">{filtered[0].title}</h2>
            <p className="text-xs text-white/70 line-clamp-2 mb-2">{filtered[0].body}</p>
            <div className="flex items-center gap-3 text-[10px] text-white/60">
              <span className="font-bold text-white/80">{filtered[0].author}</span>
              <span>·</span>
              <span>{new Date(filtered[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Heart size={9} /> {filtered[0].likes}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Post List */}
      <div className="space-y-3">
        {(filterTopic || search ? filtered : filtered.slice(1)).map((post, i) => {
          const topic = APOLOGETICS_TOPICS.find((t) => t.id === post.topic);
          const hasLiked = liked.has(post.id);
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setOpenPost(post)}
              className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4 cursor-pointer hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-1.5 h-12 rounded-full shrink-0 mt-1"
                  style={{ background: topic?.color }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mb-1.5"
                    style={{ backgroundColor: `${topic?.color}20`, color: topic?.color }}
                  >
                    {topic?.label}
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">{post.title}</h3>
                </div>
              </div>
              <p className="text-[13px] text-[#A09DB1] leading-relaxed line-clamp-3 mb-3">{post.body}</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#A855F7] flex items-center justify-center text-[10px] font-bold text-white">
                    {post.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white">{post.author}</p>
                    <p className="text-[9px] text-[#94A3B8]">
                      {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[#94A3B8]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(post.id);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      hasLiked ? "bg-[#EC4899]/15 text-[#EC4899]" : "hover:text-white"
                    }`}
                  >
                    <Heart size={12} fill={hasLiked ? "currentColor" : "none"} />
                    {post.likes + (hasLiked ? 1 : 0)}
                  </button>
                  <span className="flex items-center gap-1 text-[10px]">
                    <MessageCircle size={12} /> {post.comments}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search size={40} className="mx-auto text-[#475569] mb-3" />
          <p className="text-sm text-[#475569]">No articles found.</p>
        </div>
      )}

      {/* Post Detail Modal */}
      <AnimatePresence>
        {openPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-[60] p-0 md:p-6"
            onClick={(e) => e.target === e.currentTarget && setOpenPost(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bg-[#1C1929] border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div
                className="relative h-32"
                style={{ background: CHURCH_GRADIENTS[openPost.cover_gradient] }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1929] to-transparent" />
                <button
                  onClick={() => setOpenPost(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 -mt-12 relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#A855F7] flex items-center justify-center text-base font-bold text-white border-4 border-[#1C1929]">
                    {openPost.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{openPost.author}</p>
                    <p className="text-[10px] text-[#94A3B8]">
                      {new Date(openPost.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {(() => {
                  const topic = APOLOGETICS_TOPICS.find((t) => t.id === openPost.topic);
                  return (
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${topic?.color}20`, color: topic?.color }}
                    >
                      {topic?.label}
                    </span>
                  );
                })()}

                <h2 className="text-xl font-extrabold text-white leading-tight">{openPost.title}</h2>

                <p className="text-sm text-[#A09DB1] leading-relaxed whitespace-pre-line">{openPost.body}</p>

                <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => toggleLike(openPost.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      liked.has(openPost.id)
                        ? "bg-[#EC4899]/15 text-[#EC4899] border border-[#EC4899]/30"
                        : "bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06]"
                    }`}
                  >
                    <Heart size={14} fill={liked.has(openPost.id) ? "currentColor" : "none"} />
                    {openPost.likes + (liked.has(openPost.id) ? 1 : 0)}
                  </button>
                  <button
                    onClick={() => sharePost(openPost)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06] transition-all"
                  >
                    <Share2 size={14} /> Share
                  </button>
                  <div className="ml-auto flex items-center gap-1 text-[10px] text-[#94A3B8]">
                    <Eye size={12} /> {(openPost.likes * 8).toLocaleString()} views
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
