import type { Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import { Heart, Server, BookOpen, Trophy, Users, ShieldCheck, Code } from "lucide-react";
import Link from "next/link";

const db = new PrismaClient();

export const metadata: Metadata = {
  title: "Support Koino — Help Keep Koino Free",
  description: "Koino is free to use. Your support helps keep it that way. Support technology, Bible content, trivia prizes, and community development.",
  openGraph: {
    title: "Support Koino — Help Keep Koino Free",
    description: "Koino is free to use. Your support helps keep it that way.",
    siteName: "Koino",
  },
};

export const dynamic = "force-dynamic";

const SUPPORT_AREAS = [
  { icon: Server, title: "Technology & Hosting", desc: "Servers, databases, storage, security and infrastructure." },
  { icon: BookOpen, title: "Bible & Christian Content", desc: "Bible resources, educational content and Christian experiences." },
  { icon: Trophy, title: "Bible Trivia & Prizes", desc: "Prizes and competitions that encourage people to learn Scripture." },
  { icon: Users, title: "Community Development", desc: "Churches, events, prayer and Christian community features." },
  { icon: ShieldCheck, title: "Safety & Moderation", desc: "Helping keep Koino a welcoming and safe community." },
  { icon: Code, title: "Future Development", desc: "New features, mobile improvements and continued development." },
];

export default async function SupportPage() {
  // Fetch active campaigns from DB
  const campaigns = await db.supportCampaign.findMany({
    where: { active: true },
    orderBy: { featured: "desc" },
  });

  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="py-16 px-6 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F39B9B]/10 border border-[#F39B9B]/20 text-[#F39B9B] text-xs font-bold uppercase tracking-wider mb-6">
          <Heart size={12} fill="currentColor" /> Support Koino
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">Help Keep Koino Free</h1>
        <p className="text-base text-[#A09DB1] leading-relaxed mb-4">
          Koino is built to be a free Christian community platform for people everywhere.
          Your support helps us keep the platform running, build new features, support Christian
          communities, create Bible content, provide prizes and continue improving Koino for everyone.
        </p>
        <p className="text-sm font-bold text-[#F39B9B] mb-8">
          Koino is free to use. Your support helps keep it that way.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="#campaigns" className="px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all hover:-translate-y-px flex items-center gap-2">
            <Heart size={16} /> Support Koino
          </Link>
          <Link href="/partner" className="px-8 py-3.5 border border-white/[0.08] hover:border-white/[0.15] text-[#A09DB1] hover:text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all bg-white/[0.02]">
            Become a Partner
          </Link>
        </div>
      </section>

      {/* Support areas */}
      <section className="py-8 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUPPORT_AREAS.map((a) => (
            <div key={a.title} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/25 flex items-center justify-center mb-3">
                <a.icon size={18} className="text-[#A78BFA]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{a.title}</h3>
              <p className="text-[11px] text-[#A09DB1] leading-relaxed">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Campaigns */}
      <section id="campaigns" className="py-8 px-6 max-w-2xl mx-auto">
        {campaigns.length > 0 ? (
          campaigns.map((c) => {
            const pct = c.goalAmount > 0 ? Math.min(100, (c.raisedAmount / c.goalAmount) * 100) : 0;
            return (
              <div key={c.id} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-6 mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{c.name}</h3>
                {c.description && <p className="text-xs text-[#A09DB1] mb-4">{c.description}</p>}
                <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-[#F39B9B] to-[#7C3AED]" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-bold">₹{c.raisedAmount.toLocaleString()} raised</span>
                  <span className="text-[#94A3B8]">Goal: ₹{c.goalAmount.toLocaleString()}</span>
                  <span className="text-[#94A3B8]">{c.supporterCount} supporters</span>
                </div>
                <div className="mt-4 p-3 bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-xl">
                  <p className="text-[10px] text-[#F59E0B] font-bold text-center">
                    ⚠ Payment processing is not yet connected. This campaign display is ready — contact us to support Koino.
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-6 text-center">
            <p className="text-sm text-[#A09DB1] mb-4">
              No active support campaigns yet. Koino is free to use, and your support helps keep it that way.
            </p>
          </div>
        )}

        {/* Honest payment status */}
        <div className="mt-6 bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-2xl p-4">
          <p className="text-[11px] text-[#A09DB1] leading-relaxed text-center">
            <span className="text-[#F59E0B] font-bold">Payment Integration Status:</span> Online payment processing
            (donations/giving) is not yet connected. The campaign display, donation tracking, and admin configuration
            are built and ready. To enable real giving, a payment provider (e.g., Razorpay, Stripe) needs to be
            configured. Until then, please <Link href="/contact" className="text-[#A78BFA] underline">contact us</Link> to support Koino.
          </p>
        </div>
      </section>
    </PublicPageLayout>
  );
}
