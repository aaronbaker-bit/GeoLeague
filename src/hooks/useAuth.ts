"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseRef = useRef(getSupabase());

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase) { setLoading(false); return; }

    let mounted = true;

    const loadUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user as AuthUser);
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (mounted && data) setProfile(data as Profile);
        }
      } catch (e) {
        console.error("useAuth load error:", e);
      }
      if (mounted) setLoading(false);
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: unknown) => {
        if (!mounted) return;
        const s = session as { user: AuthUser } | null;
        const u = s?.user ?? null;
        setUser(u);
        if (u) {
          try {
            const { data } = await supabase.from("profiles").select("*").eq("id", u.id).single();
            if (mounted && data) setProfile(data as Profile);
          } catch {}
        } else {
          setProfile(null);
        }
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: displayName } },
    });
    if (error) setError(error.message);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signInWithDiscord = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
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
