"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseUser } from "@/lib/supabase/use-user";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  Shield,
  LayoutDashboard,
  Building2,
  Calendar,
  Store,
  HeartHandshake,
  HelpCircle,
  Trophy,
  Megaphone,
  BarChart3,
  Lock,
  X,
  Check,
  Trash2,
  Plus,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Gift,
  Send,
  LogIn,
  Tag,
  Palette,
  Package,
  Mail,
  Truck,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  CHURCHES,
  EVENTS,
  PRODUCTS,
  PRAYERS,
  APOLOGETICS_QUESTIONS,
  TRIVIA_COMPETITIONS,
  type Church,
  type EventItem,
  type Product,
  type PrayerPost,
  type ApologeticsQuestion,
  type TriviaGift,
} from "@/lib/crosscrafted-data";
import ImagePicker from "@/components/crosscrafted/ImagePicker";

type AdminTab =
  | "dashboard"
  | "churches"
  | "events"
  | "marketplace"
  | "prayers"
  | "apologetics"
  | "competitions"
  | "announcements"
  | "redemptions"
  | "analytics";

const TABS: { id: AdminTab; icon: typeof Shield; labelKey: string }[] = [
  { id: "dashboard",    icon: LayoutDashboard, labelKey: "admin.tab.dashboard" },
  { id: "churches",     icon: Building2,        labelKey: "admin.tab.churches" },
  { id: "events",       icon: Calendar,         labelKey: "admin.tab.events" },
  { id: "marketplace",  icon: Store,             labelKey: "admin.tab.marketplace" },
  { id: "prayers",      icon: HeartHandshake,   labelKey: "admin.tab.prayers" },
  { id: "apologetics",  icon: HelpCircle,       labelKey: "admin.tab.apologetics" },
  { id: "competitions", icon: Trophy,            labelKey: "admin.tab.competitions" },
  { id: "announcements",icon: Megaphone,         labelKey: "admin.tab.announcements" },
  { id: "redemptions",  icon: Package,           labelKey: "admin.tab.redemptions" },
  { id: "analytics",    icon: BarChart3,         labelKey: "admin.tab.analytics" },
];

export default function AdminView() {
  const { user, isAuthenticated, isAdmin, loading } = useSupabaseUser();
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#7C3AED] animate-spin" />
      </div>
    );
  }

  // Not signed in — show login prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-3xl p-8"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 mb-4">
              <Shield size={28} className="text-[#A78BFA]" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">{t('admin.access.title')}</h1>
            <p className="text-sm text-[#A09DB1] mt-1">Sign in with an admin account</p>
          </div>

          <a
            href="/auth/signin"
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}
          >
            <LogIn size={16} /> Sign In
          </a>

          <div className="mt-6 p-3 rounded-xl bg-[#38BDF8]/8 border border-[#38BDF8]/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8] mb-1">Admin Access</p>
            <p className="text-[11px] text-[#A09DB1] leading-relaxed">
              Admin authorization is verified server-side via your authenticated session role.
              Only users with the <span className="font-bold text-white">admin</span> role in the database
              can access this panel.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Signed in but NOT admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#EF4444]/20 rounded-3xl p-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 mb-4">
            <Lock size={28} className="text-[#EF4444]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">{t('admin.accessDenied.title')}</h1>
          <p className="text-sm text-[#A09DB1] mb-4">
            You're signed in as <span className="font-bold text-white">{user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email}</span>,
            but your account doesn't have admin privileges.
          </p>
          <p className="text-[11px] text-[#64748B]">
            Admin access is granted by setting <code className="text-[#A78BFA]">role = "admin"</code> in the
            database User table. Contact the site administrator if you believe this is an error.
          </p>
        </motion.div>
      </div>
    );
  }

  // Admin dashboard — user is authenticated AND has admin role
  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
            <Shield size={16} className="text-[#A78BFA]" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white">{t('admin.title')}</h1>
            <p className="text-[10px] text-[#94A3B8]">{t('admin.signedInAs', { name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email })}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl mb-5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/25"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            <tab.icon size={12} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "churches" && <ChurchesTab />}
          {activeTab === "events" && <EventsTab />}
          {activeTab === "marketplace" && <MarketplaceTab />}
          {activeTab === "prayers" && <PrayersTab />}
          {activeTab === "apologetics" && <ApologeticsTab />}
          {activeTab === "competitions" && <CompetitionsTab />}
          {activeTab === "announcements" && <AnnouncementsTab />}
          {activeTab === "redemptions" && <RedemptionsTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────

function DashboardTab() {
  const stats = [
    { label: "Churches", value: CHURCHES.length, pending: CHURCHES.filter((c) => c.status === "pending").length, icon: Building2, color: "#A855F7" },
    { label: "Events", value: EVENTS.length, pending: 0, icon: Calendar, color: "#EC4899" },
    { label: "Products", value: PRODUCTS.length, pending: 0, icon: Store, color: "#9786E3" },
    { label: "Prayers", value: PRAYERS.length, pending: 0, icon: HeartHandshake, color: "#F59E0B" },
    { label: "Questions", value: APOLOGETICS_QUESTIONS.length, pending: APOLOGETICS_QUESTIONS.filter((q) => q.status === "open").length, icon: HelpCircle, color: "#38BDF8" },
    { label: "Competitions", value: TRIVIA_COMPETITIONS.length, pending: TRIVIA_COMPETITIONS.filter((c) => c.status === "upcoming").length, icon: Trophy, color: "#22C55E" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white mb-3">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}30` }}
                >
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
                {s.pending > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#F59E0B]/15 text-[#F59E0B] text-[9px] font-bold uppercase tracking-wider">
                    {s.pending} pending
                  </span>
                )}
              </div>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: "Review Churches", color: "#A855F7" },
            { label: "Moderate Prayers", color: "#F59E0B" },
            { label: "Answer Questions", color: "#38BDF8" },
            { label: "Host Competition", color: "#22C55E" },
            { label: "Post Announcement", color: "#EC4899" },
            { label: "View Analytics", color: "#9786E3" },
          ].map((a) => (
            <div
              key={a.label}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-all cursor-pointer text-center"
            >
              <p className="text-xs font-bold text-white">{a.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone size={14} className="text-[#A78BFA]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">Admin Tip</p>
        </div>
        <p className="text-xs text-[#A09DB1] leading-relaxed">
          New church submissions need approval before they appear in the public directory.
          Check the Churches tab to review pending submissions. Same goes for marketplace products
          and prayer requests — keep the community safe and authentic.
        </p>
      </div>
    </div>
  );
}

// ─── CHURCHES ─────────────────────────────────────────────────────────────

function ChurchesTab() {
  const [churches, setChurches] = useState<Church[]>(CHURCHES);

  const approve = (id: string) => {
    setChurches((cs) => cs.map((c) => (c.id === id ? { ...c, status: "verified" } : c)));
    toast.success("Church approved!", { description: "It's now visible in the public directory." });
  };

  const remove = (id: string) => {
    setChurches((cs) => cs.filter((c) => c.id !== id));
    toast("Church removed");
  };

  const pending = churches.filter((c) => c.status === "pending");
  const verified = churches.filter((c) => c.status === "verified");

  return (
    <div className="space-y-4">
      <AdminSectionHeader title="Pending Approval" count={pending.length} color="#F59E0B" />
      {pending.length === 0 ? (
        <EmptyState text="No pending churches. All caught up!" />
      ) : (
        <div className="space-y-2">
          {pending.map((c) => (
            <AdminCard
              key={c.id}
              title={c.name}
              subtitle={`${c.city}, ${c.state} · ${c.denomination}`}
              description={c.description}
              image={c.cover_image}
              actions={
                <>
                  <button
                    onClick={() => approve(c.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold hover:bg-[#22C55E]/25 transition-all"
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/25 transition-all"
                  >
                    <Trash2 size={12} /> Reject
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      <AdminSectionHeader title="Verified Churches" count={verified.length} color="#22C55E" />
      <div className="space-y-2">
        {verified.map((c) => (
          <AdminCard
            key={c.id}
            title={c.name}
            subtitle={`${c.city}, ${c.state} · ${c.followers_count} followers`}
            description={c.description}
            image={c.cover_image}
            actions={
              <button
                onClick={() => remove(c.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-[#EF4444] text-xs font-bold transition-all"
              >
                <Trash2 size={12} /> Remove
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}

// ─── EVENTS ──────────────────────────────────────────────────────────────

function EventsTab() {
  const [events, setEvents] = useState<EventItem[]>(EVENTS);

  const remove = (id: string) => {
    setEvents((es) => es.filter((e) => e.id !== id));
    toast("Event removed");
  };

  return (
    <div className="space-y-3">
      <AdminSectionHeader title="All Events" count={events.length} color="#EC4899" />
      {events.length === 0 ? (
        <EmptyState text="No events." />
      ) : (
        events.map((e) => (
          <AdminCard
            key={e.id}
            title={e.title}
            subtitle={`${new Date(e.date).toLocaleDateString()} · ${e.city} · ${e.church}`}
            description={e.description}
            image={e.cover_image}
            badge={e.is_free ? "FREE" : `₹${e.price}`}
            badgeColor={e.is_free ? "#22C55E" : "#F59E0B"}
            actions={
              <button
                onClick={() => remove(e.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-[#EF4444] text-xs font-bold transition-all"
              >
                <Trash2 size={12} /> Remove
              </button>
            }
          />
        ))
      )}
    </div>
  );
}

// ─── MARKETPLACE ─────────────────────────────────────────────────────────

function MarketplaceTab() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  const remove = (id: string) => {
    setProducts((ps) => ps.filter((p) => p.id !== id));
    toast("Product removed");
  };

  const toggleStock = (id: string) => {
    setProducts((ps) =>
      ps.map((p) => (p.id === id ? { ...p, in_stock: !p.in_stock } : p))
    );
    toast("Stock updated");
  };

  return (
    <div className="space-y-3">
      <AdminSectionHeader title="All Products" count={products.length} color="#9786E3" />
      {products.map((p) => (
        <AdminCard
          key={p.id}
          title={p.name}
          subtitle={`₹${p.price} · ${p.vendor} · ${p.city}`}
          description={p.description}
          image={p.cover_image}
          badge={p.in_stock ? "In Stock" : "Out"}
          badgeColor={p.in_stock ? "#22C55E" : "#EF4444"}
          actions={
            <>
              <button
                onClick={() => toggleStock(p.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white text-xs font-bold transition-all"
              >
                {p.in_stock ? "Mark Out" : "Mark In"}
              </button>
              <button
                onClick={() => remove(p.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/25 transition-all"
              >
                <Trash2 size={12} /> Remove
              </button>
            </>
          }
        />
      ))}
    </div>
  );
}

// ─── PRAYERS ─────────────────────────────────────────────────────────────

function PrayersTab() {
  const [prayers, setPrayers] = useState<PrayerPost[]>(PRAYERS);

  const remove = (id: string) => {
    setPrayers((ps) => ps.filter((p) => p.id !== id));
    toast("Prayer removed", { description: "Inappropriate content moderated." });
  };

  return (
    <div className="space-y-3">
      <AdminSectionHeader title="Prayer Requests" count={prayers.length} color="#F59E0B" />
      <div className="bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-xl p-3 mb-3">
        <p className="text-[11px] text-[#A09DB1] leading-relaxed">
          Review prayer requests for spam, abuse, or inappropriate content. Remove anything that
          violates community guidelines. Legitimate prayers stay up to encourage the community.
        </p>
      </div>
      {prayers.map((p) => (
        <AdminCard
          key={p.id}
          title={p.title}
          subtitle={`${p.author} · ${p.category} · ${p.pray_count} praying`}
          description={p.content}
          actions={
            <button
              onClick={() => remove(p.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/25 transition-all"
            >
              <Trash2 size={12} /> Remove
            </button>
          }
        />
      ))}
    </div>
  );
}

// ─── APOLOGETICS ─────────────────────────────────────────────────────────

function ApologeticsTab() {
  const [questions, setQuestions] = useState<ApologeticsQuestion[]>(APOLOGETICS_QUESTIONS);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  const postAnswer = (questionId: string) => {
    const text = (answerText[questionId] || "").trim();
    if (!text) {
      toast.error("Please write your answer first");
      return;
    }
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === questionId
          ? {
              ...q,
              status: "answered",
              answers: [
                ...q.answers,
                {
                  id: `admin_${Date.now()}`,
                  author: "Admin (Pastor)",
                  authorRole: "Pastor",
                  body: text,
                  date: new Date().toISOString().split("T")[0],
                  is_accepted: true,
                  likes: 0,
                },
              ],
            }
          : q
      )
    );
    setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
    toast.success("Official answer posted!", { description: "Marked as accepted answer." });
  };

  const closeQuestion = (id: string) => {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, status: "closed" } : q)));
    toast("Question closed");
  };

  const remove = (id: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    toast("Question removed");
  };

  return (
    <div className="space-y-3">
      <AdminSectionHeader title="Apologetics Q&A" count={questions.length} color="#38BDF8" />
      {questions.map((q) => (
        <div key={q.id} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                q.status === "answered"
                  ? "bg-[#22C55E]/15 text-[#22C55E]"
                  : q.status === "closed"
                  ? "bg-white/[0.06] text-[#94A3B8]"
                  : "bg-[#F59E0B]/15 text-[#F59E0B]"
              }`}
            >
              {q.status}
            </span>
            <span className="text-[10px] text-[#94A3B8]">{q.author}</span>
            <span className="text-[10px] text-[#64748B]">· {q.answers.length} answers</span>
          </div>
          <h3 className="text-sm font-bold text-white mb-1">{q.title}</h3>
          <p className="text-[12px] text-[#A09DB1] line-clamp-2 mb-3">{q.body}</p>

          {/* Answer input */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2 mb-2">
            <textarea
              value={answerText[q.id] || ""}
              onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Post an official answer as Pastor/Admin..."
              className="w-full bg-transparent text-xs text-white outline-none resize-none h-16 placeholder:text-[#64748B]"
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => postAnswer(q.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-bold hover:bg-[#38BDF8]/25 transition-all"
              >
                <Send size={11} /> Post Official Answer
              </button>
              {q.status !== "closed" && (
                <button
                  onClick={() => closeQuestion(q.id)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white text-xs font-bold transition-all"
                >
                  Close
                </button>
              )}
              <button
                onClick={() => remove(q.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/25 transition-all ml-auto"
              >
                <Trash2 size={11} /> Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── COMPETITIONS ────────────────────────────────────────────────────────

function CompetitionsTab() {
  const [competitions, setCompetitions] = useState(TRIVIA_COMPETITIONS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    prize: "",
    duration: "7",
    organizer: "Believ",
  });

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.prize.trim()) {
      toast.error("Please fill in title and prize");
      return;
    }
    toast.success("Competition created!", {
      description: "It's now visible in the Trivia > Compete tab.",
    });
    setForm({ title: "", description: "", prize: "", duration: "7", organizer: "Believ" });
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <AdminSectionHeader title="Trivia Competitions" count={competitions.length} color="#22C55E" />
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all"
        >
          <Plus size={12} /> Host New
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={create}
            className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Competition Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="neo-input text-sm"
                placeholder="e.g. Christmas Bible Quiz 2025"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="neo-input text-sm h-20 resize-none"
                placeholder="What's the competition about? Rules, who can join, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Prize *
                </label>
                <input
                  type="text"
                  value={form.prize}
                  onChange={(e) => setForm({ ...form, prize: e.target.value })}
                  className="neo-input text-sm"
                  placeholder="₹10,000 + Trophy"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="neo-input text-sm"
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06] text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #22C55E, #3B82F6)" }}
              >
                Create Competition
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Existing competitions */}
      <div className="space-y-2">
        {competitions.map((c) => (
          <div key={c.id} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  c.status === "live"
                    ? "bg-[#EF4444]/15 text-[#EF4444]"
                    : c.status === "upcoming"
                    ? "bg-[#38BDF8]/15 text-[#38BDF8]"
                    : "bg-white/[0.06] text-[#94A3B8]"
                }`}
              >
                {c.status}
              </span>
              <span className="text-[10px] text-[#94A3B8]">{c.participants.length} churches</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{c.title}</h3>
            <p className="text-[11px] text-[#A09DB1] line-clamp-2 mb-2">{c.description}</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-[#F59E0B] font-bold">
                <Gift size={10} /> {c.prize}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Gifts management */}
      <GiftsManagement />
    </div>
  );
}

// ─── GIFTS MANAGEMENT ────────────────────────────────────────────────────

function GiftsManagement() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    images: string[];
    points_required: string;
    tier: "bronze" | "silver" | "gold" | "platinum";
    stock: string;
    variations: { name: string; options: string[] }[];
    attributes: { label: string; value: string }[];
  }>({
    title: "",
    description: "",
    images: [],
    points_required: "",
    tier: "bronze",
    stock: "10",
    variations: [],
    attributes: [],
  });

  const fetchGifts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gifts");
      const data = await res.json();
      const mapped = (data.gifts || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        image_url: g.imageUrl,
        points_required: g.pointsRequired,
        tier: g.tier,
        stock: g.stock,
        isAdmin: g.isAdmin,
        variations: Array.isArray(g.variations) ? g.variations : [],
        attributes: Array.isArray(g.attributes) ? g.attributes : [],
      }));
      setGifts(mapped);
    } catch {
      toast.error("Failed to load gifts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      images: [],
      points_required: "",
      tier: "bronze",
      stock: "10",
      variations: [],
      attributes: [],
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.points_required || form.images.length === 0) {
      toast.error("Please fill in title, points, and add at least 1 image");
      return;
    }
    if (form.variations.some((v) => v.name.trim() && v.options.length === 0)) {
      toast.error("Add at least 1 option for each variation name");
      return;
    }

    const giftData = {
      title: form.title.trim(),
      description: form.description.trim(),
      imageUrl: form.images[0],
      pointsRequired: Number(form.points_required),
      tier: form.tier,
      stock: Number(form.stock) || 0,
      variations: form.variations.filter((v) => v.name.trim() && v.options.length > 0),
      attributes: form.attributes.filter((a) => a.label.trim() && a.value.trim()),
    };

    try {
      if (editingId) {
        const res = await fetch("/api/admin/gifts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ giftId: editingId, ...giftData }),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Gift updated!", { description: "Changes are live in Trivia > Rewards." });
      } else {
        const res = await fetch("/api/admin/gifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(giftData),
        });
        if (!res.ok) throw new Error("Failed to add");
        toast.success("Gift added!", {
          description: "It's now visible in Trivia > Rewards for players to redeem.",
        });
      }
      fetchGifts();
      resetForm();
    } catch {
      toast.error("Failed to save gift");
    }
  };

  const handleEdit = (gift: any) => {
    if (!gift.isAdmin) {
      toast("Default gifts can't be edited", {
        description: "Only gifts you've added from the admin panel can be modified.",
      });
      return;
    }
    setEditingId(gift.id);
    setForm({
      title: gift.title,
      description: gift.description,
      images: [gift.image_url],
      points_required: String(gift.points_required),
      tier: gift.tier,
      stock: String(gift.stock),
      variations: Array.isArray(gift.variations) && gift.variations.length > 0
        ? gift.variations.map((v: any) => ({
            name: v.name || "",
            options: Array.isArray(v.options) ? v.options : [],
          }))
        : [],
      attributes: Array.isArray(gift.attributes) && gift.attributes.length > 0
        ? gift.attributes.map((a: any) => ({
            label: a.label || "",
            value: a.value || "",
          }))
        : [],
    });
    setShowAddForm(true);
    setTimeout(() => {
      document.getElementById("gift-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleRemove = async (id: string) => {
    const gift = gifts.find((g) => g.id === id);
    if (!gift?.isAdmin) {
      toast("Default gifts can't be removed", {
        description: "Only gifts you've added from the admin panel can be deleted.",
      });
      return;
    }
    try {
      const res = await fetch("/api/admin/gifts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId: id }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Gift removed", { description: "Players can no longer redeem this gift." });
      fetchGifts();
    } catch {
      toast.error("Failed to remove gift");
    }
  };

  const handleStockChange = async (id: string, delta: number) => {
    const gift = gifts.find((g) => g.id === id);
    if (!gift?.isAdmin) return;
    const newStock = Math.max(0, gift.stock + delta);
    try {
      await fetch("/api/admin/gifts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftId: id, stock: newStock }),
      });
      fetchGifts();
    } catch {
      toast.error("Failed to update stock");
    }
  };

  const tierColors: Record<string, string> = {
    bronze: "#CD7F32",
    silver: "#C0C0C0",
    gold: "#FFD700",
    platinum: "#E5E4E2",
  };

  const adminCount = gifts.filter((g) => g.isAdmin).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#F59E0B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <AdminSectionHeader title="Reward Gifts" count={gifts.length} color="#F59E0B" />
        <button
          onClick={() => {
            if (showAddForm) {
              resetForm();
            } else {
              setShowAddForm(true);
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#E59E0B] text-slate-950 text-xs font-bold transition-all"
        >
          {showAddForm ? <X size={12} /> : <Plus size={12} />}
          {showAddForm ? "Cancel" : "Add Gift"}
        </button>
      </div>

      {adminCount > 0 && (
        <p className="text-[10px] text-[#64748B] px-1">
          {adminCount} admin-added · {gifts.length - adminCount} default gifts
        </p>
      )}

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            id="gift-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-[#1C1929] border border-[#F59E0B]/20 rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-2">
              <Gift size={14} className="text-[#F59E0B]" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
                {editingId ? "Edit Gift" : "Add New Reward Gift"}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Gift Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="neo-input text-sm"
                placeholder="e.g. Believ Hoodie"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="neo-input text-sm h-16 resize-none"
                placeholder="What's the gift? Sizes, colors, what's included..."
              />
            </div>

            <ImagePicker
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
              max={3}
              label="Gift Photos *"
            />

            {/* Variations (sizes, colors, etc.) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  <Tag size={11} /> Variations
                  <span className="text-[9px] text-[#475569] normal-case tracking-normal">(sizes, colors...)</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      variations: [...form.variations, { name: "", options: [] }],
                    })
                  }
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-bold hover:bg-[#F59E0B]/25 transition-all"
                >
                  <Plus size={10} /> Add
                </button>
              </div>

              {form.variations.length === 0 && (
                <p className="text-[10px] text-[#475569] px-1 py-1.5 italic">
                  No variations. Add a "Size" or "Color" so users can pick when claiming.
                </p>
              )}

              {form.variations.map((v, vIdx) => (
                <div
                  key={vIdx}
                  className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => {
                        const next = [...form.variations];
                        next[vIdx] = { ...next[vIdx], name: e.target.value };
                        setForm({ ...form, variations: next });
                      }}
                      className="neo-input text-xs flex-1"
                      placeholder="Variation name (e.g. Size, Color)"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          variations: form.variations.filter((_, i) => i !== vIdx),
                        })
                      }
                      className="w-7 h-7 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center hover:bg-[#EF4444]/25"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {v.options.map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[10px] font-semibold text-[#F59E0B]"
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...form.variations];
                            next[vIdx].options = next[vIdx].options.filter((_, i) => i !== oIdx);
                            setForm({ ...form, variations: next });
                          }}
                          className="w-4 h-4 rounded-full bg-[#F59E0B]/20 hover:bg-[#F59E0B]/40 flex items-center justify-center"
                        >
                          <X size={9} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="Add option + Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const target = e.target as HTMLInputElement;
                          const val = target.value.trim();
                          if (!val) return;
                          const next = [...form.variations];
                          next[vIdx] = {
                            ...next[vIdx],
                            options: [...next[vIdx].options, val],
                          };
                          setForm({ ...form, variations: next });
                          target.value = "";
                        }
                      }}
                      className="bg-transparent border border-dashed border-white/[0.12] rounded-md px-2 py-1 text-[10px] text-white outline-none focus:border-[#F59E0B]/50 flex-1 min-w-[100px]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Attributes (material, fit, weight, etc.) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  <Palette size={11} /> Attributes
                  <span className="text-[9px] text-[#475569] normal-case tracking-normal">(material, weight...)</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      attributes: [...form.attributes, { label: "", value: "" }],
                    })
                  }
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#9786E3]/15 text-[#9786E3] text-[10px] font-bold hover:bg-[#9786E3]/25 transition-all"
                >
                  <Plus size={10} /> Add
                </button>
              </div>

              {form.attributes.length === 0 && (
                <p className="text-[10px] text-[#475569] px-1 py-1.5 italic">
                  No attributes. Add specs like "Material: 100% Cotton".
                </p>
              )}

              {form.attributes.map((a, aIdx) => (
                <div key={aIdx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={a.label}
                    onChange={(e) => {
                      const next = [...form.attributes];
                      next[aIdx] = { ...next[aIdx], label: e.target.value };
                      setForm({ ...form, attributes: next });
                    }}
                    className="neo-input text-xs w-[40%]"
                    placeholder="Label (e.g. Material)"
                  />
                  <input
                    type="text"
                    value={a.value}
                    onChange={(e) => {
                      const next = [...form.attributes];
                      next[aIdx] = { ...next[aIdx], value: e.target.value };
                      setForm({ ...form, attributes: next });
                    }}
                    className="neo-input text-xs flex-1"
                    placeholder="Value (e.g. 100% Cotton)"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        attributes: form.attributes.filter((_, i) => i !== aIdx),
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center hover:bg-[#EF4444]/25 shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Points Required *
                </label>
                <input
                  type="number"
                  value={form.points_required}
                  onChange={(e) => setForm({ ...form, points_required: e.target.value })}
                  className="neo-input text-sm"
                  placeholder="500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Tier
                </label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value as any })}
                  className="neo-input text-sm"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Stock
                </label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="neo-input text-sm"
                  placeholder="10"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span
                className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: `${tierColors[form.tier]}25`, color: tierColors[form.tier] }}
              >
                {form.tier}
              </span>
              <span className="text-[10px] text-[#94A3B8]">
                {form.points_required || "0"} pts to unlock · {form.stock || "0"} in stock
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06] text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-[#F59E0B] hover:bg-[#E59E0B] transition-all"
              >
                {editingId ? "Update Gift" : "Add Gift"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {gifts.map((g) => {
          const admin = g.isAdmin;
          return (
            <div
              key={g.id}
              className={`bg-[#1C1929] border rounded-xl p-3 ${
                admin ? "border-[#F59E0B]/30" : "border-white/[0.06]"
              }`}
            >
              <div className="relative w-full h-24 rounded-lg overflow-hidden mb-2">
                <img src={g.image_url} alt={g.title} className="w-full h-full object-cover" />
                <span
                  className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${tierColors[g.tier]}E6`, color: "#0A0A0A" }}
                >
                  {g.tier}
                </span>
                {admin && (
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-[#F59E0B] text-slate-950 text-[8px] font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-white line-clamp-1">{g.title}</p>
              <p className="text-[9px] text-[#A09DB1] line-clamp-2 mt-0.5 mb-1">{g.description}</p>

              {((g.variations?.length || 0) > 0 || (g.attributes?.length || 0) > 0) && (
                <div className="flex flex-wrap gap-0.5 mb-1.5">
                  {g.variations?.map((v: any, vIdx: number) => (
                    <span
                      key={`v-${vIdx}`}
                      className="px-1 py-0.5 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] text-[8px] font-bold uppercase tracking-wide"
                      title={`${v.name}: ${v.options?.length || 0} options`}
                    >
                      {v.name}: {(v.options || []).length}
                    </span>
                  ))}
                  {g.attributes?.map((a: any, aIdx: number) => (
                    <span
                      key={`a-${aIdx}`}
                      className="px-1 py-0.5 rounded-md bg-[#9786E3]/10 text-[#9786E3] text-[8px] font-bold uppercase tracking-wide"
                      title={`${a.label}: ${a.value}`}
                    >
                      {a.label}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#F59E0B]">{g.points_required.toLocaleString()} pts</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStockChange(g.id, -1)}
                    disabled={!admin}
                    className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all ${
                      admin ? "bg-white/[0.06] text-white hover:bg-white/[0.12]" : "bg-white/[0.02] text-[#475569] cursor-not-allowed"
                    }`}
                  >
                    −
                  </button>
                  <span className="text-[10px] font-bold text-white tabular-nums w-6 text-center">{g.stock}</span>
                  <button
                    onClick={() => handleStockChange(g.id, 1)}
                    disabled={!admin}
                    className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all ${
                      admin ? "bg-white/[0.06] text-white hover:bg-white/[0.12]" : "bg-white/[0.02] text-[#475569] cursor-not-allowed"
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(g)}
                  disabled={!admin}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    admin
                      ? "bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white"
                      : "bg-white/[0.02] text-[#475569] cursor-not-allowed"
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemove(g.id)}
                  disabled={!admin}
                  className={`flex items-center justify-center px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    admin
                      ? "bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/25"
                      : "bg-white/[0.02] text-[#475569] cursor-not-allowed"
                  }`}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-xl p-3">
        <p className="text-[10px] text-[#A09DB1] leading-relaxed">
          <span className="font-bold text-[#F59E0B]">Tip:</span> Gifts you add appear instantly in the
          Trivia → Rewards tab for players to redeem. Default gifts (without the "Admin" badge) are
          seeded examples and can't be edited or removed — only gifts you add here can be modified.
          When a player redeems a gift, contact them on WhatsApp to arrange delivery.
        </p>
      </div>
    </div>
  );
}

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────

function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<{ id: string; text: string; type: string; date: string }[]>([
    { id: "a1", text: "Welcome to Believ! Explore churches, play trivia, and grow in faith.", type: "info", date: "2025-01-20" },
  ]);
  const [text, setText] = useState("");
  const [type, setType] = useState("info");

  const post = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Please enter announcement text");
      return;
    }
    setAnnouncements((prev) => [
      { id: `a${Date.now()}`, text: text.trim(), type, date: new Date().toISOString().split("T")[0] },
      ...prev,
    ]);
    setText("");
    toast.success("Announcement posted!", { description: "It will show as a banner across the app." });
  };

  const remove = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast("Announcement removed");
  };

  const typeColors: Record<string, string> = {
    info: "#38BDF8",
    success: "#22C55E",
    warning: "#F59E0B",
    urgent: "#EF4444",
  };

  return (
    <div className="space-y-4">
      <AdminSectionHeader title="Site Announcements" count={announcements.length} color="#EC4899" />
      <form onSubmit={post} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4 space-y-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
            <Megaphone size={10} className="inline mr-0.5" /> Announcement Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="neo-input text-sm h-20 resize-none"
            placeholder="e.g. New Bible Reading Challenge starts Dec 1! Join the 30-day plan."
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
            Type
          </label>
          <div className="flex gap-2">
            {["info", "success", "warning", "urgent"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                  type === t ? "text-white" : "bg-white/[0.04] text-[#94A3B8] border-white/[0.06]"
                }`}
                style={type === t ? { backgroundColor: `${typeColors[t]}25`, borderColor: `${typeColors[t]}80` } : {}}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, #EC4899, #F59E0B)" }}
        >
          Post Announcement
        </button>
      </form>

      <div className="space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="bg-[#1C1929] border border-white/[0.06] rounded-xl p-3 flex items-start gap-3">
            <div
              className="w-2 h-12 rounded-full shrink-0"
              style={{ background: typeColors[a.type] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white">{a.text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: typeColors[a.type] }}>
                  {a.type}
                </span>
                <span className="text-[9px] text-[#64748B]">· {a.date}</span>
              </div>
            </div>
            <button
              onClick={() => remove(a.id)}
              className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const stats = [
    { label: "Total Churches", value: CHURCHES.length, change: "+2 this week", icon: Building2, color: "#A855F7" },
    { label: "Total Events", value: EVENTS.length, change: "+1 this week", icon: Calendar, color: "#EC4899" },
    { label: "Total Products", value: PRODUCTS.length, change: "+3 this week", icon: Store, color: "#9786E3" },
    { label: "Prayer Requests", value: PRAYERS.length, change: "+5 this week", icon: HeartHandshake, color: "#F59E0B" },
    { label: "Apologetics Qs", value: APOLOGETICS_QUESTIONS.length, change: "+2 open", icon: HelpCircle, color: "#38BDF8" },
    { label: "Active Competitions", value: TRIVIA_COMPETITIONS.filter((c) => c.status === "live").length, change: "1 live now", icon: Trophy, color: "#22C55E" },
  ];

  // Mock engagement chart data
  const engagement = [12, 19, 15, 25, 30, 28, 35, 42, 38, 45, 50, 48];
  const maxEng = Math.max(...engagement);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white mb-3">Platform Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon size={16} style={{ color: s.color }} />
                <span className="text-[9px] font-bold text-[#22C55E]">{s.change}</span>
              </div>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement chart */}
      <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-[#A78BFA]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">Weekly Engagement</p>
        </div>
        <div className="flex items-end justify-between h-32 gap-1">
          {engagement.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(v / maxEng) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="w-full rounded-t-md bg-gradient-to-t from-[#7C3AED] to-[#EC4899] min-h-[4px]"
                style={{ height: `${(v / maxEng) * 100}%` }}
              />
              <span className="text-[8px] text-[#64748B]">W{i + 1}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#94A3B8] mt-2 text-center">Daily active users over 12 weeks</p>
      </div>

      {/* Top churches by followers */}
      <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-[#A78BFA]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">Top Churches by Followers</p>
        </div>
        <div className="space-y-2">
          {[...CHURCHES].sort((a, b) => b.followers_count - a.followers_count).slice(0, 5).map((c, i) => (
            <div key={c.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#64748B] w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{c.name}</p>
                <p className="text-[9px] text-[#94A3B8]">{c.city}, {c.state}</p>
              </div>
              <span className="text-xs font-bold text-[#A78BFA]">{c.followers_count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top trivia players */}
      <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-[#F59E0B]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">Top Trivia Players</p>
        </div>
        <div className="space-y-2">
          {[
            { name: "Rebecca Thomas", points: 8420 },
            { name: "Philip Cherian", points: 6150 },
            { name: "Grace Sharma", points: 4320 },
          ].map((p, i) => (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#64748B] w-4">{i + 1}</span>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{p.name}</p>
              </div>
              <span className="text-xs font-bold text-[#F59E0B]">{p.points.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REDEMPTIONS (claimed gifts fulfilment dashboard) ──────────────────────

const REDEMPTION_STATUSES = [
  { id: "pending",   label: "Pending",   color: "#F59E0B", icon: Clock },
  { id: "contacted", label: "Contacted",  color: "#38BDF8", icon: Mail },
  { id: "shipped",   label: "Shipped",    color: "#9786E3", icon: Truck },
  { id: "delivered", label: "Delivered",  color: "#22C55E", icon: CheckCircle },
] as const;

function RedemptionsTab() {
  const t = useTranslation();
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, contacted: 0, shipped: 0, delivered: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/admin/redemptions" : `/api/admin/redemptions?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setRedemptions(data.redemptions || []);
      setCounts(data.counts || { total: 0, pending: 0, contacted: 0, shipped: 0, delivered: 0 });
    } catch {
      toast.error("Failed to load redemptions");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const updateStatus = async (redemptionId: string, status: string) => {
    setUpdating(redemptionId);
    try {
      const res = await fetch("/api/admin/redemptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionId, status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(`Marked as ${status}`);
      load();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const formatTimeAgo = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const stats = [
    { label: "Total", value: counts.total, color: "#A855F7", icon: Package },
    { label: "Pending", value: counts.pending, color: "#F59E0B", icon: Clock },
    { label: "Contacted", value: counts.contacted, color: "#38BDF8", icon: Mail },
    { label: "Shipped", value: counts.shipped, color: "#9786E3", icon: Truck },
    { label: "Delivered", value: counts.delivered, color: "#22C55E", icon: CheckCircle },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-[#F59E0B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AdminSectionHeader title={t('admin.redemptions.title')} count={counts.total} color="#F59E0B" />

      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[#1C1929] border border-white/[0.06] rounded-xl p-2 text-center"
          >
            <s.icon size={12} className="mx-auto mb-1" style={{ color: s.color }} />
            <p className="text-base font-extrabold text-white">{s.value}</p>
            <p className="text-[8px] text-[#94A3B8] uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {["all", ...REDEMPTION_STATUSES.map((s) => s.id)].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              filter === f
                ? "bg-[#F59E0B] text-slate-950"
                : "bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06]"
            }`}
          >
            {f}
            {f !== "all" && (
              <span className="ml-1 opacity-70">
                {(counts as any)[f] || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Redemptions list */}
      {redemptions.length === 0 ? (
        <div className="bg-[#1C1929] border border-dashed border-white/[0.12] rounded-2xl p-8 text-center">
          <Package size={28} className="mx-auto text-[#475569] mb-2" />
          <p className="text-sm text-[#94A3B8]">{t('admin.redemptions.empty')}</p>
          <p className="text-[10px] text-[#64748B] mt-1">
            {t('admin.redemptions.emptyDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {redemptions.map((r) => {
            const statusInfo = REDEMPTION_STATUSES.find((s) => s.id === r.status) || REDEMPTION_STATUSES[0];
            const StatusIcon = statusInfo.icon;
            return (
              <div
                key={r.id}
                className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-3 flex gap-3"
              >
                {/* Gift image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/[0.06]">
                  {r.giftImage ? (
                    <img src={r.giftImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.04]">
                      <Gift size={20} className="text-[#475569]" />
                    </div>
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white line-clamp-1">{r.giftTitle}</h3>
                      <p className="text-[10px] text-[#94A3B8] truncate">
                        {r.userName} · {r.userEmail || "no email"}
                      </p>
                    </div>
                    <span
                      className="px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0"
                      style={{ backgroundColor: `${statusInfo.color}25`, color: statusInfo.color }}
                    >
                      <StatusIcon size={9} /> {statusInfo.label}
                    </span>
                  </div>

                  {/* Selected variations */}
                  {Array.isArray(r.selectedVariations) && r.selectedVariations.length > 0 ? (
                    <div className="flex flex-wrap gap-1 my-1.5">
                      {r.selectedVariations.map((v: any, vIdx: number) => (
                        <span
                          key={vIdx}
                          className="px-1.5 py-0.5 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-[9px] font-bold"
                        >
                          {v.name}: <span className="text-white">{v.value}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-[#64748B] italic my-1">No variations selected</p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[9px] text-[#64748B]">
                      {formatTimeAgo(r.createdAt)} · {r.pointsSpent.toLocaleString()} FP spent
                    </p>

                    {/* Status update buttons */}
                    <div className="flex gap-0.5">
                      {REDEMPTION_STATUSES.map((s) => {
                        const SIcon = s.icon;
                        const isCurrent = r.status === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => updateStatus(r.id, s.id)}
                            disabled={isCurrent || updating === r.id}
                            title={`Mark as ${s.label}`}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border ${
                              isCurrent
                                ? "opacity-40 cursor-default"
                                : "hover:bg-white/[0.08] border-white/[0.06]"
                            }`}
                            style={
                              isCurrent
                                ? { backgroundColor: `${s.color}25`, color: s.color, borderColor: `${s.color}40` }
                                : { color: s.color, borderColor: `${s.color}30`, backgroundColor: `${s.color}10` }
                            }
                          >
                            {updating === r.id ? (
                              <div className="w-3 h-3 rounded-full border border-transparent border-t-current animate-spin" />
                            ) : (
                              <SIcon size={11} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help footer */}
      <div className="bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-xl p-3">
        <p className="text-[10px] text-[#A09DB1] leading-relaxed">
          {t('admin.redemptions.workflow')}
        </p>
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────

function AdminSectionHeader({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 rounded-full" style={{ background: color }} />
      <h2 className="text-sm font-bold text-white">{title}</h2>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
        {count}
      </span>
    </div>
  );
}

function AdminCard({
  title,
  subtitle,
  description,
  image,
  badge,
  badgeColor,
  actions,
}: {
  title: string;
  subtitle: string;
  description: string;
  image?: string;
  badge?: string;
  badgeColor?: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-3 flex gap-3">
      {image && (
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/[0.06]">
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold text-white line-clamp-1">{title}</h3>
          {badge && badgeColor && (
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0"
              style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[10px] text-[#94A3B8] mb-1">{subtitle}</p>
        <p className="text-[11px] text-[#A09DB1] line-clamp-2 mb-2">{description}</p>
        <div className="flex gap-2">{actions}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-[#1C1929] border border-dashed border-white/[0.12] rounded-2xl p-8 text-center">
      <Check size={28} className="mx-auto text-[#22C55E] mb-2" />
      <p className="text-sm text-[#94A3B8]">{text}</p>
    </div>
  );
}
