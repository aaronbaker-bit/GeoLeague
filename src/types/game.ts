export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string;
  continent: string;
  category: LocationCategory;
  difficulty: Difficulty;
  hints: Hint[];
  imageUrl?: string;
}

export type LocationCategory =
  | "city"
  | "landmark"
  | "stadium"
  | "mountain"
  | "airport"
  | "island"
  | "river"
  | "national_park"
  | "historical";

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export interface Hint {
  order: number;
  type: HintType;
  value: string;
}

export type HintType =
  | "continent"
  | "region"
  | "climate"
  | "population"
  | "hemisphere"
  | "language"
  | "currency"
  | "country_outline"
  | "fun_fact";

export interface Guess {
  lat: number;
  lng: number;
  distanceKm: number;
  timestamp: number;
}

export interface GameState {
  challengeId: string;
  location: Location;
  guesses: Guess[];
  hintsRevealed: number;
  score: number;
  status: "playing" | "completed";
  startTime: number;
  endTime?: number;
}

export interface DailyChallenge {
  id: string;
  date: string;
  number: number;
  location: Location;
}

export interface ScoreBreakdown {
  distanceScore: number;
  speedBonus: number;
  guessCountBonus: number;
  hintPenalty: number;
  total: number;
}

export type HeatLevel = "fire" | "hot" | "warm" | "cool" | "cold" | "frozen";

export interface ShareResult {
  challengeNumber: number;
  score: number;
  guessCount: number;
  heatGrid: HeatLevel[];
  streak: number;
}
