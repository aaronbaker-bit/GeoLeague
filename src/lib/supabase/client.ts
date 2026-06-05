"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const TOKEN_KEY = "gl-auth-tokens";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;
let _initialized = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): any {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createSupabaseClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: false,
      persistSession: false, // We handle persistence ourselves
      autoRefreshToken: true,
    },
  });
  return _client;
}

/**
 * Initialize auth: restore session from our own localStorage,
 * or detect tokens from URL hash (OAuth redirect).
 * Must be called once on app startup.
 */
export async function initAuth(): Promise<void> {
  if (_initialized) return;
  _initialized = true;
  if (typeof window === "undefined") return;

  const supabase = createClient();
  if (!supabase) return;

  // 1. Check URL hash for OAuth redirect tokens
  const hash = window.location.hash;
  if (hash && hash.includes("access_token")) {
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!error) {
        // Save tokens ourselves
        localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token, refresh_token }));
        // Clean up URL
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }
    }
  }

  // 2. No hash — try to restore from our own localStorage
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) {
    try {
      const { access_token, refresh_token } = JSON.parse(stored);
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error || !data.session) {
        // Tokens are invalid/expired — clear them
        localStorage.removeItem(TOKEN_KEY);
      } else {
        // setSession may have refreshed the token — save the new one
        const newSession = data.session;
        localStorage.setItem(TOKEN_KEY, JSON.stringify({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
        }));
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
}

/**
 * Clear our stored tokens (call on sign out).
 */
export function clearStoredTokens(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Save current session tokens (call after token refresh).
 */
export function saveTokens(access_token: string, refresh_token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token, refresh_token }));
  }
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
