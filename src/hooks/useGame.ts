"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Guess, Location } from "@/types/game";
import { haversineDistance } from "@/lib/utils";
import { getDailyLocations, ROUNDS_PER_DAY, POINTS_PER_ROUND, MAX_DAILY_SCORE } from "@/data/locations";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const STORAGE_KEY = "geoleague_daily_v2";

export interface RoundResult {
  location: Location;
  guess: Guess;
  score: number;
}

interface DailyState {
  date: string;
  currentRound: number;
  rounds: RoundResult[];
  totalScore: number;
  status: "playing" | "completed";
  startTime: number;
}

function scoreGuess(distanceKm: number): number {
  if (distanceKm < 10) return 200;
  if (distanceKm < 50) return 190;
  if (distanceKm < 150) return 170;
  if (distanceKm < 500) return Math.round(170 * (1 - (distanceKm - 150) / 1000));
  if (distanceKm < 2000) return Math.round(100 * (1 - (distanceKm - 500) / 3000));
  if (distanceKm < 5000) return Math.round(50 * (1 - (distanceKm - 2000) / 8000));
  return Math.max(0, Math.round(20 * (1 - distanceKm / 20000)));
}

/**
 * Save completed game results to Supabase profiles table.
 */
async function syncGameToDatabase(totalScore: number, streak: number) {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  if (!supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;

    // Get current profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_games, total_score, current_streak, longest_streak")
      .eq("id", userId)
      .single();

    if (!profile) return;

    const newTotalGames = (profile.total_games || 0) + 1;
    const newTotalScore = (profile.total_score || 0) + totalScore;
    const newLongestStreak = Math.max(profile.longest_streak || 0, streak);

    await supabase
      .from("profiles")
      .update({
        total_games: newTotalGames,
        total_score: newTotalScore,
        current_streak: streak,
        longest_streak: newLongestStreak,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  } catch (e) {
    console.error("Failed to sync game to database:", e);
  }
}

export function useGame() {
  const { locations, challengeNumber } = getDailyLocations();
  const todayKey = new Date().toISOString().split("T")[0];
  const syncedRef = useRef(false);

  const [state, setState] = useState<DailyState>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: DailyState = JSON.parse(stored);
        if (parsed.date === todayKey) return parsed;
      }
    }
    return {
      date: todayKey,
      currentRound: 0,
      rounds: [],
      totalScore: 0,
      status: "playing",
      startTime: Date.now(),
    };
  });

  // Save to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Handle game completion: update streak + sync to database
  useEffect(() => {
    if (state.status !== "completed") return;
    if (syncedRef.current) return;

    const currentStreak = localStorage.getItem("geoleague_streak");
    const lastPlayed = localStorage.getItem("geoleague_last_played");
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    let newStreak: number;
    if (lastPlayed === yesterday) {
      newStreak = (parseInt(currentStreak || "0", 10) || 0) + 1;
    } else if (lastPlayed !== todayKey) {
      newStreak = 1;
    } else {
      newStreak = parseInt(currentStreak || "1", 10);
    }

    localStorage.setItem("geoleague_streak", String(newStreak));
    localStorage.setItem("geoleague_last_played", todayKey);

    const longestStored = parseInt(localStorage.getItem("geoleague_longest_streak") || "0", 10);
    if (newStreak > longestStored) {
      localStorage.setItem("geoleague_longest_streak", String(newStreak));
    }

    try {
      const history = JSON.parse(localStorage.getItem("geoleague_history") || "[]");
      history.push({ date: todayKey, score: state.totalScore, streak: newStreak });
      localStorage.setItem("geoleague_history", JSON.stringify(history));
    } catch {}

    syncedRef.current = true;
    syncGameToDatabase(state.totalScore, newStreak);
  }, [state.status, todayKey, state.totalScore]);

  const currentLocation = locations[state.currentRound] || locations[locations.length - 1];
  const isComplete = state.status === "completed";

  const makeGuess = useCallback(
    (lat: number, lng: number) => {
      if (isComplete) return;
      if (state.currentRound >= ROUNDS_PER_DAY) return;

      const distanceKm = haversineDistance(lat, lng, currentLocation.lat, currentLocation.lng);
      const roundScore = scoreGuess(distanceKm);

      const guess: Guess = { lat, lng, distanceKm, timestamp: Date.now() };
      const result: RoundResult = { location: currentLocation, guess, score: roundScore };

      const newRounds = [...state.rounds, result];
      const newTotal = state.totalScore + roundScore;
      const nextRound = state.currentRound + 1;
      const done = nextRound >= ROUNDS_PER_DAY;

      setState((prev) => ({
        ...prev,
        currentRound: nextRound,
        rounds: newRounds,
        totalScore: newTotal,
        status: done ? "completed" : "playing",
      }));
    },
    [state, currentLocation, isComplete]
  );

  const streak = (() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem("geoleague_streak");
    return stored ? parseInt(stored, 10) : 0;
  })();

  return {
    currentRound: state.currentRound,
    totalRounds: ROUNDS_PER_DAY,
    currentLocation,
    isComplete,
    totalScore: state.totalScore,
    maxScore: MAX_DAILY_SCORE,
    pointsPerRound: POINTS_PER_ROUND,
    rounds: state.rounds,
    makeGuess,
    challengeNumber,
    streak,
    locations,
  };
}
