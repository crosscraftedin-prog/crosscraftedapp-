"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  Search,
  Building2,
  Store,
  HeartHandshake,
  Globe,
  Calendar,
  Users,
} from "lucide-react";
import LanguageSwitcher from "@/components/crosscrafted/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type Props = {
  onEnterApp: (view: string) => void;
};

const FEATURES = [
  {
    icon: BookOpen,
    color: "#7C3AED",
    title: "Holy Bible",
    desc: "Read the entire Bible — all 66 books — in KJV or WEB translation. Search by keyword, bookmark verses, and follow daily reading plans.",
    view: "bible",
  },
  {
    icon: Sparkles,
    color: "#EC4899",
    title: "Bible Comics",
    desc: "Experience Bible stories through original visual storytelling. Genesis and more — panel-by-panel illustrated Scripture.",
    view: "comic",
  },
  {
    icon: Search,
    color: "#F39B9B",
    title: "Churches",
    desc: "Find churches across India filtered by state, city, and language. Follow churches you attend or want to stay connected with.",
    view: "churches",
  },
  {
    icon: Calendar,
    color: "#38BDF8",
    title: "Events",
    desc: "Discover Christian events, conferences, worship gatherings and community activities. Filter by state, city, date and category.",
    view: "events",
  },
  {
    icon: HeartHandshake,
    color: "#F59E0B",
    title: "Prayer Wall",
    desc: "Share prayer requests, pray for others and encourage one another in faith.",
    view: "prayer-wall",
  },
  {
    icon: Award,
    color: "#22C55E",
    title: "Bible Trivia",
    desc: "Test your Bible knowledge across 4 difficulty levels. Choose Full Bible, New Testament, Old Testament, or Apologetics. Earn Faith Points and unlock rewards.",
    view: "trivia",
  },
  {
    icon: Store,
    color: "#9786E3",
    title: "Marketplace",
    desc: "Discover Christian products and connect with sellers — Bibles, books, music, apparel, and more.",
    view: "shop",
  },
  {
    icon: Building2,
    color: "#0EA5E9",
    title: "Business Directory",
    desc: "Discover Christian businesses, services and professionals across India.",
    view: "business-directory",
  },
  {
    icon: Users,
    color: "#A855F7",
    title: "Community",
    desc: "Connect with believers and grow together in faith.",
    view: "churches",
  },
];

const TRIVIA_LEVELS = [
  { label: "Beginners", color: "#22C55E", desc: "10 pts/q" },
  { label: "Intermediate", color: "#3B82F6", desc: "20 pts/q" },
  { label: "Skilled", color: "#A855F7", desc: "30 pts/q" },
  { label: "Expert", color: "#EF4444", desc: "50 pts/q" },
];

const LANGUAGES = [
  { label: "English", flag: "🇬🇧" },
  { label: "हिन्दी", flag: "🇮🇳" },
  { label: "తెలుగు", flag: "🇮🇳" },
  { label: "தமிழ்", flag: "🇮🇳" },
];

export default function LandingHero({ onEnterApp }: Props) {
  const t = useTranslation();
  return (
    <div className="min-h-screen bg-[#12101A] text-white flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-[#12101A]/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/believ-logo.png"
              alt="Believ"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <h1 className="text-base font-black tracking-tight">{t("brand.name")}</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#94A3B8]">
            <button onClick={() => onEnterApp("bible")} className="hover:text-white transition-colors">{t("nav.bible")}</button>
            <button onClick={() => onEnterApp("churches")} className="hover:text-white transition-colors">{t("nav.churches")}</button>
            <button onClick={() => onEnterApp("events")} className="hover:text-white transition-colors">{t("nav.events")}</button>
            <button onClick={() => onEnterApp("trivia")} className="hover:text-white transition-colors">{t("nav.trivia")}</button>
            <button onClick={() => onEnterApp("prayer-wall")} className="hover:text-white transition-colors">{t("nav.prayer")}</button>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => onEnterApp("home")}
              className="px-5 py-2.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all hover:-translate-y-px"
            >
              {t("nav.enterApp")}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F39B9B]/10 border border-[#F39B9B]/20 text-[#F39B9B] text-xs font-bold uppercase tracking-wider"
          >
            <Sparkles size={12} fill="currentColor" />
            Faith Community Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight"
          >
            Believ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F39B9B] to-[#9786E3]">
              {t('landing.titleGradient')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-[#A09DB1] max-w-xl mx-auto leading-relaxed"
          >
            {t('landing.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-2"
          >
            <button
              onClick={() => onEnterApp("home")}
              className="px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-[#F39B9B]/20 flex items-center gap-2 transition-all hover:-translate-y-px"
            >
              <ArrowRight size={18} /> {t("landing.cta.enterBeliev")}
            </button>
            <button
              onClick={() => onEnterApp("bible")}
              className="px-8 py-3.5 border border-white/[0.08] hover:border-white/[0.15] text-[#A09DB1] hover:text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all bg-white/[0.02] flex items-center gap-2"
            >
              <BookOpen size={18} /> {t("landing.cta.readBible")}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-4 gap-6 pt-8 border-t border-white/[0.04] max-w-lg mx-auto"
          >
            <div>
              <p className="text-xl font-extrabold text-[#F39B9B]">800+</p>
              <p className="text-[10px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">{t('landing.stats.questions')}</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#7C3AED]">7</p>
              <p className="text-[10px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">{t('landing.stats.tiers')}</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#38BDF8]">11</p>
              <p className="text-[10px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">{t('landing.stats.languages')}</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#22C55E]">Free</p>
              <p className="text-[10px] text-[#726E88] font-bold uppercase tracking-wider mt-0.5">{t('landing.stats.toUse')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bible CTA */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/25 text-[#A78BFA] text-xs font-bold">
                <BookOpen size={12} /> The Holy Bible
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('bible.title')}</h2>
              <p className="text-sm text-[#A09DB1] leading-relaxed">
                All 66 books, in KJV and WEB translations. Search any verse by keyword,
                bookmark favorites, and follow daily reading plans — Bible in 90 Days,
                Gospels in 14 Days, Psalms &amp; Proverbs in 31 Days.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.06]">
                  <p className="text-xs font-bold text-[#A78BFA]">{t('bible.stat.books')}</p>
                  <p className="text-[10px] text-[#94A3B8]">39 OT · 27 NT</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.06]">
                  <p className="text-xs font-bold text-[#38BDF8]">{t('bible.stat.translations')}</p>
                  <p className="text-[10px] text-[#94A3B8]">KJV · WEB</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.06]">
                  <p className="text-xs font-bold text-[#F59E0B]">{t('bible.stat.plans')}</p>
                  <p className="text-[10px] text-[#94A3B8]">14 – 90 days</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.06]">
                  <p className="text-xs font-bold text-[#22C55E]">{t('bible.stat.langs')}</p>
                  <p className="text-[10px] text-[#94A3B8]">Indian UIs</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={() => onEnterApp("bible")}
                className="w-full px-8 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
              >
                <BookOpen size={16} /> Open the Bible
              </button>
              <button
                onClick={() => onEnterApp("bible-plans")}
                className="w-full mt-3 px-8 py-3 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] text-[#94A3B8] hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all"
              >
                Browse Reading Plans
              </button>
              <p className="text-xs text-[#726E88] mt-3">Free · Works offline after first read</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-white/[0.03] bg-[#1C1929]/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('features.title')}</h2>
            <p className="text-sm text-[#A09DB1]">
              From Bible quizzes to church listings, everything a Christian community needs — in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.button
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                onClick={() => onEnterApp(f.view)}
                className="text-left bg-[#1C1929] border hover:bg-[#22202F] transition-all group rounded-3xl p-6 space-y-3"
                style={{ borderColor: `${f.color}33` }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border"
                  style={{ backgroundColor: `${f.color}1A`, borderColor: `${f.color}40` }}
                >
                  <f.icon style={{ color: f.color }} size={20} />
                </div>
                <h3 className="text-base font-bold text-white group-hover:opacity-90 transition-opacity">{f.title}</h3>
                <p className="text-xs text-[#A09DB1] leading-relaxed">{f.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Trivia CTA */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-3xl p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/25 text-[#A78BFA] text-xs font-bold">
                <Award size={12} /> Bible Trivia Challenge
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('trivia.title')}</h2>
              <p className="text-sm text-[#A09DB1] leading-relaxed">
                4 difficulty levels, 4 categories, growing question pool, Faith Points and real rewards
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {TRIVIA_LEVELS.map((lvl) => (
                  <div key={lvl.label} className="bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.06]">
                    <p className="text-xs font-bold" style={{ color: lvl.color }}>
                      {lvl.label}
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">{lvl.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={() => onEnterApp("trivia")}
                className="w-full px-8 py-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-[#7C3AED]/25 flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
              >
                Start Challenge <ArrowRight size={16} strokeWidth={2.5} />
              </button>
              <p className="text-xs text-[#726E88] mt-3">Free to play. Earn badges and recognition</p>
            </div>
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-12 px-6 max-w-3xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Globe size={20} className="text-[#38BDF8]" />
          <h2 className="text-xl font-extrabold">{t('languages.title')}</h2>
        </div>
        <div className="flex justify-center gap-4">
          {LANGUAGES.map((lang) => (
            <div key={lang.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-center">
              <span className="text-2xl">{lang.flag}</span>
              <p className="text-xs font-bold text-[#94A3B8] mt-1">{lang.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-6 text-center max-w-4xl mx-auto w-full mt-auto">
        <div className="bg-gradient-to-tr from-[#1C1929] to-slate-900 border border-white/[0.06] rounded-3xl p-8 sm:p-12 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#F39B9B]/5 blur-2xl rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-[#9786E3]/5 blur-2xl rounded-full" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight relative">{t('cta.title')}</h2>
          <p className="text-xs sm:text-sm text-[#A09DB1] max-w-lg mx-auto leading-relaxed relative">
            {t('cta.subtitle')}
          </p>
          <div className="pt-2 relative">
            <button
              onClick={() => onEnterApp("home")}
              className="px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all inline-flex items-center gap-2 hover:-translate-y-px"
            >
              Enter Believ <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/believ-logo.png"
              alt="Believ"
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="text-sm font-bold text-[#94A3B8]">Believ</span>
          </div>
          <p className="text-xs text-[#726E88]">Built with faith, for the body of Christ. Soli Deo Gloria.</p>
        </div>
      </footer>
    </div>
  );
}
