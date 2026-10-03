"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  UsersRound,
  Award,
  BookOpen,
  Building2,
  Store,
  Heart,
  Sparkles,
  LogOut,
  Home as HomeIcon,
  HeartHandshake,
  BookMarked,
  ListChecks,
} from "lucide-react";
import LandingHero from "@/components/crosscrafted/LandingHero";
import ChurchesView from "@/components/crosscrafted/ChurchesView";
import TriviaView from "@/components/crosscrafted/TriviaView";
import PrayerWallView from "@/components/crosscrafted/PrayerWallView";
import EventsView from "@/components/crosscrafted/EventsView";
import ApologeticsView from "@/components/crosscrafted/ApologeticsView";
import ShopView from "@/components/crosscrafted/ShopView";
import ListYourEntity from "@/components/crosscrafted/ListYourEntity";
import BibleView from "@/components/crosscrafted/BibleView";
import BiblePlansView from "@/components/crosscrafted/BiblePlansView";
import { type Translation } from "@/lib/bible-data";

type View =
  | "landing"
  | "bible"
  | "bible-plans"
  | "churches"
  | "events"
  | "trivia"
  | "prayer-wall"
  | "apologetics"
  | "shop"
  | "list-church"
  | "list-business"
  | "small-groups";

// Bible is the main feature — placed at the top of the sidebar.
const SIDEBAR_LINKS: { id: View; icon: typeof Search; label: string }[] = [
  { id: "bible", icon: BookOpen, label: "Bible" },
  { id: "bible-plans", icon: BookMarked, label: "Reading Plans" },
  { id: "churches", icon: Search, label: "Churches" },
  { id: "events", icon: Calendar, label: "Events" },
  { id: "small-groups", icon: UsersRound, label: "Small Groups" },
  { id: "trivia", icon: Award, label: "Bible Trivia" },
  { id: "apologetics", icon: ListChecks, label: "Apologetics" },
  { id: "list-church", icon: Building2, label: "List Church" },
  { id: "shop", icon: Store, label: "Marketplace" },
  { id: "prayer-wall", icon: HeartHandshake, label: "Prayer Wall" },
];

// Mobile bottom nav — Bible takes the first slot (top priority).
const MOBILE_NAV: { id: View; icon: typeof Search; label: string }[] = [
  { id: "bible", icon: BookOpen, label: "Bible" },
  { id: "churches", icon: Search, label: "Churches" },
  { id: "trivia", icon: Award, label: "Trivia" },
  { id: "shop", icon: Store, label: "Shop" },
  { id: "prayer-wall", icon: Heart, label: "Prayer" },
];

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Navigate to a new view, also resetting header + scroll position.
  const navigate = (next: View) => {
    setView(next);
    setHeaderVisible(true);
    lastScrollY.current = 0;
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  // Auto-hide header on mobile scroll
  useEffect(() => {
    if (view === "landing") return;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 10) setHeaderVisible(true);
      else if (y > lastScrollY.current + 8) setHeaderVisible(false);
      else if (y < lastScrollY.current - 8) setHeaderVisible(true);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  const enterApp = (v: string) => navigate(v as View);
  const goHome = () => navigate("landing");
  const goView = (v: View) => navigate(v);

  // Landing view — full screen
  if (view === "landing") {
    return <LandingHero onEnterApp={enterApp} />;
  }

  // App view with sidebar + bottom nav
  return (
    <div className="min-h-screen bg-[#12101A]">
      {/* Header — auto-hides on mobile scroll */}
      <header
        className={`sticky top-0 z-50 bg-[#12101A]/80 backdrop-blur-2xl border-b border-white/[0.04] transition-transform duration-300 ${
          headerVisible ? "translate-y-0" : "md:translate-y-0 -translate-y-full"
        }`}
      >
        <div className="flex justify-between items-center h-12 md:h-14 px-4 md:px-5">
          <button onClick={goHome} className="flex items-center gap-2">
            {/* Stacked Cards Logo Icon */}
            <div className="relative w-8 h-8 shrink-0">
              <div className="absolute inset-0 rounded-lg bg-[#2B254E] border border-white/[0.05] shadow-sm transform -rotate-12 translate-x-[-1px] translate-y-[1px]" />
              <div className="absolute inset-0 rounded-lg bg-[#F39B9B] shadow-sm flex items-center justify-center">
                <span className="text-slate-950 font-black text-sm select-none">+</span>
                <span className="absolute top-0.5 right-0.5 text-[#9786E3] text-[6px] select-none">★</span>
              </div>
            </div>
            <h1 className="text-base md:text-lg font-black tracking-tight text-white">crosscrafted</h1>
          </button>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F39B9B] to-[#9786E3] flex items-center justify-center text-[10px] font-bold text-slate-950">
                G
              </div>
              <span className="text-sm text-[#94A3B8]">Guest</span>
            </div>
            <button
              onClick={goHome}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              title="Back to home"
            >
              <HomeIcon size={18} strokeWidth={1.8} className="text-[#64748B]" />
            </button>
            <button
              onClick={goHome}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} strokeWidth={1.8} className="text-[#64748B]" />
            </button>
          </div>
          {/* Mobile: minimal right side */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#F39B9B] to-[#9786E3] flex items-center justify-center text-[10px] font-bold text-slate-950">
              G
            </div>
            <button
              onClick={goHome}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06]"
            >
              <LogOut size={14} className="text-[#64748B]" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-white/[0.04] min-h-[calc(100vh-56px)] sticky top-[56px] bg-[#0B1120] px-3 pt-6">
          <nav className="space-y-1">
            {SIDEBAR_LINKS.map(({ id, icon: Icon, label }) => {
              const active = view === id;
              return (
                <button
                  key={id}
                  onClick={() => goView(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-[14px] transition-all duration-200 border ${
                    active
                      ? "bg-[#7C3AED]/15 text-white border-[#7C3AED]/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]"
                      : "text-[#94A3B8] hover:text-white hover:bg-white/[0.04] border-transparent"
                  }`}
                >
                  <div className="relative">
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.4 : 1.8}
                      className={active ? "text-[#7C3AED]" : ""}
                    />
                  </div>
                  {label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto pt-6 pb-4">
            <div className="bg-gradient-to-br from-[#7C3AED]/15 to-[#EC4899]/15 border border-[#7C3AED]/20 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={12} className="text-[#A78BFA]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">Daily Verse</p>
              </div>
              <p className="text-[11px] text-white leading-snug italic mb-1">
                "I can do all things through Christ who strengthens me."
              </p>
              <p className="text-[10px] text-[#94A3B8]">— Philippians 4:13</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-24 md:pb-6 scroll-smooth bg-[#0B1120] min-h-[calc(100vh-56px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {view === "bible" && <BibleView />}
              {view === "bible-plans" && (
                <BiblePlansView
                  translation="kjv"
                  onOpenChapter={() => goView("bible")}
                />
              )}
              {view === "churches" && <ChurchesView />}
              {view === "events" && <EventsView />}
              {view === "trivia" && <TriviaView />}
              {view === "prayer-wall" && <PrayerWallView />}
              {view === "apologetics" && <ApologeticsView />}
              {view === "shop" && <ShopView />}
              {view === "list-church" && <ListYourEntity variant="church" />}
              {view === "list-business" && <ListYourEntity variant="business" />}
              {view === "small-groups" && <ComingSoonView title="Small Groups" />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-[20px] bg-[#111827]/80 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-around h-14 px-1">
          {MOBILE_NAV.map(({ id, icon: Icon, label }) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => goView(id)}
                className="flex flex-col items-center justify-center relative py-1"
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.6}
                    fill={active ? "currentColor" : "none"}
                    className={`transition-all duration-200 ${
                      active
                        ? "text-[#38BDF8] scale-110 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                  />
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold tracking-wide mt-1 transition-all ${
                    active ? "text-white font-extrabold" : "text-[#94A3B8]"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ComingSoonView({ title }: { title: string }) {
  return (
    <div className="max-w-[680px] mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED]/15 to-[#EC4899]/15 border border-[#7C3AED]/25 mb-4">
        <Sparkles size={28} className="text-[#A78BFA]" />
      </div>
      <h2 className="text-xl font-extrabold text-white mb-2">{title}</h2>
      <p className="text-sm text-[#A09DB1] max-w-sm mx-auto">
        This section is coming soon. We're building {title.toLowerCase()} with the same care and
        prayer as everything else on crosscrafted. Check back shortly — or explore Churches, Trivia,
        Apologetics, and more in the meantime!
      </p>
    </div>
  );
}
