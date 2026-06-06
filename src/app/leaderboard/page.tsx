"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDailyLocation } from "@/data/locations";
import Header from "@/components/layout/Header";
import { motion } from "framer-motion";
import { Trophy, Medal, Globe } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  rank: number;
  isYou?: boolean;
  time_ms?: number;
}

export default function LeaderboardPage() {
  const { challengeNumber } = getDailyLocation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"daily" | "weekly" | "alltime">("daily");

  const streak = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("geoleague_streak") || "0", 10)
    : 0;

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      setLoading(true);
      const supabase = createClient();

      // Get current user ID
      let currentUserId: string | null = null;
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          currentUserId = session?.user?.id || null;
        } catch {}
      }

      if (tab === "daily") {
        if (supabase) {
          try {
            const { data } = await supabase
              .from("daily_leaderboard")
              .select("user_id, display_name, avatar_url, score, time_ms, rank")
              .order("rank", { ascending: true })
              .limit(50);

            if (!cancelled && data && data.length > 0) {
              setEntries(data.map((row: { user_id: string; display_name: string | null; avatar_url: string | null; score: number; time_ms: number | null; rank: number }) => ({
                id: row.user_id,
                display_name: row.display_name || "Player",
                avatar_url: row.avatar_url,
                score: row.score,
                rank: Number(row.rank),
                time_ms: row.time_ms || undefined,
                isYou: row.user_id === currentUserId,
              })));
              if (!cancelled) setLoading(false);
              return;
            }
          } catch {}
        }

        // Fallback to localStorage
        try {
          const stored = localStorage.getItem("geoleague_daily_v2");
          if (stored) {
            const parsed = JSON.parse(stored);
            const today = new Date().toISOString().split("T")[0];
            if (parsed.date === today && parsed.status === "completed") {
              if (!cancelled) {
                setEntries([{
                  id: "you", display_name: "You", avatar_url: null,
                  score: parsed.totalScore, rank: 1, isYou: true,
                }]);
              }
            }
          }
        } catch {}
        if (!cancelled) setLoading(false);
        return;
      }

      if (tab === "alltime") {
        if (supabase) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("id, display_name, avatar_url, total_score, total_games")
              .gt("total_games", 0)
              .order("total_score", { ascending: false })
              .limit(50);

            if (!cancelled && data && data.length > 0) {
              setEntries(data.map((p: { id: string; display_name: string | null; avatar_url: string | null; total_score: number }, i: number) => ({
                id: p.id,
                display_name: p.display_name || "Player",
                avatar_url: p.avatar_url,
                score: p.total_score,
                rank: i + 1,
                isYou: p.id === currentUserId,
              })));
            }
          } catch {}
        }
        if (!cancelled) setLoading(false);
        return;
      }

      // Weekly tab - sum scores from last 7 days
      if (tab === "weekly" && supabase) {
        try {
          const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
          const { data } = await supabase
            .from("game_results")
            .select("user_id, score, profiles(display_name, avatar_url)")
            .gte("completed_at", sevenDaysAgo);

          if (!cancelled && data && data.length > 0) {
            // Aggregate scores by user
            const userScores = new Map<string, { score: number; display_name: string; avatar_url: string | null }>();
            for (const row of data as { user_id: string; score: number; profiles: { display_name: string | null; avatar_url: string | null } | null }[]) {
              const existing = userScores.get(row.user_id);
              if (existing) {
                existing.score += row.score;
              } else {
                userScores.set(row.user_id, {
                  score: row.score,
                  display_name: row.profiles?.display_name || "Player",
                  avatar_url: row.profiles?.avatar_url || null,
                });
              }
            }
            const sorted = [...userScores.entries()].sort((a, b) => b[1].score - a[1].score);
            setEntries(sorted.map(([uid, info], i) => ({
              id: uid,
              display_name: info.display_name,
              avatar_url: info.avatar_url,
              score: info.score,
              rank: i + 1,
              isYou: uid === currentUserId,
            })));
          }
        } catch {}
      }
      if (!cancelled) setLoading(false);
    }

    loadEntries();
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header challengeNumber={challengeNumber} streak={streak} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Trophy className="w-10 h-10 mx-auto text-amber-400 mb-3" />
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Daily #{challengeNumber}</p>
          </div>

          <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl mb-6">
            {(["daily", "weekly", "alltime"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {t === "daily" ? "Today" : t === "weekly" ? "This Week" : "All Time"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" />)}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-zinc-400 mb-2">No scores yet {tab === "daily" ? "today" : tab === "weekly" ? "this week" : ""}</h3>
              <p className="text-sm text-zinc-600 mb-6">Be the first to complete {tab === "daily" ? "today's" : "a"} challenge!</p>
              <Link href="/play" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors">Play Now</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    entry.isYou ? "bg-violet-500/10 border-violet-500/30" :
                    entry.rank === 1 ? "bg-amber-500/5 border-amber-500/20" :
                    entry.rank === 2 ? "bg-zinc-400/5 border-zinc-400/20" :
                    entry.rank === 3 ? "bg-orange-500/5 border-orange-500/20" : "bg-zinc-900/50 border-zinc-800"
                  }`}>
                  <div className="w-8 text-center">
                    {entry.rank <= 3 ? (
                      <Medal size={20} className={entry.rank === 1 ? "text-amber-400 mx-auto" : entry.rank === 2 ? "text-zinc-400 mx-auto" : "text-orange-400 mx-auto"} />
                    ) : (
                      <span className="text-sm font-bold text-zinc-500">{entry.rank}</span>
                    )}
                  </div>
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-10 h-10 rounded-full border-2 border-zinc-700" referrerPolicy="no-referrer" />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${entry.isYou ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                      {entry.display_name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {entry.display_name}
                      {entry.isYou && <span className="text-xs text-violet-400 ml-2">(you)</span>}
                    </div>
                    {entry.time_ms && tab === "daily" && (
                      <div className="text-xs text-zinc-500">{Math.round(entry.time_ms / 1000)}s</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white tabular-nums">{entry.score}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {tab === "alltime" ? "total" : tab === "weekly" ? "week" : "pts"}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
