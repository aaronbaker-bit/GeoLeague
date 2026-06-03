"use client";

import { useState, useCallback, useEffect } from "react";
import { Guess, Location } from "@/types/game";
import { haversineDistance } from "@/lib/utils";
import { getDailyLocations, ROUNDS_PER_DAY, POINTS_PER_ROUND, MAX_DAILY_SCORE } from "@/data/locations";

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

export function useGame() {
  const { locations, challengeNumber } = getDailyLocations();
  const todayKey = new Date().toISOString().split("T")[0];

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (state.status === "completed") {
      const currentStreak = localStorage.getItem("geoleague_streak");
      const lastPlayed = localStorage.getItem("geoleague_last_played");
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      if (lastPlayed === yesterday) {
        const newStreak = (parseInt(currentStreak || "0", 10) || 0) + 1;
        localStorage.setItem("geoleague_streak", String(newStreak));
      } else if (lastPlayed !== todayKey) {
        localStorage.setItem("geoleague_streak", "1");
      }
      localStorage.setItem("geoleague_last_played", todayKey);
    }
  }, [state.status, todayKey]);

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
