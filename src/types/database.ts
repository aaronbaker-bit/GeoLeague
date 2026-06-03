export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          elo_rating: number;
          total_games: number;
          current_streak: number;
          longest_streak: number;
          total_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          elo_rating?: number;
          total_games?: number;
          current_streak?: number;
          longest_streak?: number;
          total_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          elo_rating?: number;
          total_games?: number;
          current_streak?: number;
          longest_streak?: number;
          total_score?: number;
          updated_at?: string;
        };
      };
      daily_challenges: {
        Row: {
          id: string;
          challenge_number: number;
          date: string;
          location_id: string;
          location_name: string;
          lat: number;
          lng: number;
          country: string;
          continent: string;
          category: string;
          difficulty: string;
          hints: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_number: number;
          date: string;
          location_id: string;
          location_name: string;
          lat: number;
          lng: number;
          country: string;
          continent: string;
          category: string;
          difficulty: string;
          hints: Json;
          created_at?: string;
        };
        Update: {
          challenge_number?: number;
          date?: string;
          location_id?: string;
          location_name?: string;
          lat?: number;
          lng?: number;
        };
      };
      game_results: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          challenge_number: number;
          score: number;
          guesses: Json;
          hints_used: number;
          time_ms: number;
          best_distance_km: number;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          challenge_number: number;
          score: number;
          guesses: Json;
          hints_used: number;
          time_ms: number;
          best_distance_km: number;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          score?: number;
          guesses?: Json;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: "pending" | "accepted" | "blocked";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: "pending" | "accepted" | "blocked";
          created_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "blocked";
        };
      };
    };
    Views: {
      daily_leaderboard: {
        Row: {
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          score: number;
          guesses: Json;
          time_ms: number;
          best_distance_km: number;
          rank: number;
        };
      };
    };
    Functions: {
      submit_score: {
        Args: {
          p_challenge_id: string;
          p_challenge_number: number;
          p_score: number;
          p_guesses: Json;
          p_hints_used: number;
          p_time_ms: number;
          p_best_distance_km: number;
        };
        Returns: {
          rank: number;
          total_players: number;
          percentile: number;
        };
      };
    };
  };
}
