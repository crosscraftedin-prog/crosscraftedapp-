"use client";

import { Globe, ArrowRight } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  buttonText?: string;
  context?: string;
  variant?: "default" | "compact" | "feature" | "inline" | "result";
};

const LORDSBOOK_URL = "https://www.lordsbook.com/";

/**
 * Reusable Lordsbook community CTA card.
 * Modular — can be removed without affecting any Koino feature.
 * Phase 2 messaging: "Meet Christians Around the World"
 */
export default function LordsbookCommunityCard({
  title = "Meet Christians Around the World",
  description = "Connect with Christians around the world, share your faith, join conversations and build meaningful Christian friendships on Lordsbook.",
  buttonText = "Meet Christians on Lordsbook",
  context = "home",
  variant = "default",
}: Props) {
  const handleClick = () => {
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "lordsbook_cta_click", source: context, variant }),
      }).catch(() => {});
    } catch {}
    window.open(LORDSBOOK_URL, "_blank", "noopener,noreferrer");
  };

  if (variant === "compact" || variant === "inline") {
    return (
      <div className="bg-gradient-to-br from-[#0D1A2E] to-[#1C1929] border border-[#38BDF8]/15 rounded-xl p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#7C3AED] flex items-center justify-center shrink-0">
          <Globe size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{title}</p>
          <p className="text-[9px] text-[#94A3B8] line-clamp-2">{description}</p>
        </div>
        <button
          onClick={handleClick}
          aria-label={`${buttonText} — opens Lordsbook in a new tab`}
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#38BDF8] to-[#7C3AED] text-white text-[9px] font-bold uppercase tracking-wider shrink-0 hover:opacity-90 transition-opacity flex items-center gap-1"
        >
          {buttonText} <ArrowRight size={10} />
        </button>
      </div>
    );
  }

  if (variant === "result") {
    return (
      <div className="bg-gradient-to-br from-[#0D1A2E] via-[#1C1929] to-[#1A0D2E] border border-[#38BDF8]/15 rounded-2xl p-4 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-[#38BDF8] to-[#7C3AED] flex items-center justify-center">
          <Globe size={18} className="text-white" />
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#38BDF8] mb-1">Meet Christians Around the World</p>
        <p className="text-[11px] text-[#94A3B8] leading-relaxed mb-3">{description}</p>
        <button
          onClick={handleClick}
          aria-label={`${buttonText} — opens Lordsbook in a new tab`}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#7C3AED] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
        >
          {buttonText} <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  if (variant === "feature") {
    return (
      <div className="bg-gradient-to-br from-[#1C1929] to-[#0D1A2E] border border-[#38BDF8]/15 rounded-2xl p-5 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#7C3AED] flex items-center justify-center">
          <Globe size={22} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
        <p className="text-[11px] text-[#94A3B8] leading-relaxed mb-3">{description}</p>
        <button
          onClick={handleClick}
          aria-label={`${buttonText} — opens Lordsbook in a new tab`}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#7C3AED] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
        >
          {buttonText} <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  // Default: full-width promotional card
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D1A2E] via-[#1C1929] to-[#1A0D2E] border border-[#38BDF8]/15 p-5">
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#38BDF8]/8 blur-2xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#7C3AED]/8 blur-2xl rounded-full pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-lg shadow-[#38BDF8]/20">
          <Globe size={24} className="text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#38BDF8] mb-1">🌍 Meet Christians Around the World</p>
          <h3 className="text-base font-bold text-white mb-1">{title}</h3>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed max-w-md">{description}</p>
          <p className="text-[9px] text-[#475569] mt-1">Global Christian Community</p>
        </div>
        <button
          onClick={handleClick}
          aria-label={`${buttonText} — opens Lordsbook in a new tab`}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#38BDF8] to-[#7C3AED] text-white text-xs font-extrabold uppercase tracking-wider hover:opacity-90 transition-opacity shrink-0 flex items-center gap-2 shadow-lg shadow-[#38BDF8]/20"
        >
          {buttonText} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
