"use client";

import { useState } from "react";
import PublicPageLayout from "@/components/crosscrafted/PublicPageLayout";
import { Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

const PARTNER_TYPES = [
  "Church", "Ministry", "Christian Business", "Event Partner",
  "Content Partner", "Sponsor", "Technology Partner", "Other",
];

export default function PartnerPage() {
  const [form, setForm] = useState({ name: "", organization: "", email: "", phone: "", website: "", partnershipType: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.partnershipType || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/partner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicPageLayout>
      <div className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-2xl font-black text-white mb-2 text-center">Partner With Koino</h1>
        <p className="text-sm text-[#A09DB1] mb-6 text-center">Let&apos;s build a stronger Christian community together.</p>

        <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <p className="text-[11px] text-[#A09DB1] leading-relaxed">
            Koino welcomes partnerships with churches, Christian organizations, ministries, Christian businesses,
            event organizers, Christian creators, sponsors, technology partners, and community organizations.
          </p>
        </div>

        {sent ? (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-2xl p-6 text-center">
            <Check size={32} className="mx-auto text-[#22C55E] mb-3" />
            <p className="text-sm font-bold text-white mb-1">Thank you!</p>
            <p className="text-xs text-[#94A3B8]">Your partnership inquiry has been received. We&apos;ll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="neo-input text-sm" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Organization</label>
              <input type="text" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="neo-input text-sm" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="neo-input text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="neo-input text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="neo-input text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Partnership Type *</label>
              <select value={form.partnershipType} onChange={(e) => setForm({ ...form, partnershipType: e.target.value })} className="neo-input text-sm" required>
                <option value="">Select type</option>
                {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Message *</label>
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="neo-input text-sm h-28 resize-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#F39B9B] hover:bg-[#E27B7B] text-slate-950 font-extrabold text-sm uppercase tracking-wider transition-all hover:-translate-y-px disabled:opacity-30 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Submit Inquiry</>}
            </button>
          </form>
        )}
      </div>
    </PublicPageLayout>
  );
}
