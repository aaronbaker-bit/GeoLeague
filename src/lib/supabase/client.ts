"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createSupabaseClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: false, // We handle this manually
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });
  return _client;
}

/**
 * Manually detect and set session from URL hash (implicit flow).
 * Call this once on app load. Returns true if a session was found in the hash.
 */
export async function detectAndSetSessionFromHash(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const hash = window.location.hash;
  if (!hash || !hash.includes("access_token")) return false;

  // Parse hash params
  const params = new URLSearchParams(hash.substring(1));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");

  if (!access_token || !refresh_token) return false;

  const supabase = createClient();
  if (!supabase) return false;

  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  // Clear the hash from the URL to avoid re-processing
  if (!error) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  return !error;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
