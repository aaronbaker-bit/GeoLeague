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

  // Explicitly pass localStorage to ensure persistence works in Next.js
  const storage = typeof window !== "undefined" ? window.localStorage : undefined;

  _client = createSupabaseClient(url, key, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      storage,
    },
  });

  // Belt & suspenders: manually persist session on auth state changes
  // This catches cases where Supabase's built-in persistence silently fails
  if (typeof window !== "undefined") {
    _client.auth.onAuthStateChange(
      (event: string, session: { access_token: string; refresh_token: string } | null) => {
        if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
          try {
            localStorage.setItem("geoleague-session-backup", JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }));
          } catch {}
        }
        if (event === "SIGNED_OUT") {
          try { localStorage.removeItem("geoleague-session-backup"); } catch {}
        }
      }
    );
  }

  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
