"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Users,
  Plus,
  UserPlus,
  UserMinus,
  Clock,
  X,
  Filter,
  Globe,
  ShieldCheck,
  Search,
} from "lucide-react";
import {
  CHURCHES,
  INDIAN_STATES,
  LANGUAGES,
  CHURCH_GRADIENTS,
  type Church,
} from "@/lib/crosscrafted-data";
import { toast } from "sonner";

type Props = {
  initialOpenChurchId?: string | null;
};

export default function ChurchesView({ initialOpenChurchId }: Props) {
  const [churches, setChurches] = useState<Church[]>(CHURCHES);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openChurch, setOpenChurch] = useState<Church | null>(
    CHURCHES.find((c) => c.id === initialOpenChurchId) || null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    service_times: "",
    state: "",
    city: "",
    languages: [] as string[],
    denomination: "",
  });

  const filtered = useMemo(() => {
    return churches.filter((c) => {
      if (filterState && c.state !== filterState) return false;
      if (filterLanguage && !c.languages.includes(filterLanguage)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.city.toLowerCase().includes(q) &&
          !c.state.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [churches, filterState, filterLanguage, searchQuery]);

  const activeFilters = [filterState, filterLanguage, searchQuery].filter(Boolean).length;

  const toggleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setChurches((cs) =>
          cs.map((c) => (c.id === id ? { ...c, followers_count: c.followers_count - 1 } : c))
        );
        toast("Unfollowed church", { description: "You'll no longer see updates." });
      } else {
        next.add(id);
        setChurches((cs) =>
          cs.map((c) => (c.id === id ? { ...c, followers_count: c.followers_count + 1 } : c))
        );
        toast.success("Following church!", { description: "You'll see updates in your feed." });
      }
      return next;
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) {
      toast.error("Please fill in the required fields");
      return;
    }
    const newChurch: Church = {
      id: `c${Date.now()}`,
      ...formData,
      followers_count: 0,
      cover_gradient: Math.floor(Math.random() * CHURCH_GRADIENTS.length),
      status: "pending",
    };
    setChurches([newChurch, ...churches]);
    setFormData({
      name: "",
      description: "",
      location: "",
      service_times: "",
      state: "",
      city: "",
      languages: [],
      denomination: "",
    });
    setShowCreateModal(false);
    toast.success("Church submitted!", {
      description: "Your church will appear once approved by our team.",
    });
  };

  return (
    <div className="max-w-[680px] mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Discover</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Find churches across India</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              activeFilters > 0
                ? "bg-[#A855F7]/15 border-[#A855F7]/30 text-[#A855F7]"
                : "bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white"
            }`}
          >
            <Filter size={14} />
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#A855F7] text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg, #A855F7, #EC4899)" }}
          >
            <Plus size={14} /> Add Church
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  <Search size={10} className="inline mr-0.5" /> Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="City, state, name..."
                  className="neo-input text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  <MapPin size={10} className="inline mr-0.5" /> State
                </label>
                <select
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="neo-input text-sm"
                >
                  <option value="">All States</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  <Globe size={10} className="inline mr-0.5" /> Language
                </label>
                <select
                  value={filterLanguage}
                  onChange={(e) => setFilterLanguage(e.target.value)}
                  className="neo-input text-sm"
                >
                  <option value="">All Languages</option>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setFilterState("");
                  setFilterLanguage("");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs text-[#94A3B8] hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Church Cards */}
      <div className="space-y-4">
        {filtered.map((church, i) => {
          const isFollowing = followed.has(church.id);
          return (
            <motion.div
              key={church.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setOpenChurch(church)}
              className="rounded-2xl overflow-hidden cursor-pointer group border border-white/[0.06] hover:border-white/[0.12] transition-all bg-[#1C1929]"
            >
              <div className="relative h-[200px]">
                <div
                  className="w-full h-full"
                  style={{ background: CHURCH_GRADIENTS[church.cover_gradient % CHURCH_GRADIENTS.length] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/30 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.1]">
                  <Users size={11} className="text-white/80" />
                  <span className="text-[10px] font-semibold text-white/80">
                    {church.followers_count.toLocaleString()}
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-white leading-tight">{church.name}</h3>
                    {church.status === "verified" && (
                      <ShieldCheck
                        size={16}
                        strokeWidth={2.5}
                        className="shrink-0 drop-shadow-lg"
                        style={{ color: "white", fill: "#3B82F6" }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-white/60" />
                      <span className="text-[12px] text-white/60">
                        {church.city ? `${church.city}, ` : ""}
                        {church.state}
                      </span>
                    </div>
                    {church.languages.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Globe size={11} className="text-white/50" />
                        <span className="text-[11px] text-white/50">
                          {church.languages.slice(0, 2).join(", ")}
                          {church.languages.length > 2 ? ` +${church.languages.length - 2}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4">
                {church.service_times && (
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Clock size={12} className="text-[#A855F7]" />
                    <span className="text-[11px] text-[#94A3B8]">{church.service_times}</span>
                  </div>
                )}
                <p className="text-[13px] text-[#94A3B8] leading-[1.5] line-clamp-2 mb-3">
                  {church.description}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow(church.id);
                  }}
                  className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all ${
                    isFollowing
                      ? "bg-white/[0.06] text-[#94A3B8] border border-white/[0.06]"
                      : "text-white hover:-translate-y-px"
                  }`}
                  style={
                    !isFollowing
                      ? {
                          background: "linear-gradient(135deg, #3B82F6, #A855F7)",
                          boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
                        }
                      : {}
                  }
                >
                  {isFollowing ? (
                    <>
                      <UserMinus size={13} /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} /> Follow
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#475569] text-sm mb-4">
            No churches found{activeFilters > 0 ? " for these filters" : ""}.
          </p>
          {activeFilters > 0 ? (
            <button
              onClick={() => {
                setFilterState("");
                setFilterLanguage("");
                setSearchQuery("");
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #A855F7, #EC4899)" }}
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #A855F7, #EC4899)" }}
            >
              Add Church
            </button>
          )}
        </div>
      )}

      {/* Church Detail Modal */}
      <AnimatePresence>
        {openChurch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-[60] p-0 md:p-6"
            onClick={(e) => e.target === e.currentTarget && setOpenChurch(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bg-[#1C1929] border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="relative h-48 md:h-56">
                <div
                  className="w-full h-full"
                  style={{ background: CHURCH_GRADIENTS[openChurch.cover_gradient % CHURCH_GRADIENTS.length] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1929] via-transparent to-transparent" />
                <button
                  onClick={() => setOpenChurch(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X size={18} />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-extrabold text-white">{openChurch.name}</h2>
                    {openChurch.status === "verified" && (
                      <ShieldCheck
                        size={20}
                        strokeWidth={2.5}
                        style={{ color: "white", fill: "#3B82F6" }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-white/70">{openChurch.denomination}</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Location</p>
                    <p className="text-xs text-white flex items-center gap-1">
                      <MapPin size={11} /> {openChurch.city}, {openChurch.state}
                    </p>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">{openChurch.location}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Followers</p>
                    <p className="text-xs text-white flex items-center gap-1">
                      <Users size={11} /> {openChurch.followers_count.toLocaleString()}
                    </p>
                  </div>
                </div>

                {openChurch.service_times && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-2">
                    <Clock size={14} className="text-[#A855F7]" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Service Times</p>
                      <p className="text-xs text-white">{openChurch.service_times}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">About</p>
                  <p className="text-sm text-[#A09DB1] leading-relaxed">{openChurch.description}</p>
                </div>

                {openChurch.languages.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {openChurch.languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/25 text-[#38BDF8] text-[11px] font-semibold"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => toggleFollow(openChurch.id)}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                    followed.has(openChurch.id)
                      ? "bg-white/[0.06] text-[#94A3B8] border border-white/[0.06]"
                      : "text-white hover:-translate-y-px"
                  }`}
                  style={
                    !followed.has(openChurch.id)
                      ? {
                          background: "linear-gradient(135deg, #3B82F6, #A855F7)",
                          boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
                        }
                      : {}
                  }
                >
                  {followed.has(openChurch.id) ? (
                    <span className="flex items-center justify-center gap-2">
                      <UserMinus size={14} /> Following
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <UserPlus size={14} /> Follow Church
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Church Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-[60]"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bg-[#1C1929] border-t md:border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg p-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold gradient-text bg-gradient-to-r from-[#F39B9B] to-[#9786E3] bg-clip-text text-transparent">
                  Add a Church
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-[#64748B] hover:text-white p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Church Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="neo-input text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      State
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="neo-input text-sm"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="neo-input text-sm"
                      placeholder="City"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Location Address
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="neo-input text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Service Times
                    </label>
                    <input
                      type="text"
                      value={formData.service_times}
                      onChange={(e) => setFormData({ ...formData, service_times: e.target.value })}
                      className="neo-input text-sm"
                      placeholder="Sun 9AM & 11AM"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                      Denomination
                    </label>
                    <input
                      type="text"
                      value={formData.denomination}
                      onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                      className="neo-input text-sm"
                      placeholder="Non-denominational"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Languages (multi-select)
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-white/[0.04] border border-white/[0.06] rounded-xl">
                    {LANGUAGES.map((lang) => {
                      const selected = formData.languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              languages: selected
                                ? prev.languages.filter((l) => l !== lang)
                                : [...prev.languages, lang],
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            selected
                              ? "bg-[#A855F7] text-white"
                              : "bg-white/[0.04] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="neo-input h-20 resize-none text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-[#F39B9B] hover:bg-[#E27B7B] transition-all hover:-translate-y-px"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
