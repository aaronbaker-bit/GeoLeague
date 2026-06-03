"use client";

import { useState, useCallback, useEffect } from "react";
import { GameState, Guess, ScoreBreakdown } from "@/types/game";
import { haversineDistance, calculateScore, getHeatLevel } from "@/lib/utils";
import { getDailyLocation } from "@/data/locations";

const MAX_GUESSES = 6;
const STORAGE_KEY = "geoleague_daily";

interface StoredGame {
  date: string;
  state: GameState;
  scoreBreakdown?: ScoreBreakdown;
}

export function useGame() {
  const { location, challengeNumber } = getDailyLocation();
  const todayKey = new Date().toISOString().split("T")[0];

  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredGame = JSON.parse(stored);
        if (parsed.date === todayKey) return parsed.state;
      }
    }
    return {
      challengeId: location.id,
      location,
      guesses: [],
      hintsRevealed: 0,
      score: 0,
      status: "playing",
      startTime: Date.now(),
    };
  });

  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(
    () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: StoredGame = JSON.parse(stored);
          if (parsed.date === todayKey && parsed.scoreBreakdown)
            return parsed.scoreBreakdown;
        }
      }
      return null;
    }
  );

  useEffect(() => {
    const data: StoredGame = {
      date: todayKey,
      state: gameState,
      scoreBreakdown: scoreBreakdown ?? undefined,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [gameState, scoreBreakdown, todayKey]);

  const makeGuess = useCallback(
    (lat: number, lng: number) => {
      if (gameState.status === "completed") return;
      if (gameState.guesses.length >= MAX_GUESSES) return;

      const distanceKm = haversineDistance(
        lat,
        lng,
        location.lat,
        location.lng
      );

      const guess: Guess = {
        lat,
        lng,
        distanceKm,
        timestamp: Date.now(),
      };

      const newGuesses = [...gameState.guesses, guess];
      const isClose = distanceKm < 50;
      const isLastGuess = newGuesses.length >= MAX_GUESSES;
      const isComplete = isClose || isLastGuess;

      const elapsedMs = Date.now() - gameState.startTime;
      const breakdown = calculateScore(
        newGuesses,
        location,
        gameState.hintsRevealed,
        elapsedMs
      );

      if (isComplete) {
        setScoreBreakdown(breakdown);
      }

      setGameState((prev) => ({
        ...prev,
        guesses: newGuesses,
        score: breakdown.total,
        status: isComplete ? "completed" : "playing",
        endTime: isComplete ? Date.now() : undefined,
      }));
    },
    [gameState, location]
  );

  const revealHint = useCallback(() => {
    if (gameState.hintsRevealed >= location.hints.length) return;
    setGameState((prev) => ({
      ...prev,
      hintsRevealed: prev.hintsRevealed + 1,
    }));
  }, [gameState.hintsRevealed, location.hints.length]);

  const streak = (() => {
    if (typeof window === "undefined") return 0;
    const stored = localStorage.getItem("geoleague_streak");
    return stored ? parseInt(stored, 10) : 0;
  })();

  useEffect(() => {
    if (gameState.status === "completed") {
      const currentStreak = localStorage.getItem("geoleague_streak");
      const lastPlayed = localStorage.getItem("geoleague_last_played");
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      if (lastPlayed === yesterday) {
        const newStreak = (parseInt(currentStreak || "0", 10) || 0) + 1;
        localStorage.setItem("geoleague_streak", String(newStreak));
      } else if (lastPlayed !== todayKey) {
        localStorage.setItem("geoleague_streak", "1");
      }
      localStorage.setItem("geoleague_last_played", todayKey);
    }
  }, [gameState.status, todayKey]);

  return {
    gameState,
    location,
    challengeNumber,
    scoreBreakdown,
    makeGuess,
    revealHint,
    maxGuesses: MAX_GUESSES,
    streak,
    remainingGuesses: MAX_GUESSES - gameState.guesses.length,
    currentHints: location.hints.slice(0, gameState.hintsRevealed),
    availableHints: location.hints.length - gameState.hintsRevealed,
  };
}
