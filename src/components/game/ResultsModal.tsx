"use client";

import { motion } from "framer-motion";
import { ScoreBreakdown, Guess } from "@/types/game";
import {
  generateShareText,
  getHeatLevel,
  getHeatEmoji,
  formatDistance,
} from "@/lib/utils";
import { Share2, Copy, Trophy, Flame, MapPin, Clock, Target } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ResultsModalProps {
  score: number;
  breakdown: ScoreBreakdown;
  guesses: Guess[];
  challengeNumber: number;
  locationName: string;
  streak: number;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  useEffect(() => {
    startTime.current = null;
    const step = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

function getScoreRank(score: number): { label: string; color: string; percentile: string } {
  if (score >= 950) return { label: "LEGENDARY", color: "text-amber-400", percentile: "Top 1%" };
  if (score >= 850) return { label: "EXCELLENT", color: "text-violet-400", percentile: "Top 5%" };
  if (score >= 700) return { label: "GREAT", color: "text-blue-400", percentile: "Top 15%" };
  if (score >= 500) return { label: "GOOD", color: "text-emerald-400", percentile: "Top 40%" };
  if (score >= 300) return { label: "DECENT", color: "text-yellow-400", percentile: "Top 65%" };
  return { label: "KEEP TRYING", color: "text-zinc-400", percentile: "Top 85%" };
}

export default function ResultsModal({
  score,
  breakdown,
  guesses,
  challengeNumber,
  locationName,
  streak,
}: ResultsModalProps) {
  const [copied, setCopied] = useState(false);
  const displayScore = useCountUp(score);
  const countdown = useCountdown();
  const rank = getScoreRank(score);

  const shareText = generateShareText(challengeNumber, score, guesses, streak);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: shareText });
    } else {
      handleCopy();
    }
  };

  const bestGuess = guesses.reduce(
    (best, g) => (g.distanceKm < best.distanceKm ? g : best),
    guesses[0]
  );

  const scoreBarWidth = Math.min(100, (score / 1000) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
        >
          <Trophy className="w-10 h-10 mx-auto text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]" />
        </motion.div>
        <h2 className="text-xl font-bold text-white">Challenge Complete!</h2>
        <p className="text-sm text-zinc-400">
          Daily #{challengeNumber} ·{" "}
          <span className="text-white font-medium">{locationName}</span>
        </p>
      </div>

      {/* Score */}
      <div className="text-center">
        <motion.div
          className="text-5xl font-black tabular-nums"
          style={{
            background:
              "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {displayScore}
        </motion.div>
        <div className="text-xs text-zinc-500 font-medium mt-0.5">/ 1000</div>

        {/* Score bar */}
        <div className="mt-3 mx-auto max-w-[220px]">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${scoreBarWidth}%` }}
              transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #8b5cf6, #6366f1, #3b82f6)",
              }}
            />
          </div>
        </div>

        {/* Rank badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-2"
        >
          <span className={`text-xs font-bold tracking-widest ${rank.color}`}>
            {rank.label}
          </span>
          <span className="text-[10px] text-zinc-500 ml-2">{rank.percentile}</span>
        </motion.div>
      </div>

      {/* Score breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-1.5 px-1"
      >
        <ScoreRow label="Distance" value={`+${breakdown.distanceScore}`} />
        <ScoreRow label="Speed Bonus" value={`+${breakdown.speedBonus}`} />
        <ScoreRow label="Guess Bonus" value={`+${breakdown.guessCountBonus}`} />
        {breakdown.hintPenalty > 0 && (
          <ScoreRow label="Hint Penalty" value={`-${breakdown.hintPenalty}`} negative />
        )}
        <div className="border-t border-zinc-800 pt-1.5">
          <ScoreRow label="Total" value={String(breakdown.total)} bold />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-3 gap-2"
      >
        <StatCard
          icon={<Target size={14} />}
          value={formatDistance(bestGuess.distanceKm)}
          label="Best Guess"
        />
        <StatCard
          icon={<MapPin size={14} />}
          value={String(guesses.length)}
          label="Guesses"
        />
        <StatCard
          icon={<Flame size={14} />}
          value={streak > 0 ? String(streak) : "—"}
          label="Streak"
        />
      </motion.div>

      {/* Heat trail */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50"
      >
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
          Your Trail
        </div>
        <div className="flex gap-1.5">
          {guesses.map((g, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1 + i * 0.08, type: "spring", stiffness: 300 }}
              className="text-2xl"
            >
              {getHeatEmoji(getHeatLevel(g.distanceKm))}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Share preview card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-400 leading-relaxed whitespace-pre"
      >
        {shareText}
      </motion.div>

      {/* Share buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="flex gap-2"
      >
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sm text-white font-medium rounded-xl border border-zinc-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Copy size={14} />
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-sm text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Share2 size={14} />
          Share
        </button>
      </motion.div>

      {/* Next challenge countdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="text-center pt-2 border-t border-zinc-800"
      >
        <div className="flex items-center justify-center gap-1.5 text-zinc-500">
          <Clock size={12} />
          <span className="text-[10px] uppercase tracking-widest">
            Next challenge in
          </span>
        </div>
        <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">
          {countdown}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScoreRow({
  label,
  value,
  negative,
  bold,
}: {
  label: string;
  value: string;
  negative?: boolean;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between text-sm ${bold ? "font-bold text-zinc-100" : ""}`}
    >
      <span className="text-zinc-400">{label}</span>
      <span
        className={`font-mono ${
          negative
            ? "text-red-400"
            : bold
              ? "text-white"
              : "text-emerald-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
      <div className="flex justify-center text-zinc-500 mb-1">{icon}</div>
      <div className="text-base font-bold text-white">{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-zinc-500">
        {label}
      </div>
    </div>
  );
}
