import type { Metadata } from "next";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import LordsbookCommunityCard from "@/components/crosscrafted/LordsbookCommunityCard";
import { Globe, Users, MessageCircle, BookOpen, Heart, Handshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet Christians Around the World | Koino",
  description: "Connect with Christians, share your faith and build meaningful Christian friendships through Lordsbook.",
  openGraph: {
    title: "Meet Christians Around the World | Koino",
    description: "Connect with Christians around the world on Lordsbook.",
    siteName: "Koino",
  },
};

const FEATURES = [
  { icon: BookOpen, title: "Share Your Faith", desc: "Share testimonies, Scripture, encouragement and your faith journey." },
  { icon: Users, title: "Meet Christians", desc: "Build Christian friendships with believers around the world." },
  { icon: Globe, title: "Join Communities", desc: "Discover Christian groups, conversations and shared interests." },
  { icon: MessageCircle, title: "Start Conversations", desc: "Talk about Scripture, faith and everyday life." },
];

const WHY = [
  { icon: Globe, title: "Global", desc: "Meet Christians from different countries, cities and backgrounds." },
  { icon: Heart, title: "Community", desc: "Build meaningful Christian friendships." },
  { icon: MessageCircle, title: "Conversation", desc: "Share your thoughts, testimony, encouragement and faith." },
  { icon: Handshake, title: "Fellowship", desc: "Connect beyond the individual Koino experience." },
];

export default function CommunityPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] text-xs font-bold uppercase tracking-wider mb-6">
          <Globe size={12} /> Global Christian Community
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          Meet Christians{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#7C3AED]">
            Around the World
          </span>
        </h1>
        <p className="text-base text-[#A09DB1] leading-relaxed max-w-2xl mx-auto mb-2">
          Koino helps you read Scripture, learn, pray and grow.
        </p>
        <p className="text-base text-[#A09DB1] leading-relaxed max-w-2xl mx-auto">
          Lordsbook helps you connect with Christians around the world.
        </p>
      </section>

      {/* Feature cards */}
      <section className="py-8 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/25 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-[#38BDF8]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
              <p className="text-[11px] text-[#A09DB1] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lordsbook CTA */}
      <section className="py-8 px-6 max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-[#0D1A2E] via-[#1C1929] to-[#1A0D2E] border border-[#38BDF8]/15 rounded-2xl p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#38BDF8] mb-2">Global Christian Community</p>
          <h2 className="text-lg font-bold text-white mb-2">Your faith journey was never meant to be lived alone.</h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
            Connect, share, discuss and grow with Christians on Lordsbook.
          </p>
          <LordsbookCommunityCard
            title="Meet Christians on Lordsbook"
            description=""
            buttonText="Meet Christians on Lordsbook"
            context="community_page"
            variant="result"
          />
        </div>
      </section>

      {/* Why Lordsbook */}
      <section className="py-8 px-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-white text-center mb-6">Why Connect on Lordsbook?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WHY.map((w) => (
            <div key={w.title} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/25 flex items-center justify-center shrink-0">
                <w.icon size={18} className="text-[#A78BFA]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">{w.title}</h3>
                <p className="text-[11px] text-[#A09DB1] leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-6 max-w-3xl mx-auto text-center">
        <h2 className="text-xl font-bold text-white mb-2">Ready to Meet Christians Around the World?</h2>
        <p className="text-sm text-[#A09DB1] mb-1">Koino helps you grow in your faith.</p>
        <p className="text-sm text-[#A09DB1] mb-5">Lordsbook helps you connect with people who share it.</p>
        <LordsbookCommunityCard
          title="Join Lordsbook"
          description=""
          buttonText="Join Lordsbook"
          context="community_page_final"
          variant="result"
        />
      </section>
    </PublicPageLayout>
  );
}
