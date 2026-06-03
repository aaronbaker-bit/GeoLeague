"use client";

import { motion } from "framer-motion";
import { ScoreBreakdown } from "@/types/game";

interface ScoreDisplayProps {
  score: number;
  breakdown: ScoreBreakdown | null;
  isComplete: boolean;
}

export default function ScoreDisplay({
  score,
  breakdown,
  isComplete,
}: ScoreDisplayProps) {
  return (
    <div className="text-center">
      <motion.div
        key={score}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-5xl font-black tabular-nums"
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {score}
      </motion.div>
      <div className="text-sm text-zinc-500 font-medium mt-1">/ 1000</div>

      {isComplete && breakdown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 space-y-1.5 text-left max-w-xs mx-auto"
        >
          <Row label="Distance" value={`+${breakdown.distanceScore}`} />
          <Row label="Speed Bonus" value={`+${breakdown.speedBonus}`} />
          <Row label="Guess Bonus" value={`+${breakdown.guessCountBonus}`} />
          {breakdown.hintPenalty > 0 && (
            <Row
              label="Hint Penalty"
              value={`-${breakdown.hintPenalty}`}
              negative
            />
          )}
          <div className="border-t border-zinc-700 pt-1.5 mt-2">
            <Row label="Total" value={String(breakdown.total)} bold />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Row({
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
    <div className={`flex justify-between text-sm ${bold ? "font-bold text-zinc-100" : ""}`}>
      <span className="text-zinc-400">{label}</span>
      <span
        className={
          negative
            ? "text-red-400 font-mono"
            : bold
              ? "text-white font-mono"
              : "text-emerald-400 font-mono"
        }
      >
        {value}
      </span>
    </div>
  );
}
