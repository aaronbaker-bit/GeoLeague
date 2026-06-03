"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Hint } from "@/types/game";
import { Lightbulb, Lock } from "lucide-react";

interface HintPanelProps {
  hints: Hint[];
  availableHints: number;
  onRevealHint: () => void;
  disabled: boolean;
}

const HINT_ICONS: Record<string, string> = {
  continent: "🌍",
  region: "📍",
  climate: "🌡️",
  population: "👥",
  hemisphere: "🧭",
  language: "🗣️",
  currency: "💰",
  country_outline: "🗺️",
  fun_fact: "💡",
};

export default function HintPanel({
  hints,
  availableHints,
  onRevealHint,
  disabled,
}: HintPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Hints
        </h3>
        {availableHints > 0 && !disabled && (
          <button
            onClick={onRevealHint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-colors"
          >
            <Lightbulb size={12} />
            Reveal Hint ({availableHints} left) · -25pts
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {hints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
          >
            <Lock size={14} className="text-zinc-500" />
            <span className="text-sm text-zinc-500">
              Use hints to narrow down the location
            </span>
          </motion.div>
        ) : (
          hints.map((hint, i) => (
            <motion.div
              key={hint.order}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
            >
              <span className="text-lg mt-0.5">{HINT_ICONS[hint.type] || "💡"}</span>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">
                  {hint.type.replace("_", " ")}
                </div>
                <div className="text-sm text-zinc-200">{hint.value}</div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
