"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

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
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) { setLoading(false); return; }

    const loadUser = async () => {
      try {
        const supabase = createClient();
        if (!supabase) { setLoading(false); return; }

        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);

        if (authUser) {
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();
          if (profileError) console.error("Profile fetch error:", profileError);
          if (data) setProfile(data as Profile);
        }
      } catch (e) {
        console.error("Auth error:", e);
      }
      setLoading(false);
    };
    loadUser();

    const supabase = createClient();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: { user: AuthUser } | null) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        try {
          const { data } = await supabase.from("profiles").select("*").eq("id", u.id).single();
          if (data) setProfile(data as Profile);
        } catch (e) { console.error("Profile refresh error:", e); }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!configured) return;
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }, [configured]);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    if (!configured) return;
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: displayName } },
    });
    if (error) setError(error.message);
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, [configured]);

  const signInWithDiscord = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [configured]);

  return {
    user, profile, loading, error,
    signInWithEmail, signUpWithEmail,
    signInWithGoogle, signInWithDiscord,
    signOut,
    isAuthenticated: !!user,
    isConfigured: configured,
  };
}
