"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    const supabase = createClient();

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setProfile(data);
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
    else setError(null);
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

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!configured || !user) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("profiles").update(updates).eq("id", user.id);
    setProfile((prev) => prev ? { ...prev, ...updates } : null);
  }, [configured, user]);

  return {
    user, profile, loading, error,
    signInWithEmail, signUpWithEmail,
    signInWithGoogle, signInWithDiscord,
    signOut, updateProfile,
    isAuthenticated: !!user,
    isConfigured: configured,
  };
}
