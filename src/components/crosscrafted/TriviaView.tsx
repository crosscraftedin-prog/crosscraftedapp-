"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Check,
  X,
  Flame,
  Trophy,
  Star,
  Play,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  Crown,
  Share2,
  BookOpen,
  Cross,
  Scroll,
  Shield,
  UserPlus,
  Users,
  Gift,
  Calendar,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  QUIZ_LEVELS,
  QUIZ_CATEGORIES,
  PRIZE_TIERS,
  TRIVIA_QUESTIONS,
  TRIVIA_GIFTS,
  TRIVIA_COMPETITIONS,
  MOCK_LEADERBOARD,
  type TriviaQuestion,
} from "@/lib/crosscrafted-data";
import StreakBadge from "@/components/crosscrafted/StreakBadge";

const STATS_KEY = "crosscrafted_trivia_stats";
const TIMER_SECONDS: Record<string, number> = {
  beginners: 30,
  intermediate: 20,
  skilled: 15,
  expert: 10,
};

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  full_bible: BookOpen,
  new_testament: Cross,
  old_testament: Scroll,
  apologetics: Shield,
};

const RANKS = [
  "Curious Seeker",
  "Bible Reader",
  "Scripture Scholar",
  "Faith Champion",
  "Word Warrior",
  "Bible Master",
];

const getRank = (points: number) => {
  if (points >= 5000) return 5;
  if (points >= 3000) return 4;
  if (points >= 1500) return 3;
  if (points >= 500) return 2;
  if (points >= 100) return 1;
  return 0;
};

const getStats = () => {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || "null") || {
      gamesPlayed: 0,
      totalPoints: 0,
      bestStreak: 0,
    };
  } catch {
    return { gamesPlayed: 0, totalPoints: 0, bestStreak: 0 };
  }
};

const saveStats = (s: any) => localStorage.setItem(STATS_KEY, JSON.stringify(s));

type GameState = "setup" | "playing" | "result";

export default function TriviaView() {
  const [selectedLevel, setSelectedLevel] = useState<(typeof QUIZ_LEVELS)[number] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<(typeof QUIZ_CATEGORIES)[number] | null>(null);
  const [quizMode, setQuizMode] = useState(10);
  const [gameState, setGameState] = useState<GameState>("setup");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeTab, setActiveTab] = useState<"play" | "compete" | "rewards" | "leaderboard" | "stats">("play");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [stats, setStats] = useState(getStats);

  const availableQuestions = useMemo(() => {
    if (!selectedLevel || !selectedCategory) return [];
    return TRIVIA_QUESTIONS.filter(
      (q) => q.difficulty === selectedLevel.id && q.category === selectedCategory.id
    );
  }, [selectedLevel, selectedCategory]);

  // Quiz flow functions — declared in dependency order:
  // finishGame → advanceQuestion → handleTimeUp (so each one's references are already defined).
  const finishGame = () => {
    setGameState("result");
    const newStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalPoints: stats.totalPoints + score,
      bestStreak: Math.max(stats.bestStreak, bestStreak),
    };
    setStats(newStats);
    saveStats(newStats);

    // Record daily trivia play streak — once per day
    try {
      const streaksRaw = localStorage.getItem("crosscrafted_streaks") || "{}";
      const before = JSON.parse(streaksRaw);
      const prevDate = before?.trivia_play?.lastActiveDate;
      const today = new Date().toISOString().split("T")[0];
      if (prevDate !== today) {
        import("@/lib/streaks").then(({ recordStreak }) => {
          const info = recordStreak("trivia_play");
          if (info.currentStreak === 1) {
            toast("🔥 Trivia streak started!", { description: "Play daily to keep it alive." });
          } else if ([3, 7, 14, 30, 60, 90].includes(info.currentStreak)) {
            toast.success(`🔥 ${info.currentStreak}-day trivia streak!`, {
              description: "You're on fire! Keep playing daily.",
            });
          }
        });
      }
    } catch {
      // ignore
    }
  };

  const advanceQuestion = () => {
    if (currentQ + 1 >= questions.length) {
      finishGame();
    } else {
      setCurrentQ((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      if (selectedLevel) setTimeLeft(TIMER_SECONDS[selectedLevel.id]);
    }
  };

  function handleTimeUp() {
    if (selectedAnswer !== null) return;
    setShowExplanation(true);
    setStreak(0);
    setTimeout(() => advanceQuestion(), 2200);
  }

  // Timer effect
  useEffect(() => {
    if (gameState !== "playing" || showExplanation) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, showExplanation, currentQ]);

  useEffect(() => {
    if (timeLeft === 0 && gameState === "playing" && !showExplanation) {
      handleTimeUp();
    }
  }, [timeLeft]);

  const startQuiz = () => {
    if (!selectedLevel || !selectedCategory) {
      toast.error("Please select a level and category");
      return;
    }
    if (availableQuestions.length === 0) {
      toast.error("No questions available for this combination. Try another!");
      return;
    }
    const pool = [...availableQuestions];
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(quizMode, pool.length));
    setQuestions(shuffled);
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setGameState("playing");
    setTimeLeft(TIMER_SECONDS[selectedLevel.id]);
  };

  const handleAnswer = (answerIdx: number) => {
    if (selectedAnswer !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedAnswer(answerIdx);
    setShowExplanation(true);

    const q = questions[currentQ];
    const isCorrect = answerIdx === q.answer;
    if (isCorrect) {
      const streakBonus = Math.min(streak, 5) * 2;
      const points = q.points + streakBonus;
      setScore((prev) => prev + points);
      setStreak((prev) => {
        const newStreak = prev + 1;
        setBestStreak((best) => Math.max(best, newStreak));
        return newStreak;
      });
      setCorrectCount((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const shareResults = async () => {
    const text = `Bible Trivia Challenge!\n\nScore: ${score} pts | Correct: ${correctCount}/${questions.length} | Best Streak: ${bestStreak}\nLevel: ${selectedLevel?.label} | Category: ${selectedCategory?.label}\n\nPlay now on CrossCrafted!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "CrossCrafted Bible Trivia",
          text,
          url: window.location.href,
        });
        return;
      } catch (_) {
        // user cancelled — fall through to clipboard
      }
    }
    navigator.clipboard.writeText(text);
    toast.success("Results copied to clipboard!");
  };

  const inviteFriend = async () => {
    const text = `Hey! Come play Bible Trivia with me on CrossCrafted. I just scored ${score} points in ${selectedLevel?.label} ${selectedCategory?.label}! Can you beat me? 💪`;
    const url = `${window.location.origin}/?comp=trivia&invited_by=you`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on CrossCrafted",
          text,
          url,
        });
        return;
      } catch (_) {
        // fall through
      }
    }
    navigator.clipboard.writeText(`${text}\n\n${url}`);
    toast.success("Invite link copied!", { description: "Share with friends via WhatsApp, SMS, or any app." });
  };

  const inviteGroup = async () => {
    const text = `🎮 Let's play Bible Trivia together on CrossCrafted!\n\nI'm starting a group game — join me and let's see who knows the Bible best. Multiple players can play the same quiz and compare scores!\n\nLevel: ${selectedLevel?.label} | Category: ${selectedCategory?.label}`;
    const url = `${window.location.origin}/?comp=trivia&group=true&invited_by=you`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Group Bible Trivia",
          text,
          url,
        });
        return;
      } catch (_) {
        // fall through
      }
    }
    navigator.clipboard.writeText(`${text}\n\n${url}`);
    toast.success("Group invite copied!", { description: "Send to your church group on WhatsApp." });
  };

  const resetGame = () => {
    setGameState("setup");
    setSelectedLevel(null);
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const currentRank = RANKS[getRank(stats.totalPoints)];
  const currentPrize =
    [...PRIZE_TIERS].reverse().find((p) => stats.totalPoints >= p.minPoints) || PRIZE_TIERS[0];
  const nextPrize = PRIZE_TIERS.find((p) => p.minPoints > stats.totalPoints);
  const prizeProgress = nextPrize
    ? ((stats.totalPoints - currentPrize.minPoints) / (nextPrize.minPoints - currentPrize.minPoints)) * 100
    : 100;

  const currentQ_ = questions[currentQ];
  const progressPct = questions.length ? ((currentQ + (showExplanation ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <div className="max-w-[680px] mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Bible Trivia</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">Test your Bible knowledge</p>
        </div>
        <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/25">
          <Trophy size={14} className="text-[#F59E0B]" />
          <span className="text-xs font-bold text-[#F59E0B]">{stats.totalPoints} pts</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl mb-5 overflow-x-auto">
        {([
          { id: "play", label: "Play" },
          { id: "compete", label: "Compete" },
          { id: "rewards", label: "Rewards" },
          { id: "leaderboard", label: "Leaders" },
          { id: "stats", label: "My Stats" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === t.id
                ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/25"
                : "text-[#94A3B8] hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "play" && (
          <motion.div
            key="play"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {gameState === "setup" && (
              <div className="space-y-5">
                <StreakBadge activity="trivia_play" />

                {/* Level Selection */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
                    Choose Level
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUIZ_LEVELS.map((lvl) => {
                      const selected = selectedLevel?.id === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          onClick={() => setSelectedLevel(lvl)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            selected
                              ? "border-transparent text-white"
                              : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
                          }`}
                          style={
                            selected
                              ? { background: `${lvl.color}20`, borderColor: `${lvl.color}80` }
                              : {}
                          }
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-2xl">{lvl.icon}</span>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: `${lvl.color}25`, color: lvl.color }}
                            >
                              {lvl.points} pts
                            </span>
                          </div>
                          <p className="text-sm font-bold text-white">{lvl.label}</p>
                          <p className="text-[10px] text-[#94A3B8]">{lvl.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
                    Choose Category
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUIZ_CATEGORIES.map((cat) => {
                      const selected = selectedCategory?.id === cat.id;
                      const Icon = CATEGORY_ICONS[cat.id] || BookOpen;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat)}
                          className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                            selected
                              ? "border-transparent text-white"
                              : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
                          }`}
                          style={
                            selected
                              ? { background: `${cat.color}20`, borderColor: `${cat.color}80` }
                              : {}
                          }
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{cat.label}</p>
                            <p className="text-[10px] text-[#94A3B8]">
                              {availableQuestions.length > 0
                                ? `${TRIVIA_QUESTIONS.filter(
                                    (q) => q.difficulty === selectedLevel?.id && q.category === cat.id
                                  ).length} questions`
                                : "Pick level first"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quiz Mode */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
                    Quiz Length
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15].map((n) => (
                      <button
                        key={n}
                        onClick={() => setQuizMode(n)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                          quizMode === n
                            ? "bg-[#7C3AED] text-white"
                            : "bg-white/[0.03] border border-white/[0.06] text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        {n} Qs
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startQuiz}
                  disabled={!selectedLevel || !selectedCategory || availableQuestions.length === 0}
                  className="w-full py-3.5 rounded-2xl text-sm font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white hover:-translate-y-px"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #EC4899)",
                    boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                  }}
                >
                  <Play size={16} fill="currentColor" /> Start Quiz
                </button>

                {selectedLevel && selectedCategory && availableQuestions.length === 0 && (
                  <p className="text-center text-xs text-[#F59E0B]">
                    No questions yet for this combo. Try Beginners/Full Bible to start.
                  </p>
                )}
              </div>
            )}

            {gameState === "playing" && currentQ_ && (
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    Question {currentQ + 1} / {questions.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#F59E0B] font-bold">
                      <Target size={12} /> {score}
                    </span>
                    {streak >= 2 && (
                      <span className="flex items-center gap-1 text-[#EF4444] font-bold">
                        <Flame size={12} /> {streak}x
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #7C3AED, #EC4899)" }}
                    animate={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2">
                  <Clock
                    size={14}
                    className={timeLeft <= 5 ? "text-[#EF4444]" : "text-[#A855F7]"}
                  />
                  <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        timeLeft <= 5 ? "bg-[#EF4444]" : "bg-[#A855F7]"
                      }`}
                      animate={{
                        width: `${(timeLeft / (selectedLevel ? TIMER_SECONDS[selectedLevel.id] : 30)) * 100}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      timeLeft <= 5 ? "text-[#EF4444]" : "text-[#94A3B8]"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>

                {/* Question Card */}
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                      style={{
                        backgroundColor: `${selectedLevel?.color}25`,
                        color: selectedLevel?.color,
                      }}
                    >
                      {selectedLevel?.label} · {selectedLevel?.points} pts
                    </span>
                  </div>
                  <p className="text-base font-bold text-white leading-relaxed mb-4">
                    {currentQ_.question}
                  </p>

                  <div className="space-y-2">
                    {currentQ_.options.map((opt, idx) => {
                      const isCorrect = idx === currentQ_.answer;
                      const isSelected = idx === selectedAnswer;
                      let style: React.CSSProperties = {};
                      let cls =
                        "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ";

                      if (selectedAnswer === null) {
                        cls += "bg-white/[0.03] border-white/[0.06] text-[#A09DB1] hover:bg-white/[0.06] hover:text-white";
                      } else if (isCorrect) {
                        cls += "bg-[#22C55E]/15 border-[#22C55E]/40 text-white";
                      } else if (isSelected) {
                        cls += "bg-[#EF4444]/15 border-[#EF4444]/40 text-white";
                      } else {
                        cls += "bg-white/[0.02] border-white/[0.04] text-[#64748B]";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={selectedAnswer !== null}
                          className={cls}
                          style={style}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                selectedAnswer === null
                                  ? "bg-white/[0.06] text-[#94A3B8]"
                                  : isCorrect
                                  ? "bg-[#22C55E] text-white"
                                  : isSelected
                                  ? "bg-[#EF4444] text-white"
                                  : "bg-white/[0.04] text-[#64748B]"
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                            {selectedAnswer !== null && isCorrect && (
                              <Check size={14} className="ml-auto text-[#22C55E]" />
                            )}
                            {selectedAnswer !== null && isSelected && !isCorrect && (
                              <X size={14} className="ml-auto text-[#EF4444]" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="bg-[#7C3AED]/8 border border-[#7C3AED]/20 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles size={12} className="text-[#A78BFA]" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A78BFA]">
                              Explanation
                            </p>
                          </div>
                          <p className="text-xs text-[#A09DB1] leading-relaxed">
                            {currentQ_.explanation}
                          </p>
                        </div>
                        {selectedAnswer !== null && (
                          <button
                            onClick={advanceQuestion}
                            className="w-full mt-3 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                          >
                            {currentQ + 1 >= questions.length ? "See Results" : "Next Question"}
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {gameState === "result" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-5 py-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 border border-[#F59E0B]/30 mb-2">
                  <Trophy size={36} className="text-[#F59E0B]" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-1">Quiz Complete!</h2>
                  <p className="text-sm text-[#94A3B8]">
                    {correctCount >= questions.length * 0.8
                      ? "Outstanding! You're a Bible scholar!"
                      : correctCount >= questions.length * 0.5
                      ? "Well done! Keep studying the Word."
                      : "Keep going — every saint started as a seeker!"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-2xl font-extrabold text-[#F59E0B]">{score}</p>
                    <p className="text-[9px] uppercase tracking-wider text-[#94A3B8] mt-1">Points</p>
                  </div>
                  <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-2xl font-extrabold text-[#22C55E]">
                      {correctCount}/{questions.length}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[#94A3B8] mt-1">Correct</p>
                  </div>
                  <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4">
                    <p className="text-2xl font-extrabold text-[#EF4444]">{bestStreak}</p>
                    <p className="text-[9px] uppercase tracking-wider text-[#94A3B8] mt-1">Best Streak</p>
                  </div>
                </div>

                <div className="flex gap-2 max-w-sm mx-auto">
                  <button
                    onClick={shareResults}
                    className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={14} /> Share
                  </button>
                  <button
                    onClick={resetGame}
                    className="flex-1 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={14} /> Play Again
                  </button>
                </div>

                {/* Invite friends / group */}
                <div className="max-w-sm mx-auto w-full space-y-2 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">
                    Challenge your friends
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={inviteFriend}
                      className="flex-1 py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/25 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={13} /> Invite Friend
                    </button>
                    <button
                      onClick={inviteGroup}
                      className="flex-1 py-2.5 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/25 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <Users size={13} /> Invite Group
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            key="lb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-xs text-[#94A3B8] mb-3">
              Top Bible scholars on crosscrafted — keep playing to climb the ranks!
            </p>
            {MOCK_LEADERBOARD.map((u) => (
              <div
                key={u.rank}
                className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  u.rank <= 3
                    ? "bg-[#F59E0B]/8 border-[#F59E0B]/25"
                    : "bg-white/[0.03] border-white/[0.06]"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                    u.rank === 1
                      ? "bg-[#F59E0B] text-slate-950"
                      : u.rank === 2
                      ? "bg-[#94A3B8] text-slate-950"
                      : u.rank === 3
                      ? "bg-[#F97316] text-slate-950"
                      : "bg-white/[0.06] text-white"
                  }`}
                >
                  {u.rank <= 3 ? <Crown size={18} /> : u.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{u.name}</p>
                  <p className="text-[11px] text-[#94A3B8]">{u.tier}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#F59E0B] tabular-nums">
                    {u.points.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">pts</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "compete" && (
          <motion.div key="compete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CompeteView userPoints={stats.totalPoints} />
          </motion.div>
        )}

        {activeTab === "rewards" && (
          <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RewardsView userPoints={stats.totalPoints} />
          </motion.div>
        )}

        {activeTab === "stats" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-2xl">
                  🎓
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Your Rank</p>
                  <p className="text-lg font-extrabold text-white">{currentRank}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-[#F59E0B]">{stats.totalPoints}</p>
                  <p className="text-[9px] uppercase tracking-wider text-[#94A3B8] mt-1">Total Points</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-[#38BDF8]">{stats.gamesPlayed}</p>
                  <p className="text-[9px] uppercase tracking-wider text-[#94A3B8] mt-1">Games Played</p>
                </div>
                <div className="bg-white/[0.04] rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-[#EF4444]">{stats.bestStreak}</p>
                  <p className="text-[9px] uppercase tracking-wider text-[#94A3B8] mt-1">Best Streak</p>
                </div>
              </div>
            </div>

            {/* Prize progress */}
            <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Current Tier</p>
                  <p className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>{currentPrize.icon}</span> {currentPrize.title}
                  </p>
                </div>
                {nextPrize && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Next</p>
                    <p className="text-xs font-bold text-white flex items-center gap-1 justify-end">
                      <span>{nextPrize.icon}</span> {nextPrize.title}
                    </p>
                  </div>
                )}
              </div>
              {nextPrize && (
                <>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #F59E0B, #EF4444)" }}
                      animate={{ width: `${Math.min(prizeProgress, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#94A3B8]">
                    {(nextPrize.minPoints - stats.totalPoints).toLocaleString()} more points to {nextPrize.title}
                  </p>
                </>
              )}
            </div>

            {/* All Prize Tiers */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">All Tiers</p>
              <div className="space-y-2">
                {PRIZE_TIERS.map((tier) => {
                  const unlocked = stats.totalPoints >= tier.minPoints;
                  const isCurrent = currentPrize.title === tier.title;
                  return (
                    <div
                      key={tier.title}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        isCurrent
                          ? "bg-[#F59E0B]/8 border-[#F59E0B]/30"
                          : unlocked
                          ? "bg-white/[0.03] border-white/[0.06]"
                          : "bg-white/[0.01] border-white/[0.03] opacity-50"
                      }`}
                    >
                      <span className="text-xl">{tier.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          {tier.title}
                          {unlocked && <Check size={12} className="text-[#22C55E]" />}
                        </p>
                        <p className="text-[10px] text-[#94A3B8]">{tier.reward}</p>
                      </div>
                      <span className="text-[10px] font-bold text-[#F59E0B] tabular-nums">
                        {tier.minPoints}+ pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── COMPETE VIEW ──────────────────────────────────────────────────────────

function CompeteView({ userPoints }: { userPoints: number }) {
  const [joinedCompetitions, setJoinedCompetitions] = useState<Set<string>>(new Set());

  const handleJoin = (compId: string, title: string) => {
    setJoinedCompetitions((prev) => {
      const next = new Set(prev);
      if (next.has(compId)) {
        next.delete(compId);
        toast("Left competition");
      } else {
        next.add(compId);
        toast.success(`Joined "${title}"!`, {
          description: "Play trivia normally — your points count toward your church's score.",
        });
      }
      return next;
    });
  };

  const handleInviteChurch = async (compTitle: string) => {
    const text = `🏆 "${compTitle}" — a Bible Trivia competition on CrossCrafted!\n\nMy church is competing. Is yours? Join us and let's see who knows the Bible best!`;
    const url = `${window.location.origin}/?comp=trivia`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Church Trivia Competition", text, url });
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(`${text}\n\n${url}`);
    toast.success("Invite copied!", { description: "Share with your church group." });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#7C3AED]/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={16} className="text-[#F59E0B]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">Church vs Church</p>
        </div>
        <p className="text-sm font-bold text-white mb-1">Compete with other churches</p>
        <p className="text-[11px] text-[#A09DB1] leading-relaxed">
          Join a competition, play trivia normally, and your points count toward your church's score.
          Top churches win cash prizes, trophies, and real gifts.
        </p>
      </div>

      {/* Competitions */}
      {TRIVIA_COMPETITIONS.map((comp, i) => {
        const isJoined = joinedCompetitions.has(comp.id);
        const sorted = [...comp.participants].sort((a, b) => b.score - a.score);
        const leader = sorted[0];
        return (
          <motion.div
            key={comp.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      comp.status === "live"
                        ? "bg-[#EF4444]/15 text-[#EF4444]"
                        : comp.status === "upcoming"
                        ? "bg-[#38BDF8]/15 text-[#38BDF8]"
                        : "bg-white/[0.06] text-[#94A3B8]"
                    }`}
                  >
                    {comp.status === "live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#EF4444] mr-1 animate-pulse" />}
                    {comp.status}
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">{comp.organizer}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">{comp.title}</h3>
                <p className="text-[11px] text-[#A09DB1] leading-relaxed line-clamp-2">{comp.description}</p>
              </div>
              {comp.prize_image && (
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 ml-2 border border-white/[0.06]">
                  <img src={comp.prize_image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Prize */}
            <div className="bg-[#F59E0B]/8 border border-[#F59E0B]/20 rounded-xl p-2.5 mb-3 flex items-center gap-2">
              <Gift size={14} className="text-[#F59E0B] shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">Prize</p>
                <p className="text-[11px] text-white">{comp.prize}</p>
              </div>
            </div>

            {/* Leaderboard */}
            {comp.status !== "upcoming" && sorted.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-2">
                  {comp.status === "live" ? "Live Standings" : "Final Results"}
                </p>
                <div className="space-y-1.5">
                  {sorted.map((p, idx) => (
                    <div key={p.church_id} className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${
                          idx === 0
                            ? "bg-[#F59E0B] text-slate-950"
                            : idx === 1
                            ? "bg-[#94A3B8] text-slate-950"
                            : idx === 2
                            ? "bg-[#F97316] text-slate-950"
                            : "bg-white/[0.06] text-white"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{p.church_name}</p>
                        <p className="text-[9px] text-[#94A3B8]">{p.players} players</p>
                      </div>
                      <span className="text-xs font-bold text-[#F59E0B] tabular-nums">
                        {p.score.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
              {comp.status !== "ended" && (
                <button
                  onClick={() => handleJoin(comp.id, comp.title)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isJoined
                      ? "bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]"
                      : "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                  }`}
                >
                  {isJoined ? "✓ Joined" : "Join Competition"}
                </button>
              )}
              <button
                onClick={() => handleInviteChurch(comp.title)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#94A3B8] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Users size={12} /> Invite Church
              </button>
            </div>
          </motion.div>
        );
      })}

      {/* Host your own */}
      <div className="bg-[#1C1929] border border-dashed border-white/[0.12] rounded-2xl p-4 text-center">
        <Calendar size={20} className="mx-auto text-[#7C3AED] mb-2" />
        <p className="text-sm font-bold text-white mb-1">Want to host a competition?</p>
        <p className="text-[11px] text-[#94A3B8] mb-3 max-w-xs mx-auto">
          Pastors and church admins can create custom trivia competitions for their church or inter-church events.
        </p>
        <button
          onClick={() => toast("Admin access required", { description: "Sign in as a church admin to host competitions." })}
          className="px-4 py-2 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#A78BFA] text-xs font-bold hover:bg-[#7C3AED]/25 transition-all"
        >
          Host a Competition
        </button>
      </div>
    </div>
  );
}

// ─── REWARDS VIEW ──────────────────────────────────────────────────────────

function RewardsView({ userPoints }: { userPoints: number }) {
  const [claimedGifts, setClaimedGifts] = useState<Set<string>>(new Set());

  const tierColors = {
    bronze: "#CD7F32",
    silver: "#C0C0C0",
    gold: "#FFD700",
    platinum: "#E5E4E2",
  };

  const handleClaim = (giftId: string, title: string, points_required: number) => {
    if (userPoints < points_required) {
      toast.error("Not enough points", {
        description: `You need ${points_required - userPoints} more points to claim this gift.`,
      });
      return;
    }
    setClaimedGifts((prev) => {
      const next = new Set(prev);
      if (next.has(giftId)) {
        next.delete(giftId);
        toast("Removed from claimed");
      } else {
        next.add(giftId);
        toast.success(`Claimed: ${title}!`, {
          description: "Admin will contact you via WhatsApp to arrange delivery.",
        });
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1C1929] to-[#2B254E] border border-[#F59E0B]/20 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} className="text-[#F59E0B]" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">Real Gifts</p>
            </div>
            <p className="text-2xl font-extrabold text-white">{userPoints.toLocaleString()} pts</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Available to redeem</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Claimed</p>
            <p className="text-2xl font-extrabold text-[#22C55E]">{claimedGifts.size}</p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#94A3B8] px-1">
        Earn points by playing trivia, then redeem them for real physical gifts.
        Admin will contact you on WhatsApp to arrange delivery.
      </p>

      {/* Gifts grid */}
      <div className="grid grid-cols-2 gap-3">
        {TRIVIA_GIFTS.map((gift, i) => {
          const canClaim = userPoints >= gift.points_required;
          const isClaimed = claimedGifts.has(gift.id);
          return (
            <motion.div
              key={gift.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#1C1929] border border-white/[0.06] rounded-2xl overflow-hidden"
            >
              <div className="relative h-24">
                <img src={gift.image_url} alt={gift.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1929] via-transparent to-transparent" />
                <span
                  className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${tierColors[gift.tier]}E6`, color: "#0A0A0A" }}
                >
                  {gift.tier}
                </span>
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                  {gift.stock} left
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-bold text-white leading-tight mb-1 line-clamp-1">{gift.title}</h3>
                <p className="text-[10px] text-[#94A3B8] line-clamp-2 mb-2">{gift.description}</p>
                <div className="flex items-center gap-1 mb-2">
                  <Zap size={10} className="text-[#F59E0B]" />
                  <span className="text-[11px] font-bold text-[#F59E0B]">{gift.points_required.toLocaleString()} pts</span>
                </div>
                <button
                  onClick={() => handleClaim(gift.id, gift.title, gift.points_required)}
                  disabled={!canClaim}
                  className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    isClaimed
                      ? "bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30"
                      : canClaim
                      ? "bg-[#F59E0B] text-slate-950 hover:bg-[#E59E0B]"
                      : "bg-white/[0.04] text-[#475569] cursor-not-allowed"
                  }`}
                >
                  {isClaimed ? "✓ Claimed" : canClaim ? "Redeem" : `${gift.points_required - userPoints} more pts`}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Earn more CTA */}
      <div className="bg-[#1C1929] border border-white/[0.06] rounded-2xl p-4 text-center mt-2">
        <p className="text-[11px] text-[#94A3B8] mb-2">Need more points to claim a gift?</p>
        <button
          onClick={() => toast("Switch to Play tab", { description: "Play trivia to earn more points!" })}
          className="px-5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-all"
        >
          Play Trivia to Earn
        </button>
      </div>
    </div>
  );
}
