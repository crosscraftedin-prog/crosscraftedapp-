import type { Metadata } from "next";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import { Sparkles, Heart, Users, BookOpen, Trophy, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "About Koino — Faith. Fellowship. Belong.",
  description: "Koino is a Christian community platform designed to bring Scripture, fellowship, churches, events, prayer, Bible learning, Christian businesses and community experiences together in one place.",
  openGraph: {
    title: "About Koino — Faith. Fellowship. Belong.",
    description: "Koino is an all-in-one Christian community platform.",
    siteName: "Koino",
    type: "website",
  },
};

const PILLARS = [
  { icon: BookOpen, title: "Faith", desc: "Read the Bible, explore Bible Comics, and grow in your understanding of Scripture." },
  { icon: Heart, title: "Fellowship", desc: "Connect with churches, discover Christian events, and pray together as a community." },
  { icon: Users, title: "Belong", desc: "Find your place in the Christian community — churches, groups, businesses and more." },
];

const FEATURES = [
  { icon: BookOpen, title: "Holy Bible", desc: "Read all 66 books in KJV and WEB. Search, bookmark, and follow reading plans." },
  { icon: Sparkles, title: "Bible Comics", desc: "Experience Bible stories through original visual storytelling." },
  { icon: Users, title: "Churches", desc: "Discover Christian churches by state, city, and language across India." },
  { icon: Trophy, title: "Bible Trivia", desc: "Test your Bible knowledge, earn Faith Points, and win real prizes in competitions." },
  { icon: Heart, title: "Prayer Wall", desc: "Share prayer requests and pray for others in the community." },
  { icon: Store, title: "Marketplace & Business Directory", desc: "Discover Christian products and businesses across India." },
];

export default function AboutPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F39B9B]/10 border border-[#F39B9B]/20 text-[#F39B9B] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles size={12} fill="currentColor" /> About Koino
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
          An all-in-one Christian{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F39B9B] to-[#9786E3]">
            community platform
          </span>
        </h1>
        <p className="text-base text-[#A09DB1] leading-relaxed max-w-2xl mx-auto mb-8">
          Koino is inspired by the Greek word &quot;koinonia&quot; — fellowship, communion, partnership
          and shared participation among believers. We bring Scripture, fellowship, churches, events,
          prayer, Bible learning, Christian businesses and community experiences together in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/" className="px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all hover:-translate-y-px">
            Enter Koino
          </a>
          <a href="/about/founder" className="px-8 py-3.5 border border-white/[0.08] hover:border-white/[0.15] text-[#A09DB1] hover:text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all bg-white/[0.02]">
            Meet the Founder
          </a>
        </div>
      </section>

      {/* Three pillars */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((p) => (
            <div key={p.title} className="bg-[#1C1929] border border-white/[0.06] rounded-3xl p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#F39B9B]/20 to-[#7C3AED]/20 border border-white/[0.08] flex items-center justify-center">
                <p.icon size={24} className="text-[#F39B9B]" />
              </div>
              <h3 className="text-lg font-black text-white mb-2">{p.title}</h3>
              <p className="text-xs text-[#A09DB1] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-white text-center mb-8">Everything for Your Faith Journey</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/25 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-[#A78BFA]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
              <p className="text-[11px] text-[#A09DB1] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-6 text-center max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-3xl p-8">
          <h2 className="text-2xl font-extrabold text-white mb-2">Join the Koino community</h2>
          <p className="text-sm text-[#A09DB1] mb-5">It&apos;s free. Grow in faith, connect with believers, and belong.</p>
          <a href="/" className="inline-block px-8 py-3.5 bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold rounded-2xl text-sm uppercase tracking-wider transition-all hover:-translate-y-px">
            Enter Koino
          </a>
        </div>
      </section>
    </PublicPageLayout>
  );
}
