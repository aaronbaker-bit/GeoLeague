"use client";

import dynamic from "next/dynamic";
import { useGame, RoundResult } from "@/hooks/useGame";
import Header from "@/components/layout/Header";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Target, Trophy, Clock, Flame, Share2, Copy, ChevronRight } from "lucide-react";
import { getHeatLevel, getHeatEmoji, formatDistance } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { Location } from "@/types/game";

const GameMap = dynamic(() => import("@/components/map/GameMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-900 rounded-xl animate-pulse flex items-center justify-center">
      <span className="text-zinc-600 text-sm">Loading map...</span>
    </div>
  ),
});

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
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

export default function PlayPage() {
  const {
    currentRound,
    totalRounds,
    currentLocation,
    isComplete,
    totalScore,
    maxScore,
    pointsPerRound,
    rounds,
    makeGuess,
    challengeNumber,
    streak,
    locations,
  } = useGame();

  const [showRoundResult, setShowRoundResult] = useState(false);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  useEffect(() => {
    if (rounds.length > 0 && !isComplete) {
      const latest = rounds[rounds.length - 1];
      setLastResult(latest);
      setShowRoundResult(true);
      const timer = setTimeout(() => setShowRoundResult(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [rounds.length, isComplete]);

  const showTarget = showRoundResult && lastResult;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header challengeNumber={challengeNumber} streak={streak} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 relative p-3">
          <GameMap
            onGuess={makeGuess}
            guesses={showTarget ? [lastResult.guess] : []}
            targetLat={showTarget ? lastResult.location.lat : undefined}
            targetLng={showTarget ? lastResult.location.lng : undefined}
            showTarget={!!showTarget}
            disabled={isComplete || showRoundResult}
          />

          {/* TARGET LOCATION PROMPT */}
          {!isComplete && !showRoundResult && (
            <motion.div
              key={currentRound}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="bg-zinc-900/95 backdrop-blur-md border border-violet-500/30 rounded-2xl px-6 py-4 text-center shadow-2xl shadow-violet-900/20">
                <div className="text-[10px] uppercase tracking-widest text-violet-400 mb-1">
                  Find this location
                </div>
                <div className="text-xl font-bold text-white">
                  📍 {currentLocation.name}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {currentLocation.category} · {currentLocation.difficulty}
                </div>
              </div>
            </motion.div>
          )}

          {/* Round result flash */}
          <AnimatePresence>
            {showRoundResult && lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 z-10"
              >
                <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-2xl px-6 py-4 text-center shadow-2xl">
                  <div className="text-2xl mb-1">
                    {getHeatEmoji(getHeatLevel(lastResult.guess.distanceKm))}
                  </div>
                  <div className="text-lg font-bold text-white">+{lastResult.score} pts</div>
                  <div className="text-xs text-zinc-400">
                    {formatDistance(lastResult.guess.distanceKm)} away from {lastResult.location.name}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score (bottom left) */}
          {!isComplete && (
            <div className="absolute bottom-6 left-6 z-10">
              <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-xl px-4 py-2">
                <div className="text-xs text-zinc-500 mb-1">Score</div>
                <div className="text-lg font-bold text-white tabular-nums">
                  {totalScore}<span className="text-zinc-600">/{maxScore}</span>
                </div>
              </div>
            </div>
          )}

          {/* Round counter (bottom right) */}
          {!isComplete && (
            <div className="absolute bottom-6 right-6 z-10">
              <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 rounded-xl px-4 py-2 text-center">
                <div className="text-2xl font-bold text-white">
                  {currentRound + 1}<span className="text-zinc-600">/{totalRounds}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">round</div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 overflow-y-auto">
          <div className="p-4 space-y-4">
            <AnimatePresence mode="wait">
              {isComplete ? (
                <CompletedSidebar
                  key="complete"
                  rounds={rounds}
                  totalScore={totalScore}
                  maxScore={maxScore}
                  challengeNumber={challengeNumber}
                  streak={streak}
                />
              ) : (
                <PlayingSidebar
                  key="playing"
                  currentRound={currentRound}
                  totalRounds={totalRounds}
                  rounds={rounds}
                  locations={locations}
                  pointsPerRound={pointsPerRound}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayingSidebar({
  currentRound,
  totalRounds,
  rounds,
  locations,
  pointsPerRound,
}: {
  currentRound: number;
  totalRounds: number;
  rounds: RoundResult[];
  locations: Location[];
  pointsPerRound: number;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <h2 className="text-sm font-semibold text-violet-300 mb-1">How to play</h2>
        <p className="text-sm text-zinc-400">
          Drop a pin where you think the location is. You get 1 guess per location, 6 locations today. Closer = more points!
        </p>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Today&apos;s Rounds</div>
        <div className="space-y-2">
          {locations.map((loc, i) => {
            const result = rounds[i];
            const isCurrent = i === currentRound;
            const isFuture = i > currentRound;

            return (
              <div
                key={loc.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-violet-500/10 border-violet-500/30"
                    : result
                      ? "bg-zinc-800/50 border-zinc-700/50"
                      : "bg-zinc-900/30 border-zinc-800/50 opacity-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCurrent ? "bg-violet-600 text-white" : result ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800 text-zinc-600"
                }`}>
                  {result ? getHeatEmoji(getHeatLevel(result.guess.distanceKm)) : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${isFuture ? "text-zinc-600" : "text-white"}`}>
                    {isFuture ? "???" : loc.name}
                  </div>
                  {result && (
                    <div className="text-xs text-zinc-500">{formatDistance(result.guess.distanceKm)} away</div>
                  )}
                </div>
                <div className="text-right">
                  {result ? (
                    <div className="text-sm font-bold text-white tabular-nums">
                      {result.score}<span className="text-zinc-600">/{pointsPerRound}</span>
                    </div>
                  ) : isCurrent ? (
                    <ChevronRight size={16} className="text-violet-400" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function CompletedSidebar({
  rounds,
  totalScore,
  maxScore,
  challengeNumber,
  streak,
}: {
  rounds: RoundResult[];
  totalScore: number;
  maxScore: number;
  challengeNumber: number;
  streak: number;
}) {
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown();

  const shareText = [
    `🌍 GeoLeague #${challengeNumber}`,
    "",
    ...rounds.map((r) => `${getHeatEmoji(getHeatLevel(r.guess.distanceKm))} ${r.location.name}: ${r.score}pts`),
    "",
    `Total: ${totalScore}/${maxScore}`,
    streak > 1 ? `🔥 ${streak} day streak` : "",
    "",
    "geoleague.vercel.app",
  ].filter(Boolean).join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pct = Math.round((totalScore / maxScore) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="text-center">
        <Trophy className="w-10 h-10 mx-auto text-amber-400 mb-2" />
        <h2 className="text-xl font-bold text-white">Challenge Complete!</h2>
        <p className="text-sm text-zinc-500">Daily #{challengeNumber}</p>
      </div>

      <div className="text-center">
        <div className="text-5xl font-black tabular-nums" style={{
          background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {totalScore}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">/ {maxScore} ({pct}%)</div>
        <div className="mt-3 mx-auto max-w-[220px]">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #8b5cf6, #3b82f6)" }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-widest text-zinc-500">Round Breakdown</div>
        {rounds.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50"
          >
            <div className="text-lg">{getHeatEmoji(getHeatLevel(r.guess.distanceKm))}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{r.location.name}</div>
              <div className="text-xs text-zinc-500">{formatDistance(r.guess.distanceKm)} away</div>
            </div>
            <div className="text-sm font-bold text-white tabular-nums">
              {r.score}<span className="text-zinc-600">/200</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <Target size={14} className="mx-auto text-zinc-500 mb-1" />
          <div className="text-base font-bold text-white">{formatDistance(Math.min(...rounds.map(r => r.guess.distanceKm)))}</div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-500">Best</div>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <MapPin size={14} className="mx-auto text-zinc-500 mb-1" />
          <div className="text-base font-bold text-white">{rounds.length}</div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-500">Rounds</div>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <Flame size={14} className="mx-auto text-zinc-500 mb-1" />
          <div className="text-base font-bold text-white">{streak || "—"}</div>
          <div className="text-[9px] uppercase tracking-widest text-zinc-500">Streak</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sm text-white font-medium rounded-xl border border-zinc-700 transition-all">
          <Copy size={14} />{copied ? "Copied!" : "Copy"}
        </button>
        <button onClick={() => navigator.share?.({ text: shareText }) || handleCopy()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-sm text-white font-medium rounded-xl shadow-lg shadow-violet-600/20 transition-all">
          <Share2 size={14} />Share
        </button>
      </div>

      <div className="text-center pt-2 border-t border-zinc-800">
        <div className="flex items-center justify-center gap-1.5 text-zinc-500">
          <Clock size={12} />
          <span className="text-[10px] uppercase tracking-widest">Next challenge in</span>
        </div>
        <div className="text-lg font-bold font-mono text-white mt-1 tabular-nums">{countdown}</div>
      </div>
    </motion.div>
  );
}
