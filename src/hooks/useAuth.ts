"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient, isSupabaseConfigured, initAuth, clearStoredTokens, saveTokens } from "@/lib/supabase/client";

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  elo_rating: number;
  total_games: number;
  current_streak: number;
  longest_streak: number;
  total_score: number;
}

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, string>;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    const supabase = createClient();
    let mounted = true;

    const loadProfile = async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (mounted && data) setProfile(data as Profile);
      } catch {}
    };

    const startup = async () => {
      // Initialize auth (restores from localStorage or detects hash tokens)
      await initAuth();

      // Now get the session — it's guaranteed to be set if tokens were valid
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user as AuthUser);
        loadProfile(session.user.id);
      }
      setLoading(false);
    };

    startup();

    // Listen for auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: unknown) => {
        if (!mounted) return;
        const s = session as { user: AuthUser; access_token: string; refresh_token: string } | null;
        const u = s?.user ?? null;
        setUser(u);

        if (u && s) {
          // Save refreshed tokens
          saveTokens(s.access_token, s.refresh_token);
          loadProfile(u.id);
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
          clearStoredTokens();
        }
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    const supabase = createClient();
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: displayName } },
    });
    if (error) setError(error.message);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/play` },
    });
  }, []);

  const signInWithDiscord = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/play` },
    });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    clearStoredTokens();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return {
    user, profile, loading, error,
    signInWithEmail, signUpWithEmail,
    signInWithGoogle, signInWithDiscord,
    signOut,
    isAuthenticated: !!user,
  };
}
