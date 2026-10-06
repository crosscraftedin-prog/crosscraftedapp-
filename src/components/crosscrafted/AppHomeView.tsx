"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  Search,
  Calendar,
  Award,
  HeartHandshake,
  Store,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useSupabaseUser } from "@/lib/supabase/use-user";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type View =
  | "bible"
  | "comic"
  | "churches"
  | "events"
  | "trivia"
  | "prayer-wall"
  | "shop"
  | "business-directory";

type Props = {
  /** Navigate to a feature view. The parent (page.tsx) wires this to goView(). */
  onNavigate: (view: View) => void;
};

type FeatureCard = {
  icon: typeof BookOpen;
  color: string;
  title: string;
  desc: string;
  view: View;
  group: "BELIEVE" | "CONNECT" | "GROW" | "PLAY" | "DISCOVER";
};

// Single source of truth for the App Home feature grid.
// Each card links to an existing feature — no fake functionality.
const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: BookOpen,
    color: "#7C3AED",
    title: "Holy Bible",
    desc: "Read Scripture and explore Bible resources.",
    view: "bible",
    group: "BELIEVE",
  },
  {
    icon: Sparkles,
    color: "#EC4899",
    title: "Bible Comics",
    desc: "Experience Bible stories through original visual storytelling.",
    view: "comic",
    group: "PLAY",
  },
  {
    icon: Search,
    color: "#F39B9B",
    title: "Churches",
    desc: "Discover Christian churches and congregations by location.",
    view: "churches",
    group: "CONNECT",
  },
  {
    icon: Calendar,
    color: "#38BDF8",
    title: "Events",
    desc: "Discover Christian events and gatherings near you.",
    view: "events",
    group: "CONNECT",
  },
  {
    icon: HeartHandshake,
    color: "#F59E0B",
    title: "Prayer Wall",
    desc: "Share prayer requests and pray for others.",
    view: "prayer-wall",
    group: "CONNECT",
  },
  {
    icon: Award,
    color: "#22C55E",
    title: "Bible Trivia",
    desc: "Test your Bible knowledge and earn Faith Points.",
    view: "trivia",
    group: "PLAY",
  },
  {
    icon: Store,
    color: "#9786E3",
    title: "Marketplace",
    desc: "Discover Christian products and connect with sellers.",
    view: "shop",
    group: "DISCOVER",
  },
  {
    icon: Building2,
    color: "#0EA5E9",
    title: "Business Directory",
    desc: "Discover Christian businesses, services and professionals.",
    view: "business-directory",
    group: "DISCOVER",
  },
];

const GROUPS: { label: string; color: string }[] = [
  { label: "BELIEVE", color: "#7C3AED" },
  { label: "CONNECT", color: "#F39B9B" },
  { label: "GROW", color: "#38BDF8" },
  { label: "PLAY", color: "#EC4899" },
  { label: "DISCOVER", color: "#0EA5E9" },
];

export default function AppHomeView({ onNavigate }: Props) {
  const t = useTranslation();
  const { user, isAuthenticated } = useSupabaseUser();

  // Supabase auth user — name comes from user_metadata (full_name / name),
  // falling back to the email local-part. Mirrors HeaderUserSection pattern.
  const displayName = isAuthenticated
    ? (user?.user_metadata?.full_name ||
       user?.user_metadata?.name ||
       (user?.email ? user.email.split("@")[0] : null) ||
       "friend")
    : null;

  const greeting = displayName
    ? `Welcome, ${String(displayName).split(" ")[0]}`
    : "Welcome to Believ";

  return (
    <div className="max-w-[680px] mx-auto px-4 py-5 pb-28 md:pb-5">
      {/* ─── HERO WELCOME ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6 pt-2"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#F39B9B] mb-2">
          BELIEV
        </p>
        <h1 className="text-2xl font-black text-white mb-1">
          {greeting}
        </h1>
        <p className="text-sm text-[#A09DB1]">
          Believe. Connect. Grow. Play.
        </p>
        <p className="text-[11px] text-[#726E88] mt-2 max-w-md mx-auto">
          Choose where you'd like to go. Everything in Believ is one tap away.
        </p>
      </motion.div>

      {/* ─── FEATURE CARDS GROUPED BY BELIEVE / CONNECT / GROW / PLAY / DISCOVER ─── */}
      <div className="space-y-6">
        {GROUPS.map((group) => {
          const cards = FEATURE_CARDS.filter((c) => c.group === group.label);
          if (cards.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span
                  className="text-[10px] font-black uppercase tracking-[0.25em]"
                  style={{ color: group.color }}
                >
                  {group.label}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: `linear-gradient(to right, ${group.color}33, transparent)` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {cards.map((f, i) => (
                  <motion.button
                    key={f.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => onNavigate(f.view)}
                    className="text-left bg-[#1C1929] border hover:bg-[#22202F] transition-all group rounded-2xl p-3.5 space-y-2"
                    style={{ borderColor: `${f.color}33` }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center border"
                      style={{ backgroundColor: `${f.color}1A`, borderColor: `${f.color}40` }}
                    >
                      <f.icon style={{ color: f.color }} size={16} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-bold text-white group-hover:opacity-90 transition-opacity">
                        {f.title}
                      </h3>
                      <p className="text-[10px] text-[#A09DB1] leading-relaxed mt-0.5 line-clamp-2">
                        {f.desc}
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider"
                      style={{ color: f.color }}
                    >
                      Open <ArrowRight size={9} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
