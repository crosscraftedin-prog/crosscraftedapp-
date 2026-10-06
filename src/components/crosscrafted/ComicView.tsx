"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Play,
  Brain,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSupabaseUser } from "@/lib/supabase/use-user";

// ─── Types ────────────────────────────────────────────────────────────────

type ComicPanel = {
  panelId: string;
  sortOrder: number;
  artworkUrl: string;
  verseStart: number;
  verseEnd: number;
  bookId: string;
  chapter: number;
  title: string | null;
  narration: string | null;
  captions: string[];
  isFallback: boolean;
  hasTranslation: boolean;
};

type ComicChapter = {
  id: string;
  comicId: string;
  bookId: string;
  chapter: number;
  title: string;
  coverArtUrl: string | null;
  sortOrder: number;
  panels: ComicPanel[];
  titleIsFallback: boolean;
};

type ReadMode = "story" | "verse";

// Prayer prompts for Genesis 2 panels
const PRAYER_PROMPTS: Record<string, string> = {
  "GEN2-P01": "Lord, thank You for the gift of rest. Help me honor the Sabbath and find peace in Your completed work.",
  "GEN2-P02": "Father, thank You for creating me with purpose. You breathed life into dust — remind me that I am fearfully and wonderfully made.",
  "GEN2-P03": "Lord, thank You for providing a place for me to dwell. Like Eden, may my life be a garden where Your presence flows.",
  "GEN2-P04": "God, give me wisdom to obey Your commands. Help me choose life and resist the things that separate me from You.",
  "GEN2-P05": "Father, thank You for the gift of companionship. Help me be a good steward of the relationships and responsibilities You've given me.",
  "GEN2-P06": "Lord, thank You for the gift of family. May my relationships reflect Your love and the covenant You designed from the beginning.",
  "GEN2-P07": "God, thank You for the beauty of marriage and intimacy. Help me honor the relationships You've blessed me with, walking in transparency and love.",
};

// ─── Component ─────────────────────────────────────────────────────────────

type Props = {
  bookId: string;
  chapter: number;
  onReadChapter: (bookId: string, chapter: number) => void;
  onPray: (prayerPrompt: string) => void;
  onDiscuss: (topic: string) => void;
};

export default function ComicView({ bookId, chapter, onReadChapter, onPray, onDiscuss }: Props) {
  const { lang } = useLanguage();
  const { isAuthenticated } = useSupabaseUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterData, setChapterData] = useState<ComicChapter | null>(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [readMode, setReadMode] = useState<ReadMode>("story");
  const [verseData, setVerseData] = useState<{ verse: number; text: string }[] | null>(null);
  const [verseLoading, setVerseLoading] = useState(false);

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);

  // Load comic chapter
  const loadComic = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comic/${bookId}/${chapter}?lang=${lang}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChapterData(data.chapter);
    } catch (e: any) {
      setError(e.message || "Failed to load comic");
    } finally {
      setLoading(false);
    }
  }, [bookId, chapter, lang]);

  useEffect(() => {
    loadComic();
  }, [loadComic]);

  // Load verse text for current panel (Verse Mode)
  const loadVerses = useCallback(async (panel: ComicPanel) => {
    setVerseLoading(true);
    setVerseData(null);
    try {
      // Use the existing bible-data.ts fetchChapter function
      const { fetchChapter } = await import("@/lib/bible-data");
      const data = await fetchChapter(panel.bookId, panel.chapter, "kjv");
      const verses = data.verses
        .filter((v) => v.verse >= panel.verseStart && v.verse <= panel.verseEnd)
        .map((v) => ({ verse: v.verse, text: v.text.trim() }));
      setVerseData(verses);
    } catch (e: any) {
      toast.error("Failed to load verses", { description: e.message });
    } finally {
      setVerseLoading(false);
    }
  }, []);

  // Switch to Verse Mode
  useEffect(() => {
    if (readMode === "verse" && chapterData && chapterData.panels[currentPanel]) {
      loadVerses(chapterData.panels[currentPanel]);
    }
  }, [readMode, currentPanel, chapterData, loadVerses]);

  // Navigate panels
  const goPrev = () => {
    if (currentPanel > 0) {
      setCurrentPanel(currentPanel - 1);
      if (readMode === "verse") setVerseData(null);
    }
  };
  const goNext = () => {
    if (chapterData && currentPanel < chapterData.panels.length - 1) {
      setCurrentPanel(currentPanel + 1);
      if (readMode === "verse") setVerseData(null);
    }
  };

  // ─── Quiz ────────────────────────────────────────────────────────────────

  const startQuiz = async () => {
    if (!chapterData) return;
    if (!isAuthenticated) {
      toast.error("Sign in required to take quizzes");
      return;
    }
    setShowQuiz(true);
    setQuizLoading(true);
    try {
      const res = await fetch(
        `/api/comic/quiz/${chapterData.id}?lang=${lang}&mode=EARN_POINTS`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuizQuestions(data.questions || []);
    } catch (e: any) {
      toast.error("Failed to load quiz", { description: e.message });
    } finally {
      setQuizLoading(false);
    }
  };

  // ─── Listen (TTS fallback) ────────────────────────────────────────────────

  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleListen = () => {
    if (!chapterData) return;
    const panel = chapterData.panels[currentPanel];
    if (!panel?.narration) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Browser speech synthesis — clearly labeled as a TTS fallback,
    // NOT a real Bible audio production.
    const utterance = new SpeechSynthesisUtterance(panel.narration);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    toast("Text-to-speech", {
      description: "Using browser voice synthesis. Professional audio coming soon.",
    });
  };

  // ─── Share ────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!chapterData) return;
    const panel = chapterData.panels[currentPanel];
    const ref = `${chapterData.bookId.charAt(0).toUpperCase() + chapterData.bookId.slice(1)} ${chapterData.chapter}:${panel.verseStart}-${panel.verseEnd}`;
    const shareText = `${panel.title} — ${ref}\n\n${panel.narration?.substring(0, 200)}...\n\nRead more at Believ`;
    const shareUrl = `${window.location.origin}/?comic=${chapterData.bookId}/${chapterData.chapter}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Believ Comic Bible — ${ref}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled — ignore
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success("Link copied!", { description: ref });
    }
  };

  const handleDownload = () => {
    if (!chapterData) return;
    const panel = chapterData.panels[currentPanel];
    // Download the artwork image
    const link = document.createElement("a");
    link.href = panel.artworkUrl;
    link.download = `believ-${panel.panelId}.svg`;
    link.click();
    toast.success("Downloaded!", { description: `${panel.panelId} artwork saved` });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-[#F39B9B] animate-spin" />
      </div>
    );
  }

  if (error || !chapterData) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={32} className="mx-auto text-[#EF4444] mb-3" />
        <p className="text-sm text-[#94A3B8]">{error || "Comic not found"}</p>
        <button onClick={loadComic} className="mt-4 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  const panel = chapterData.panels[currentPanel];
  const totalPanels = chapterData.panels.length;
  const progress = ((currentPanel + 1) / totalPanels) * 100;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-5">
      {/* Breadcrumb header */}
      <div className="flex items-center gap-2 text-xs text-[#64748B] mb-4">
        <span>Bible</span>
        <ChevronRight size={10} />
        <span>Old Testament</span>
        <ChevronRight size={10} />
        <span className="capitalize">{chapterData.bookId}</span>
        <ChevronRight size={10} />
        <span>Chapter {chapterData.chapter}</span>
        <ChevronRight size={10} />
        <span className="text-[#F39B9B] font-bold">Comic</span>
      </div>

      {/* Chapter title */}
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-white">{chapterData.title}</h1>
        {chapterData.titleIsFallback && (
          <p className="text-[10px] text-[#F59E0B] mt-0.5">English (translation pending)</p>
        )}
      </div>

      {/* Read / Comic toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onReadChapter(bookId, chapter)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-[#94A3B8] hover:text-white transition-all"
        >
          <BookOpen size={14} /> READ
        </button>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F39B9B]/15 border border-[#F39B9B]/30 text-xs font-bold text-[#F39B9B]"
        >
          <BookOpen size={14} /> COMIC
        </button>
      </div>

      {/* Story / Verse mode toggle */}
      <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-xl mb-4">
        <button
          onClick={() => setReadMode("story")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            readMode === "story" ? "bg-[#7C3AED] text-white" : "text-[#94A3B8] hover:text-white"
          }`}
        >
          Story Mode
        </button>
        <button
          onClick={() => setReadMode("verse")}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            readMode === "verse" ? "bg-[#7C3AED] text-white" : "text-[#94A3B8] hover:text-white"
          }`}
        >
          Verse Mode
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#64748B] font-bold">
            Panel {currentPanel + 1} of {totalPanels}
          </span>
          <span className="text-[10px] text-[#64748B]">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#F39B9B] to-[#9786E3]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Comic panel */}
      <motion.div
        key={panel.panelId}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1C1929] border border-white/[0.06] rounded-2xl overflow-hidden mb-4"
      >
        {/* Artwork */}
        <div className="relative w-full aspect-[16/9] bg-[#0f0f1a]">
          <img
            src={panel.artworkUrl}
            alt={panel.title || `Panel ${currentPanel + 1}`}
            className="w-full h-full object-cover"
          />
          {/* Verse reference badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
            {bookId.charAt(0).toUpperCase() + bookId.slice(1)} {chapter}:{panel.verseStart}-{panel.verseEnd}
          </div>
          {/* Translation fallback badge */}
          {panel.isFallback && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-[#F59E0B]/90 text-slate-950 text-[9px] font-bold uppercase">
              EN text
            </div>
          )}
        </div>

        {/* Panel content */}
        <div className="p-4">
          {/* Title */}
          {panel.title && (
            <h3 className="text-sm font-bold text-white mb-2">{panel.title}</h3>
          )}

          {/* Story mode: narration */}
          {readMode === "story" && panel.narration && (
            <p className="text-[13px] text-[#A09DB1] leading-relaxed">{panel.narration}</p>
          )}

          {/* Verse mode: individual verses */}
          {readMode === "verse" && (
            <div className="space-y-2">
              {verseLoading ? (
                <div className="flex items-center gap-2 text-[#64748B] text-xs">
                  <Loader2 size={14} className="animate-spin" /> Loading verses...
                </div>
              ) : verseData ? (
                verseData.map((v) => (
                  <div key={v.verse} className="flex gap-2">
                    <span className="text-[#F39B9B] font-bold text-[11px] shrink-0 w-6 text-right">{v.verse}</span>
                    <p className="text-[13px] text-[#A09DB1] leading-relaxed flex-1">{v.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B]">No verse data available.</p>
              )}
              {!verseLoading && verseData && (
                <p className="text-[10px] text-[#475569] mt-2">
                  Scripture from KJV (English). Indian-language Bible translations coming soon.
                </p>
              )}
            </div>
          )}

          {/* Captions (if any) */}
          {panel.captions.length > 0 && (
            <div className="mt-3 space-y-1">
              {panel.captions.map((cap, idx) => (
                <p key={idx} className="text-[11px] text-[#94A3B8] italic">{cap}</p>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
        <ActionButton icon={BookOpen} label="Read" onClick={() => onReadChapter(bookId, chapter)} />
        <ActionButton icon={isSpeaking ? X : Headphones} label={isSpeaking ? "Stop" : "Listen"} onClick={handleListen} />
        <ActionButton icon={Video} label="Watch" onClick={() => toast("Coming Soon", { description: "Video content is being prepared." })} dimmed />
        <ActionButton icon={Brain} label="Quiz" onClick={startQuiz} />
        <ActionButton icon={Heart} label="Pray" onClick={() => onPray(PRAYER_PROMPTS[panel.panelId] || "Lord, thank You for Your Word.")} />
        <ActionButton icon={MessageCircle} label="Discuss" onClick={() => onDiscuss(`What stands out to you most about ${panel.title}?`)} />
        <ActionButton icon={Share2} label="Share" onClick={handleShare} />
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-[#94A3B8] hover:text-white transition-all flex items-center justify-center gap-2 mb-4"
      >
        <Download size={14} /> Download Panel Image
      </button>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentPanel === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        {/* Panel dots */}
        <div className="flex gap-1.5">
          {chapterData.panels.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPanel(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPanel ? "bg-[#F39B9B] w-6" : "bg-white/20"
              }`}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          disabled={currentPanel === totalPanels - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <ComicQuizModal
            chapterId={chapterData.id}
            questions={quizQuestions}
            loading={quizLoading}
            lang={lang}
            onClose={() => {
              setShowQuiz(false);
              setQuizQuestions([]);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Action Button ──────────────────────────────────────────────────────────

function ActionButton({
  icon: Icon,
  label,
  onClick,
  dimmed = false,
}: {
  icon: typeof BookOpen;
  label: string;
  onClick: () => void;
  dimmed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
        dimmed
          ? "bg-white/[0.02] border-white/[0.04] text-[#475569]"
          : "bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white hover:bg-white/[0.06]"
      }`}
    >
      <Icon size={16} />
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

// ─── Comic Quiz Modal ─────────────────────────────────────────────────────────

function ComicQuizModal({
  chapterId,
  questions,
  loading,
  lang,
  onClose,
}: {
  chapterId: string;
  questions: any[];
  loading: boolean;
  lang: string;
  onClose: () => void;
}) {
  const { isAuthenticated } = useSupabaseUser();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnswer = (questionId: string, selectedAnswer: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedAnswer }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));
      const res = await fetch(`/api/comic/quiz/${chapterId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "EARN_POINTS", answers: answerArray }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
    } catch (e: any) {
      toast.error("Failed to submit quiz", { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <Loader2 size={32} className="text-[#F39B9B] animate-spin" />
      </motion.div>
    );
  }

  if (questions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-[#1C1929] border border-white/[0.08] rounded-2xl p-6 max-w-sm text-center">
          <Brain size={28} className="mx-auto text-[#475569] mb-2" />
          <p className="text-sm text-[#94A3B8]">No quiz questions available for this chapter yet.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 rounded-xl bg-white/[0.04] text-xs font-bold text-[#94A3B8]">
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  // Results screen
  if (results) {
    const correctCount = results.correctCount || 0;
    const totalQ = results.totalQuestions || questions.length;
    const pointsEarned = results.totalPointsEarned || 0;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-[#1C1929] border border-[#F59E0B]/20 rounded-2xl p-6 max-w-md w-full"
        >
          <h2 className="text-xl font-extrabold text-white mb-2">Quiz Complete!</h2>
          <p className="text-sm text-[#A09DB1] mb-4">
            Correct: {correctCount}/{totalQ}
            {pointsEarned > 0 && <span className="text-[#F59E0B] font-bold"> · {pointsEarned} FP earned!</span>}
          </p>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {results.questionResults?.map((qr: any, i: number) => (
              <div
                key={i}
                className={`p-2 rounded-lg border text-xs ${
                  qr.correct
                    ? "bg-[#22C55E]/10 border-[#22C55E]/20"
                    : "bg-[#EF4444]/10 border-[#EF4444]/20"
                }`}
              >
                <p className="font-bold text-white">{qr.questionId}</p>
                <p className="text-[#94A3B8]">{qr.correct ? "✓ Correct" : "✗ Incorrect"}</p>
                {qr.alreadyScored && <p className="text-[#64748B] text-[10px]">Already scored — 0 FP</p>}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl bg-[#F59E0B] text-slate-950 text-sm font-bold">
            Done
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // Quiz question screen
  const q = questions[currentQ];
  const isAnswered = answers[q.id] !== undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-[70] p-0 md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-[#1C1929] border border-white/[0.08] rounded-t-[28px] md:rounded-[24px] w-full max-w-md max-h-[85vh] overflow-y-auto p-5"
      >
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
            Comic Quiz · {currentQ + 1}/{questions.length}
          </p>
          <button onClick={onClose}>
            <X size={18} className="text-[#64748B]" />
          </button>
        </div>

        <p className="text-sm font-bold text-white mb-3">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleAnswer(q.id, idx)}
              className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                answers[q.id] === idx
                  ? "bg-[#7C3AED]/15 border-[#7C3AED]/40 text-white"
                  : "bg-white/[0.04] border-white/[0.06] text-[#94A3B8] hover:text-white"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ(currentQ - 1)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold text-[#94A3B8]"
            >
              Back
            </button>
          )}
          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              disabled={!isAnswered}
              className="flex-1 py-2.5 rounded-xl bg-[#7C3AED] text-white text-sm font-bold disabled:opacity-30"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="flex-1 py-2.5 rounded-xl bg-[#F59E0B] text-slate-950 text-sm font-bold disabled:opacity-30"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
