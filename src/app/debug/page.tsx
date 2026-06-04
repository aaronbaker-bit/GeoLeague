"use client";

import { useEffect, useState } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export default function DebugPage() {
  const [info, setInfo] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const result: Record<string, unknown> = {};

      result.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET";
      result.anonKeyPresent = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      result.anonKeyLength = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0;

      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createSupabaseClient(url, key, {
          auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true },
        });
        result.clientCreated = true;

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        result.session = sessionData.session ? {
          userId: sessionData.session.user.id,
          email: sessionData.session.user.email,
          provider: sessionData.session.user.app_metadata?.provider,
          metadata: sessionData.session.user.user_metadata,
          expiresAt: sessionData.session.expires_at,
        } : null;
        result.sessionError = sessionError?.message || null;

        const { data: userData, error: userError } = await supabase.auth.getUser();
        result.user = userData.user ? {
          id: userData.user.id,
          email: userData.user.email,
          metadata: userData.user.user_metadata,
        } : null;
        result.userError = userError?.message || null;

        if (userData.user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userData.user.id)
            .single();
          result.profile = profile;
          result.profileError = profileError?.message || null;
        }

        const lsKeys = Object.keys(localStorage).filter(k => k.startsWith("sb-") || k.startsWith("geoleague"));
        result.localStorageKeys = lsKeys;

      } catch (e) {
        result.clientError = String(e);
      }

      setInfo(result);
      setLoading(false);
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <h1 className="text-2xl font-bold text-white mb-6">GeoLeague Auth Debug</h1>
      {loading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : (
        <pre className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-sm text-green-400 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(info, null, 2)}
        </pre>
      )}
      <div className="mt-6 space-x-4">
        <a href="/" className="text-violet-400 hover:text-violet-300 text-sm">Home</a>
        <button onClick={() => window.location.reload()} className="text-violet-400 hover:text-violet-300 text-sm">Refresh</button>
      </div>
    </div>
  );
}
