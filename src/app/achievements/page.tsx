"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENTS, TIER_BORDER, getUserAchievements } from "@/lib/achievements";
import { getDailyLocation } from "@/data/locations";
import Header from "@/components/layout/Header";
import { motion } from "framer-motion";
import { Award } from "lucide-react";

export default function AchievementsPage() {
  const { challengeNumber } = getDailyLocation();
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const streak = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("geoleague_streak") || "0", 10)
    : 0;

  useEffect(() => {
    getUserAchievements().then(keys => {
      setUnlocked(new Set(keys));
      setLoading(false);
    });
  }, []);

  const tiers = ["bronze", "silver", "gold", "diamond"] as const;
  const grouped = tiers.map(t => ({
    tier: t,
    achievements: ACHIEVEMENTS.filter(a => a.tier === t),
  }));

  const totalUnlocked = ACHIEVEMENTS.filter(a => unlocked.has(a.key)).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header challengeNumber={challengeNumber} streak={streak} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Award className="w-10 h-10 mx-auto text-amber-400 mb-3" />
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {totalUnlocked}/{ACHIEVEMENTS.length} unlocked
            </p>
            <div className="w-48 h-2 bg-zinc-800 rounded-full mx-auto mt-3">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-amber-400 rounded-full transition-all"
                style={{ width: `${(totalUnlocked / ACHIEVEMENTS.length) * 100}%` }}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map(({ tier, achievements }) => (
                <div key={tier}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                    {tier === "diamond" ? "Diamond" : tier === "gold" ? "Gold" : tier === "silver" ? "Silver" : "Bronze"}
                  </h2>
                  <div className="space-y-2">
                    {achievements.map((a, i) => {
                      const isUnlocked = unlocked.has(a.key);
                      return (
                        <motion.div key={a.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border ${isUnlocked ? `bg-zinc-900/80 ${TIER_BORDER[tier]}` : "bg-zinc-900/30 border-zinc-800/50 opacity-50"}`}>
                          <div className="text-2xl w-10 text-center">{isUnlocked ? a.icon : "🔒"}</div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium ${isUnlocked ? "text-white" : "text-zinc-600"}`}>{a.name}</div>
                            <div className="text-xs text-zinc-500">{a.description}</div>
                          </div>
                          {isUnlocked && <div className="text-xs text-green-400 font-medium">Unlocked</div>}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
