"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { getDailyLocation } from "@/data/locations";
import Header from "@/components/layout/Header";
import { motion } from "framer-motion";
import { Trophy, Medal, Clock, Target, Globe } from "lucide-react";
import { formatDistance } from "@/lib/utils";
import Link from "next/link";

interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  score: number;
  time_ms: number;
  best_distance_km: number;
  rank: number;
}

export default function LeaderboardPage() {
  const { challengeNumber } = getDailyLocation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"daily" | "weekly" | "alltime">("daily");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = createClient();

      if (tab === "daily") {
        const { data } = await supabase
          .from("daily_leaderboard" as never)
          .select("*")
          .limit(50);
        setEntries((data as LeaderboardEntry[] | null) ?? []);
      } else if (tab === "alltime") {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, total_score, total_games, elo_rating")
          .order("elo_rating", { ascending: false })
          .limit(50);

        interface ProfileRow {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          elo_rating: number;
          total_score: number;
          total_games: number;
        }

        setEntries(
          ((data ?? []) as ProfileRow[]).map((p, i) => ({
            user_id: p.id,
            username: p.username,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            score: p.elo_rating,
            time_ms: 0,
            best_distance_km: 0,
            rank: i + 1,
          }))
        );
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [tab]);

  const streak = (() => {
    if (typeof window === "undefined") return 0;
    const s = localStorage.getItem("geoleague_streak");
    return s ? parseInt(s, 10) : 0;
  })();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header challengeNumber={challengeNumber} streak={streak} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Trophy className="w-10 h-10 mx-auto text-amber-400 mb-3" />
            <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Daily #{challengeNumber}
            </p>
          </div>

          <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl mb-6">
            {(["daily", "weekly", "alltime"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  tab === t
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t === "daily" ? "Today" : t === "weekly" ? "This Week" : "All Time"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="w-12 h-12 mx-auto text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-zinc-400 mb-2">
                No scores yet today
              </h3>
              <p className="text-sm text-zinc-600 mb-6">
                Be the first to complete today&apos;s challenge!
              </p>
              <Link
                href="/play"
                className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
              >
                Play Now
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    entry.rank === 1
                      ? "bg-amber-500/5 border-amber-500/20"
                      : entry.rank === 2
                        ? "bg-zinc-400/5 border-zinc-400/20"
                        : entry.rank === 3
                          ? "bg-orange-500/5 border-orange-500/20"
                          : "bg-zinc-900/50 border-zinc-800"
                  }`}
                >
                  <div className="w-8 text-center">
                    {entry.rank <= 3 ? (
                      <Medal
                        size={20}
                        className={
                          entry.rank === 1
                            ? "text-amber-400 mx-auto"
                            : entry.rank === 2
                              ? "text-zinc-400 mx-auto"
                              : "text-orange-400 mx-auto"
                        }
                      />
                    ) : (
                      <span className="text-sm font-bold text-zinc-500">
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-zinc-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                      {(entry.display_name || "?")[0].toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {entry.display_name || entry.username || "Anonymous"}
                    </div>
                    {tab === "daily" && entry.best_distance_km > 0 && (
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Target size={10} />
                          {formatDistance(entry.best_distance_km)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {(entry.time_ms / 1000).toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-white tabular-nums">
                      {entry.score}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                      {tab === "alltime" ? "ELO" : "pts"}
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
