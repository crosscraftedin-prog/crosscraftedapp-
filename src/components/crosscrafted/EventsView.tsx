"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Clock,
  Filter,
  Globe,
  Search,
  Heart,
  Share2,
  Video,
  Radio,
  Bookmark,
  BookmarkCheck,
  Ticket,
  X,
  Music,
  BookOpen,
  Flame,
  TrendingUp,
  HandHelping,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  EVENTS,
  EVENT_CATEGORIES,
  CHURCH_GRADIENTS,
  INDIAN_STATES,
  LANGUAGES,
  type EventItem,
} from "@/lib/crosscrafted-data";

const CATEGORY_ICONS: Record<string, typeof Music> = {
  worship: Music,
  "bible-study": BookOpen,
  conference: Sparkles,
  retreat: Flame,
  youth: TrendingUp,
  outreach: HandHelping,
  fellowship: Users,
  concert: Music,
  prayer: Heart,
  seminar: BookOpen,
  livestream: Radio,
  workshop: Filter,
};

const getCategoryMeta = (cat: string) => EVENT_CATEGORIES.find((c) => c.value === cat) || EVENT_CATEGORIES[0];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    weekday: d.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
    time: d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
};

const formatRelative = (iso: string) => {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return "Ended";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
};

export default function EventsView() {
  const [events] = useState<EventItem[]>(EVENTS);
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openEvent, setOpenEvent] = useState<EventItem | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterState && e.state !== filterState) return false;
      if (filterLanguage && !e.languages.includes(filterLanguage)) return false;
      if (filterCategory && e.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!e.title.toLowerCase().includes(q) && !e.city.toLowerCase().includes(q)) return false;
      }
      const now = new Date();
      const ed = new Date(e.date);
      if (dateFilter === "today" && ed.toDateString() !== now.toDateString()) return false;
      if (dateFilter === "week") {
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        if (ed < now || ed > weekEnd) return false;
      }
      if (dateFilter === "month") {
        const monthEnd = new Date(now);
        monthEnd.setMonth(now.getMonth() + 1);
        if (ed < now || ed > monthEnd) return false;
      }
      return true;
    });
  }, [events, filterState, filterLanguage, filterCategory, searchQuery, dateFilter]);

  const activeFilters = [filterState, filterLanguage, filterCategory, searchQuery].filter(Boolean).length;

  const toggleSave = (id: string) => {
    setSavedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Removed from saved", { description: "Event no longer in your list" });
      } else {
        next.add(id);
        toast.success("Saved!", { description: "Event added to your wishlist" });
      }
      return next;
    });
  };

  const shareEvent = (e: EventItem) => {
    const text = `Check out "${e.title}" on CrossCrafted — ${formatDate(e.date).weekday} ${e.date} at ${e.location}, ${e.city}!`;
    navigator.clipboard.writeText(text);
    toast.success("Event link copied!");
  };

  const rsvp = (e: EventItem) => {
    toast.success(`RSVP'd for "${e.title}"!`, {
      description: `See you on ${formatDate(e.date).weekday}. Add it to your calendar.`,
    });
    setOpenEvent(null);
  };

  return (
    <div className="max-w-[680px] mx-auto px-4 py-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Events</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Worship, conferences & more</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              activeFilters > 0
                ? "bg-[#EC4899]/15 border-[#EC4899]/30 text-[#EC4899]"
                : "bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white"
            }`}
          >
            <Filter size={14} />
            {activeFilters > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#EC4899] text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg, #EC4899, #F59E0B)" }}
          >
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* Date Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-3">
        {([
          { v: "all", l: "All Events" },
          { v: "today", l: "Today" },
          { v: "week", l: "This Week" },
          { v: "month", l: "This Month" },
        ] as const).map((d) => (
          <button
            key={d.v}
            onClick={() => setDateFilter(d.v)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              dateFilter === d.v
                ? "bg-[#EC4899] text-white"
                : "bg-white/[0.04] text-[#94A3B8] hover:text-white border border-white/[0.06]"
            }`}
          >
            {d.l}
          </button>
        ))}
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
                  placeholder="Title, city..."
                  className="neo-input text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  <MapPin size={10} className="inline mr-0.5" /> State
                </label>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="neo-input text-sm">
                  <option value="">All States</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                  <Globe size={10} className="inline mr-0.5" /> Language
                </label>
                <select value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} className="neo-input text-sm">
                  <option value="">All Languages</option>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Category</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilterCategory("")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    !filterCategory ? "bg-white text-slate-950" : "bg-white/[0.04] text-[#94A3B8]"
                  }`}
                >
                  All
                </button>
                {EVENT_CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setFilterCategory(c.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      filterCategory === c.value ? "text-slate-950" : "text-[#94A3B8] hover:text-white"
                    }`}
                    style={filterCategory === c.value ? { background: c.color } : {}}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setFilterState("");
                  setFilterLanguage("");
                  setFilterCategory("");
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

      {/* Events */}
      <div className="space-y-3">
        {filtered.map((event, i) => {
          const cat = getCategoryMeta(event.category);
          const Icon = CATEGORY_ICONS[event.category] || Music;
          const date = formatDate(event.date);
          const isSaved = savedEvents.has(event.id);
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setOpenEvent(event)}
              className="rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06] hover:border-white/[0.12] transition-all bg-[#1C1929]"
            >
              <div className="flex">
                {/* Date block */}
                <div
                  className="w-20 shrink-0 flex flex-col items-center justify-center p-3"
                  style={{ background: `${cat.color}25` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cat.color }}>
                    {date.month}
                  </p>
                  <p className="text-2xl font-extrabold text-white leading-none my-0.5">{date.day}</p>
                  <p className="text-[10px] text-white/60">{date.weekday}</p>
                </div>

                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <Icon size={9} className="inline mr-0.5" />
                      {cat.label}
                    </span>
                    {event.is_online && (
                      <span className="px-2 py-0.5 rounded-full bg-[#EF4444]/15 text-[#EF4444] text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                        <Video size={9} /> Live
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{event.title}</h3>
                  <p className="text-[11px] text-[#94A3B8] line-clamp-1 mb-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-[#94A3B8]">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {event.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {date.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {event.attendees}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between p-3 border-l border-white/[0.04]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSave(event.id);
                    }}
                    className="text-[#94A3B8] hover:text-white p-1"
                  >
                    {isSaved ? <BookmarkCheck size={16} className="text-[#EC4899]" /> : <Bookmark size={16} />}
                  </button>
                  <span className="text-[10px] font-bold text-[#94A3B8]">{formatRelative(event.date)}</span>
                </div>
              </div>

              <div className="px-3 py-2.5 bg-white/[0.02] border-t border-white/[0.04] flex items-center justify-between">
                <div className="text-[10px] text-[#94A3B8]">
                  by <span className="text-white font-bold">{event.church}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {event.is_free ? (
                    <span className="px-2 py-0.5 rounded-md bg-[#22C55E]/15 text-[#22C55E] text-[10px] font-bold">
                      FREE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-[#F59E0B]/15 text-[#F59E0B] text-[10px] font-bold flex items-center gap-1">
                      <Ticket size={9} /> ₹{event.price}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Calendar size={40} className="mx-auto text-[#475569] mb-3" />
          <p className="text-sm text-[#475569] mb-3">No events found for these filters.</p>
          <button
            onClick={() => {
              setFilterState("");
              setFilterLanguage("");
              setFilterCategory("");
              setSearchQuery("");
              setDateFilter("all");
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #EC4899, #F59E0B)" }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
        {openEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-[60] p-0 md:p-6"
            onClick={(e) => e.target === e.currentTarget && setOpenEvent(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="bg-[#1C1929] border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div
                className="relative h-44"
                style={{ background: CHURCH_GRADIENTS[openEvent.cover_gradient % CHURCH_GRADIENTS.length] }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1929] via-transparent to-transparent" />
                <button
                  onClick={() => setOpenEvent(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X size={18} />
                </button>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-2">
                    {openEvent.is_online && (
                      <span className="px-2 py-0.5 rounded-full bg-[#EF4444]/80 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Video size={10} /> Live Stream
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${getCategoryMeta(openEvent.category).color}80`,
                        color: "white",
                      }}
                    >
                      {getCategoryMeta(openEvent.category).label}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{openEvent.title}</h2>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">When</p>
                    <p className="text-xs text-white">
                      {new Date(openEvent.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">{formatDate(openEvent.date).time}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Where</p>
                    <p className="text-xs text-white">{openEvent.city}</p>
                    <p className="text-[10px] text-[#94A3B8]">{openEvent.location}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Attendees</p>
                    <p className="text-xs text-white flex items-center gap-1">
                      <Users size={11} /> {openEvent.attendees} going
                    </p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Cost</p>
                    <p className="text-xs font-bold text-white">
                      {openEvent.is_free ? "FREE" : `₹${openEvent.price}`}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">About</p>
                  <p className="text-sm text-[#A09DB1] leading-relaxed">{openEvent.description}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Hosted by</p>
                  <p className="text-sm font-bold text-white">{openEvent.church}</p>
                </div>

                {openEvent.languages.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {openEvent.languages.map((lang) => (
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

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => toggleSave(openEvent.id)}
                    className="px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white flex items-center justify-center"
                  >
                    {savedEvents.has(openEvent.id) ? (
                      <BookmarkCheck size={18} className="text-[#EC4899]" />
                    ) : (
                      <Bookmark size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => shareEvent(openEvent)}
                    className="px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white flex items-center justify-center"
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={() => rsvp(openEvent)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px"
                    style={{ background: "linear-gradient(135deg, #EC4899, #F59E0B)" }}
                  >
                    {openEvent.is_free ? "RSVP Now" : "Get Tickets"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal (simplified) */}
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
              className="bg-[#1C1929] border-t md:border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-lg p-5"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#EC4899] to-[#F59E0B] bg-clip-text text-transparent">
                  Add an Event
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-[#64748B] hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setShowCreateModal(false);
                  toast.success("Event submitted!", { description: "Your event will appear once approved." });
                }}
                className="space-y-3"
              >
                <input type="text" placeholder="Event title" className="neo-input text-sm" required />
                <textarea placeholder="Event description" className="neo-input h-24 resize-none text-sm" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" className="neo-input text-sm" required />
                  <input type="time" className="neo-input text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="City" className="neo-input text-sm" required />
                  <input type="text" placeholder="State" className="neo-input text-sm" required />
                </div>
                <input type="text" placeholder="Location address" className="neo-input text-sm" required />
                <select className="neo-input text-sm" required defaultValue="">
                  <option value="">Select category</option>
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #EC4899, #F59E0B)" }}
                >
                  Submit Event
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
