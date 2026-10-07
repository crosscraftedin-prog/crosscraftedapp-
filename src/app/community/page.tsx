import type { Metadata } from "next";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import LordsbookCommunityCard from "@/components/crosscrafted/LordsbookCommunityCard";
import { Globe, Users, MessageCircle, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Christian Community | Koino",
  description: "Connect with Christians, share your faith and build meaningful Christian friendships through Lordsbook.",
  openGraph: {
    title: "Christian Community | Koino",
    description: "Connect with Christians, share your faith and build Christian friendships.",
    siteName: "Koino",
  },
};

const FEATURES = [
  { icon: BookOpen, title: "Share Your Faith", desc: "Share testimonies, thoughts, Scripture and encouragement." },
  { icon: Users, title: "Meet Christians", desc: "Connect with believers and build Christian friendships." },
  { icon: Globe, title: "Join Groups", desc: "Find communities around interests, churches and Christian life." },
  { icon: MessageCircle, title: "Start Conversations", desc: "Talk about Scripture, faith and everyday life." },
];

export default function CommunityPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-[#38BDF8] text-xs font-bold uppercase tracking-wider mb-6">
          <Globe size={12} /> Christian Community
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          Your faith journey{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] to-[#7C3AED]">
            is better together
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
        <LordsbookCommunityCard
          title="Be Part of the Global Christian Community"
          description="Connect, share, discuss and grow with Christians on Lordsbook."
          buttonText="Join Lordsbook"
          context="community_page"
        />
      </section>
    </PublicPageLayout>
  );
}
