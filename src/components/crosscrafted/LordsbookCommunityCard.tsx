"use client";

import { Globe, ArrowRight } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
  buttonText?: string;
  context?: string;
  variant?: "default" | "compact" | "feature";
};

const LORDSBOOK_URL = "https://www.lordsbook.com/";

/**
 * Reusable Lordsbook community CTA card.
 * Modular — can be removed without affecting any Koino feature.
 * All contextual CTAs across Koino use this single component.
 */
export default function LordsbookCommunityCard({
  title = "Connect with Christians on Lordsbook",
  description = "Your faith journey is better together. Meet Christians, share your faith, join conversations, discover groups and build Christian friendships.",
  buttonText = "Join Lordsbook",
  context = "home",
  variant = "default",
}: Props) {
  const handleClick = () => {
    // Track outbound click (fire-and-forget, non-blocking)
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "lordsbook_cta_click", source: context }),
      }).catch(() => {});
    } catch {}
    // Navigate to Lordsbook
    window.open(LORDSBOOK_URL, "_blank", "noopener,noreferrer");
  };

  if (variant === "compact") {
    return (
      <div className="bg-[#1C1929] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38BDF8] to-[#7C3AED] flex items-center justify-center shrink-0">
          <Globe size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{title}</p>
          <p className="text-[9px] text-[#94A3B8] line-clamp-1">{description}</p>
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
      {/* Subtle glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#38BDF8]/8 blur-2xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#7C3AED]/8 blur-2xl rounded-full pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-lg shadow-[#38BDF8]/20">
          <Globe size={24} className="text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#38BDF8] mb-1">Connect with Christians</p>
          <h3 className="text-base font-bold text-white mb-1">{title}</h3>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed max-w-md">{description}</p>
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
