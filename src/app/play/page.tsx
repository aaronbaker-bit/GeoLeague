"use client";

import dynamic from "next/dynamic";
import { useGame } from "@/hooks/useGame";
import Header from "@/components/layout/Header";
import GuessTrail from "@/components/game/GuessTrail";
import HintPanel from "@/components/game/HintPanel";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import ResultsModal from "@/components/game/ResultsModal";
import { AnimatePresence, motion } from "framer-motion";

const GameMap = dynamic(() => import("@/components/map/GameMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-900 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-zinc-600 text-sm">Loading map...</span>
    </div>
  ),
});

export default function PlayPage() {
  const {
    gameState,
    location,
    challengeNumber,
    scoreBreakdown,
    makeGuess,
    revealHint,
    maxGuesses,
    streak,
    remainingGuesses,
    currentHints,
    availableHints,
  } = useGame();

  const isComplete = gameState.status === "completed";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header challengeNumber={challengeNumber} streak={streak} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 relative p-3">
          <GameMap
            onGuess={makeGuess}
            guesses={gameState.guesses}
            targetLat={location.lat}
            targetLng={location.lng}
            showTarget={isComplete}
            disabled={isComplete}
          />

          {!isComplete && gameState.guesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 left-6 z-10"
            >
              <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-xl px-4 py-3">
                <ScoreDisplay
                  score={gameState.score}
                  breakdown={scoreBreakdown}
                  isComplete={false}
                />
              </div>
            </motion.div>
          )}

          {!isComplete && (
            <div className="absolute top-6 right-6 z-10">
              <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-xl px-4 py-2 text-center">
                <div className="text-2xl font-bold text-white">{remainingGuesses}</div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  guesses left
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 overflow-y-auto">
          <div className="p-4 space-y-6">
            <AnimatePresence mode="wait">
              {isComplete && scoreBreakdown ? (
                <ResultsModal
                  key="results"
                  score={gameState.score}
                  breakdown={scoreBreakdown}
                  guesses={gameState.guesses}
                  challengeNumber={challengeNumber}
                  locationName={location.name}
                  streak={streak}
                />
              ) : (
                <motion.div key="playing" className="space-y-6">
                  {gameState.guesses.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20"
                    >
                      <h2 className="text-sm font-semibold text-violet-300 mb-1">
                        Daily Challenge #{challengeNumber}
                      </h2>
                      <p className="text-sm text-zinc-400">
                        Click anywhere on the map to guess the secret location.
                        Use hints to narrow it down. Fewer guesses = higher score!
                      </p>
                    </motion.div>
                  )}

                  <GuessTrail
                    guesses={gameState.guesses}
                    maxGuesses={maxGuesses}
                  />

                  <HintPanel
                    hints={currentHints}
                    availableHints={availableHints}
                    onRevealHint={revealHint}
                    disabled={isComplete}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
