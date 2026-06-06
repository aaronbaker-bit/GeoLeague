"use client";

import { createClient, initAuth } from "@/lib/supabase/client";

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_game", name: "First Steps", description: "Complete your first daily challenge", icon: "🌍", tier: "bronze" },
  { key: "score_500", name: "Sharp Eye", description: "Score 500+ in a single day", icon: "🎯", tier: "bronze" },
  { key: "score_800", name: "Geography Pro", description: "Score 800+ in a single day", icon: "🏅", tier: "silver" },
  { key: "score_1000", name: "World Expert", description: "Score 1000+ in a single day", icon: "🌟", tier: "gold" },
  { key: "perfect_round", name: "Bullseye", description: "Score 200 on a single round", icon: "🎪", tier: "gold" },
  { key: "perfect_game", name: "Flawless", description: "Score 1200/1200 — perfect game", icon: "💎", tier: "diamond" },
  { key: "streak_3", name: "Hat Trick", description: "Play 3 days in a row", icon: "🔥", tier: "bronze" },
  { key: "streak_7", name: "Weekly Warrior", description: "Play 7 days in a row", icon: "⚡", tier: "silver" },
  { key: "streak_14", name: "Fortnight Force", description: "Play 14 days in a row", icon: "💪", tier: "gold" },
  { key: "streak_30", name: "Month Master", description: "Play 30 days in a row", icon: "👑", tier: "diamond" },
  { key: "games_5", name: "Getting Started", description: "Complete 5 daily challenges", icon: "📍", tier: "bronze" },
  { key: "games_25", name: "Regular", description: "Complete 25 daily challenges", icon: "🗺️", tier: "silver" },
  { key: "games_50", name: "Dedicated", description: "Complete 50 daily challenges", icon: "🧭", tier: "gold" },
  { key: "games_100", name: "Centurion", description: "Complete 100 daily challenges", icon: "🏆", tier: "diamond" },
  { key: "close_10km", name: "So Close!", description: "Guess within 10km of the target", icon: "📌", tier: "bronze" },
  { key: "friend_added", name: "Social Butterfly", description: "Add your first friend", icon: "🤝", tier: "bronze" },
];

export const TIER_COLORS: Record<string, string> = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-zinc-300 to-zinc-500",
  gold: "from-yellow-400 to-amber-500",
  diamond: "from-cyan-300 to-violet-400",
};

export const TIER_BORDER: Record<string, string> = {
  bronze: "border-amber-700/40",
  silver: "border-zinc-400/40",
  gold: "border-yellow-400/40",
  diamond: "border-cyan-300/40",
};

export function checkAchievements(stats: {
  totalScore: number;
  maxScore: number;
  roundScores: number[];
  streak: number;
  totalGames: number;
  bestDistanceKm: number;
}): string[] {
  const earned: string[] = [];
  if (stats.totalGames >= 1) earned.push("first_game");
  if (stats.totalScore >= 500) earned.push("score_500");
  if (stats.totalScore >= 800) earned.push("score_800");
  if (stats.totalScore >= 1000) earned.push("score_1000");
  if (stats.totalScore >= stats.maxScore) earned.push("perfect_game");
  if (stats.roundScores.some(s => s >= 200)) earned.push("perfect_round");
  if (stats.bestDistanceKm <= 10) earned.push("close_10km");
  if (stats.streak >= 3) earned.push("streak_3");
  if (stats.streak >= 7) earned.push("streak_7");
  if (stats.streak >= 14) earned.push("streak_14");
  if (stats.streak >= 30) earned.push("streak_30");
  if (stats.totalGames >= 5) earned.push("games_5");
  if (stats.totalGames >= 25) earned.push("games_25");
  if (stats.totalGames >= 50) earned.push("games_50");
  if (stats.totalGames >= 100) earned.push("games_100");
  return earned;
}

export async function saveNewAchievements(achievementKeys: string[]): Promise<string[]> {
  if (achievementKeys.length === 0) return [];
  await initAuth();
  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];
    const userId = session.user.id;

    const { data: existing } = await supabase
      .from("achievements")
      .select("achievement_key")
      .eq("user_id", userId);

    const existingKeys = new Set((existing || []).map((a: { achievement_key: string }) => a.achievement_key));
    const newKeys = achievementKeys.filter(k => !existingKeys.has(k));
    if (newKeys.length === 0) return [];

    await supabase.from("achievements").insert(
      newKeys.map(key => ({ user_id: userId, achievement_key: key }))
    );
    return newKeys;
  } catch {
    return [];
  }
}

export async function getUserAchievements(): Promise<string[]> {
  await initAuth();
  const supabase = createClient();
  if (!supabase) return [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];
    const { data } = await supabase
      .from("achievements")
      .select("achievement_key")
      .eq("user_id", session.user.id);
    return (data || []).map((a: { achievement_key: string }) => a.achievement_key);
  } catch {
    return [];
  }
}
