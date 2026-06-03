"use client";

import { motion } from "framer-motion";
import { Guess } from "@/types/game";
import { getHeatLevel, getHeatEmoji, getHeatLabel, formatDistance } from "@/lib/utils";

interface GuessTrailProps {
  guesses: Guess[];
  maxGuesses: number;
}

export default function GuessTrail({ guesses, maxGuesses }: GuessTrailProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Guesses ({guesses.length}/{maxGuesses})
      </h3>

      <div className="space-y-1.5">
        {guesses.map((guess, i) => {
          const heat = getHeatLevel(guess.distanceKm);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getHeatEmoji(heat)}</span>
                  <span className="text-sm font-medium text-zinc-200">
                    {getHeatLabel(heat)}
                  </span>
                </div>
              </div>
              <div className="text-sm font-mono text-zinc-400">
                {formatDistance(guess.distanceKm)}
              </div>
            </motion.div>
          );
        })}

        {Array.from({ length: maxGuesses - guesses.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-800/50 border-dashed"
          >
            <div className="w-7 h-7 rounded-full bg-zinc-800/30 flex items-center justify-center text-xs text-zinc-600">
              {guesses.length + i + 1}
            </div>
            <div className="text-sm text-zinc-600">—</div>
          </div>
        ))}
      </div>
    </div>
  );
}
