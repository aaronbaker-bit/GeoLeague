import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { HeatLevel, ScoreBreakdown, Guess, Location } from "@/types/game";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function getHeatLevel(distanceKm: number): HeatLevel {
  if (distanceKm < 50) return "fire";
  if (distanceKm < 200) return "hot";
  if (distanceKm < 500) return "warm";
  if (distanceKm < 1500) return "cool";
  if (distanceKm < 5000) return "cold";
  return "frozen";
}

export function getHeatEmoji(heat: HeatLevel): string {
  const map: Record<HeatLevel, string> = {
    fire: "🔥",
    hot: "🟥",
    warm: "🟧",
    cool: "🟨",
    cold: "🟦",
    frozen: "⬜",
  };
  return map[heat];
}

export function getHeatLabel(heat: HeatLevel): string {
  const map: Record<HeatLevel, string> = {
    fire: "RIGHT ON TARGET!",
    hot: "Very Hot!",
    warm: "Getting Warm",
    cool: "Cool",
    cold: "Cold",
    frozen: "Ice Cold",
  };
  return map[heat];
}

export function calculateScore(
  guesses: Guess[],
  location: Location,
  hintsUsed: number,
  elapsedMs: number
): ScoreBreakdown {
  const bestGuess = guesses.reduce(
    (best, g) => (g.distanceKm < best.distanceKm ? g : best),
    guesses[0]
  );

  const maxDistance = 20000;
  const distanceScore = Math.max(
    0,
    Math.round(750 * (1 - bestGuess.distanceKm / maxDistance))
  );

  const guessCountBonus =
    guesses.length === 1
      ? 150
      : guesses.length === 2
        ? 100
        : guesses.length === 3
          ? 50
          : 0;

  const elapsedSec = elapsedMs / 1000;
  const speedBonus =
    elapsedSec < 15
      ? 100
      : elapsedSec < 30
        ? 75
        : elapsedSec < 60
          ? 50
          : elapsedSec < 120
            ? 25
            : 0;

  const hintPenalty = hintsUsed * 25;

  const total = Math.max(
    0,
    Math.min(1000, distanceScore + guessCountBonus + speedBonus - hintPenalty)
  );

  return {
    distanceScore,
    speedBonus,
    guessCountBonus,
    hintPenalty,
    total,
  };
}

export function generateShareText(
  challengeNumber: number,
  score: number,
  guesses: Guess[],
  streak: number
): string {
  const heatGrid = guesses
    .map((g) => getHeatEmoji(getHeatLevel(g.distanceKm)))
    .join("");

  return [
    `🌍 GeoLeague #${challengeNumber}`,
    "",
    heatGrid,
    "",
    `${score}/1000 · ${guesses.length} guess${guesses.length !== 1 ? "es" : ""}`,
    streak > 1 ? `🔥 ${streak} day streak` : "",
    "",
    "geoleague.gg",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 100) return `${km.toFixed(1)}km`;
  return `${Math.round(km).toLocaleString()}km`;
}

export function getDailyChallengeNumber(): number {
  const start = new Date("2025-01-01").getTime();
  const now = new Date().getTime();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
}
