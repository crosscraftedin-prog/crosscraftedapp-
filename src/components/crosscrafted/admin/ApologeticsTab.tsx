"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Search,
  X,
  Save,
  Trash2,
  Plus,
  Star,
  Eye,
  EyeOff,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

// Mirrors the API response shape from /api/admin/articles.
type KoinoArticle = {
  id: string;
  title: string;
  slug: string;
  contentType: string;
  category: string | null;
  subcategory: string | null;
  excerpt: string | null;
  shortAnswer: string | null;
  content: string;
  coverImageUrl: string | null;
  authorId: string | null;
  authorName: string | null;
  status: string; // "draft" | "published" | ...
  difficulty: string | null; // "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  featured: boolean;
  bibleRefs: string; // JSON array string
  sources: string; // JSON array string
  relatedIds: string; // JSON array string
  publishedAt: string | null;
  scheduledAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  difficulty: string; // "" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  excerpt: string;
  shortAnswer: string;
  content: string;
  coverImageUrl: string;
  authorName: string;
  bibleRefs: string; // CSV
  status: string; // "draft" | "published"
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  category: "",
  subcategory: "",
  difficulty: "",
  excerpt: "",
  shortAnswer: "",
  content: "",
  coverImageUrl: "",
  authorName: "",
  bibleRefs: "",
  status: "draft",
  featured: false,
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
};

// The 11 canonical apologetics categories. Order matches the public page.
const APOLOGETICS_CATEGORIES = [
  "God & Existence",
  "Jesus Christ",
  "Resurrection",
  "Bible",
  "Science & Faith",
  "Suffering & Evil",
  "Morality & Ethics",
  "Other Worldviews",
  "Doubt & Faith",
  "Culture & Christianity",
  "Salvation",
];

const DIFFICULTY_OPTIONS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

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

// Parse a JSON array string safely — returns string[].
function parseStringArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v ?? "")).filter((v) => v.length > 0);
    }
  } catch {
    // ignore
  }
  return [];
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function toFormState(article: KoinoArticle | null): FormState {
  if (!article) return { ...EMPTY_FORM };
  return {
    title: article.title,
    slug: article.slug,
    category: article.category ?? "",
    subcategory: article.subcategory ?? "",
    difficulty: article.difficulty ?? "",
    excerpt: article.excerpt ?? "",
    shortAnswer: article.shortAnswer ?? "",
    content: article.content,
    coverImageUrl: article.coverImageUrl ?? "",
    authorName: article.authorName ?? "",
    bibleRefs: parseStringArray(article.bibleRefs).join(", "),
    status: article.status === "published" ? "published" : "draft",
    featured: article.featured,
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    canonicalUrl: article.canonicalUrl ?? "",
  };
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function ApologeticsTab() {
  const [articles, setArticles] = useState<KoinoArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published" | "featured">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "APOLOGETICS" });
      if (filter !== "all") params.set("status", filter);
      const url = `/api/admin/articles?${params.toString()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { articles: KoinoArticle[] };
      setArticles(data.articles || []);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load apologetics articles");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // Client-side search across title / slug / author.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) =>
      [a.title, a.slug, a.authorName ?? "", a.category ?? ""].some((s) =>
        s.toLowerCase().includes(q)
      )
    );
  }, [articles, search]);

  const counts = useMemo(() => {
    return {
      total: articles.length,
      draft: articles.filter((a) => a.status === "draft").length,
      published: articles.filter((a) => a.status === "published").length,
      featured: articles.filter((a) => a.featured).length,
    };
  }, [articles]);

  const openNew = () => setEditing({ id: null });
  const openEdit = (id: string) => setEditing({ id });
  const closeEditor = () => {
    setEditing(null);
  };

  const handleSaved = () => {
    closeEditor();
    load();
  };

  const handleDeleted = () => {
    closeEditor();
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#7C3AED] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-[#7C3AED]" />
        <h2 className="text-sm font-bold text-white">Apologetics Articles</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7C3AED]/15 text-[#A78BFA]">
          {counts.total}
        </span>
        <button
          onClick={openNew}
          className="ml-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl px-3 py-2 flex items-center gap-1.5 transition-all"
        >
          <Plus size={12} />
          Write Article
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
          count={counts.total}
        />
        <FilterChip
          active={filter === "draft"}
          onClick={() => setFilter("draft")}
          label="Drafts"
          count={counts.draft}
          color="#F59E0B"
        />
        <FilterChip
          active={filter === "published"}
          onClick={() => setFilter("published")}
          label="Published"
          count={counts.published}
          color="#22C55E"
        />
        <FilterChip
          active={filter === "featured"}
          onClick={() => setFilter("featured")}
          label="Featured"
          count={counts.featured}
          color="#A855F7"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, slug, author, or category…"
          className="neo-input text-sm pl-9"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-[#1C1929] border border-dashed border-white/[0.12] rounded-2xl p-8 text-center">
          <FileText size={28} className="mx-auto text-[#475569] mb-2" />
          <p className="text-sm text-[#94A3B8]">
            {search ? "No articles match your search." : "No apologetics articles yet."}
          </p>
          {!search && (
            <button
              onClick={openNew}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#A78BFA] hover:text-white"
            >
              <Plus size={12} /> Write your first article
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => openEdit(a.id)}
              className="w-full text-left bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4 hover:border-white/[0.15] transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-white truncate">{a.title}</h3>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    /apologetics/{a.slug}
                    {a.authorName && ` · ${a.authorName}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {a.featured && <StatusBadge color="#A855F7" label="Featured" />}
                  {a.status === "published" ? (
                    <StatusBadge color="#22C55E" label="Published" />
                  ) : (
                    <StatusBadge color="#F59E0B" label="Draft" />
                  )}
                </div>
              </div>
              {a.excerpt && (
                <p className="text-[11px] text-[#A09DB1] line-clamp-1 mb-1.5">{a.excerpt}</p>
              )}
              <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                {a.category && (
                  <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] font-bold uppercase tracking-wider">
                    {a.category}
                  </span>
                )}
                {a.difficulty && (
                  <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[#A78BFA] font-bold uppercase tracking-wider">
                    {a.difficulty}
                  </span>
                )}
                {a.status === "published" && a.publishedAt ? (
                  <span className="flex items-center gap-0.5">
                    <Eye size={9} /> {formatTimeAgo(a.publishedAt)}
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5">
                    <Clock size={9} /> {formatTimeAgo(a.updatedAt)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editing && (
        <ApologeticsEditorModal
          articleId={editing.id}
          onClose={closeEditor}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: string;
}) {
  const activeBg = color ? `${color}` : "#7C3AED";
  return (
    <button
      onClick={onClick}
      className={`bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 transition-all ${
        active ? "text-white border-transparent" : "text-[#94A3B8] hover:text-white"
      }`}
      style={active ? { backgroundColor: `${activeBg}25`, borderColor: `${activeBg}80`, color } : undefined}
    >
      {label}
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-md ${
          active ? "bg-white/20" : "bg-white/[0.06] text-[#94A3B8]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0"
      style={{ backgroundColor: `${color}25`, color }}
    >
      {label}
    </span>
  );
}

// ─── Editor modal ──────────────────────────────────────────────────────────

function ApologeticsEditorModal({
  articleId,
  onClose,
  onSaved,
  onDeleted,
}: {
  articleId: string | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [loading, setLoading] = useState(articleId !== null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("draft");

  // Load existing article if editing.
  useEffect(() => {
    if (!articleId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/articles/${articleId}`, { cache: "no-store" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { article: KoinoArticle };
        if (cancelled) return;
        setForm(toFormState(data.article));
        setCurrentSlug(data.article.slug);
        setCurrentStatus(data.article.status);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load article");
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [articleId, onClose]);

  // Close on Escape + lock scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Auto-generate slug from title if the admin hasn't manually touched the slug.
  const effectiveSlug = slugTouched && form.slug ? form.slug : slugify(form.title);

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.content.trim()) {
      toast.error("Content is required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        contentType: "APOLOGETICS",
        title: form.title.trim(),
        slug: form.slug.trim(), // server will slugify + de-dupe if empty
        category: form.category.trim() || null,
        subcategory: form.subcategory.trim() || null,
        difficulty: form.difficulty || null,
        excerpt: form.excerpt,
        shortAnswer: form.shortAnswer,
        content: form.content,
        coverImageUrl: form.coverImageUrl,
        authorName: form.authorName,
        bibleRefs: form.bibleRefs, // CSV → server coerces to JSON array
        status: form.status, // "draft" | "published"
        featured: form.featured,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        canonicalUrl: form.canonicalUrl,
      };
      const url = articleId ? `/api/admin/articles/${articleId}` : "/api/admin/articles";
      const method = articleId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      toast.success(articleId ? "Article updated" : "Article created");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!articleId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      toast.success("Article deleted");
      onDeleted();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete article");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#7C3AED] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1C1929] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#A78BFA]" />
            <h2 className="text-sm font-extrabold text-white">
              {articleId ? "Edit Article" : "New Article"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:text-white"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3">
          {/* Title */}
          <Field label="Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="neo-input text-sm"
              placeholder="Did Jesus Really Rise from the Dead?"
            />
          </Field>

          {/* Slug */}
          <Field label="Slug" hint="URL-friendly. Auto-generated from title if empty.">
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                set("slug", e.target.value);
                setSlugTouched(true);
              }}
              className="neo-input text-sm"
              placeholder={slugify(form.title) || "did-jesus-really-rise"}
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            />
            <p className="mt-1 text-[10px] text-[#64748B]">
              Live preview:{" "}
              <span className="text-[#38BDF8]">/apologetics/{effectiveSlug || "—"}</span>
            </p>
          </Field>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="neo-input text-sm bg-[#1C1929]"
              >
                <option value="">— None —</option>
                {APOLOGETICS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subcategory" hint="Optional.">
              <input
                type="text"
                value={form.subcategory}
                onChange={(e) => set("subcategory", e.target.value)}
                className="neo-input text-sm"
                placeholder="e.g. Cosmological Argument"
              />
            </Field>
          </div>

          {/* Difficulty */}
          <Field label="Difficulty" hint="Reader level. Optional.">
            <select
              value={form.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
              className="neo-input text-sm bg-[#1C1929]"
            >
              <option value="">— None —</option>
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          {/* Excerpt */}
          <Field label="Excerpt" hint="Short summary shown on cards.">
            <textarea
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              className="neo-input text-sm h-16 resize-none"
              placeholder="One or two sentences to hook the reader."
            />
          </Field>

          {/* Short Answer */}
          <Field
            label="Short Answer"
            hint="Optional TL;DR shown at the top of the article (one paragraph)."
          >
            <textarea
              value={form.shortAnswer}
              onChange={(e) => set("shortAnswer", e.target.value)}
              className="neo-input text-sm h-20 resize-none"
              placeholder="A one-paragraph summary answer. e.g. Yes — the historical evidence strongly supports the resurrection…"
            />
          </Field>

          {/* Content */}
          <Field
            label="Content"
            hint="Markdown / plain text. Rendered on /apologetics/[slug]."
            required
          >
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              className="neo-input text-sm h-44 resize-y font-mono"
              placeholder={"# Heading\n\nWrite your article here…"}
            />
          </Field>

          {/* Cover image */}
          <Field label="Cover Image URL" hint="Paste a Supabase Storage URL.">
            <input
              type="text"
              value={form.coverImageUrl}
              onChange={(e) => set("coverImageUrl", e.target.value)}
              className="neo-input text-sm"
              placeholder="https://<supabase-storage>/apologetics/cover.jpg"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            />
            {form.coverImageUrl && (
              <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverImageUrl}
                  alt="Cover preview"
                  className="w-16 h-12 object-cover rounded-md bg-[#0f0f1a]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="text-[10px] text-[#94A3B8] break-all line-clamp-2">
                  {form.coverImageUrl}
                </span>
              </div>
            )}
          </Field>

          {/* Author Name */}
          <Field label="Author Name">
            <input
              type="text"
              value={form.authorName}
              onChange={(e) => set("authorName", e.target.value)}
              className="neo-input text-sm"
              placeholder="Author name (defaults to Admin)"
            />
          </Field>

          {/* Bible References */}
          <Field label="Bible References" hint="Comma-separated. e.g. John 20:1-29, 1 Cor 15">
            <input
              type="text"
              value={form.bibleRefs}
              onChange={(e) => set("bibleRefs", e.target.value)}
              className="neo-input text-sm"
              placeholder="John 20:1-29, 1 Cor 15, Romans 1:20"
            />
            {form.bibleRefs.trim().length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {form.bibleRefs
                  .split(",")
                  .map((t) => t.trim())
                  .filter((t) => t.length > 0)
                  .map((t, i) => (
                    <span
                      key={i}
                      className="bg-[#38BDF8]/10 text-[#38BDF8] text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            )}
          </Field>

          {/* Status + Featured */}
          <div className="grid grid-cols-2 gap-2">
            <Toggle
              checked={form.status === "published"}
              onChange={(v) => set("status", v ? "published" : "draft")}
              label="Published"
              hint={form.status === "published" ? "Visible on /apologetics" : "Hidden (draft)"}
              icon={form.status === "published" ? <Eye size={12} /> : <EyeOff size={12} />}
              color="#22C55E"
            />
            <Toggle
              checked={form.featured}
              onChange={(v) => set("featured", v)}
              label="Featured"
              hint={form.featured ? "Hero card" : "Standard card"}
              icon={<Star size={12} />}
              color="#A855F7"
            />
          </div>

          {/* SEO */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              SEO
            </p>
            <Field label="SEO Title" hint="Defaults to title if empty.">
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                className="neo-input text-sm"
                placeholder="Optional — overrides <title> for search engines"
              />
            </Field>
            <Field label="SEO Description" hint="Defaults to excerpt if empty.">
              <textarea
                value={form.seoDescription}
                onChange={(e) => set("seoDescription", e.target.value)}
                className="neo-input text-sm h-16 resize-none"
                placeholder="Optional — meta description for search engines / social shares"
              />
            </Field>
            <Field label="Canonical URL" hint="For cross-posted articles only.">
              <input
                type="text"
                value={form.canonicalUrl}
                onChange={(e) => set("canonicalUrl", e.target.value)}
                className="neo-input text-sm"
                placeholder="https://medium.com/your-article-123"
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
              />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.06]">
            {articleId && (
              <div className="mr-auto flex items-center gap-2">
                {currentStatus === "published" && currentSlug && (
                  <a
                    href={`/apologetics/${currentSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#38BDF8] hover:bg-[#38BDF8]/10 text-[11px] font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} /> Preview
                  </a>
                )}
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-[#EF4444]" />
                    <span className="text-[11px] text-[#94A3B8]">Delete permanently?</span>
                    <button
                      onClick={remove}
                      disabled={deleting}
                      className="bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-[11px] font-bold rounded-lg px-2 py-1 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 size={11} className="animate-spin" /> : "Yes, delete"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="text-[#94A3B8] hover:text-white text-[11px] font-bold px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={saving || deleting}
                    className="text-[#EF4444] hover:bg-[#EF4444]/10 text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06] text-sm font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || deleting}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:-translate-y-px"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={14} /> {articleId ? "Save Changes" : "Create Article"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form primitives ───────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
        {label} {required && <span className="text-[#F39B9B]">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-[#64748B] leading-relaxed">{hint}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  icon,
  color,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`bg-white/[0.03] border rounded-xl p-3 text-left flex items-start gap-2 transition-all ${
        checked ? "border-white/[0.15]" : "border-white/[0.06] hover:border-white/[0.1]"
      }`}
      style={checked ? { backgroundColor: `${color}15`, borderColor: `${color}50` } : undefined}
    >
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white">{label}</p>
        <p className="text-[10px] text-[#94A3B8]">{hint}</p>
      </div>
      <span
        className={`mt-0.5 w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          checked ? "" : "border-white/20"
        }`}
        style={checked ? { backgroundColor: color, borderColor: color } : undefined}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 5L4 7L8 3"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
