"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Globe, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The Supabase client with detectSessionInUrl:true will automatically
    // parse the #access_token from the URL hash and store the session.
    // We just need to create the client and wait for onAuthStateChange.
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase not configured");
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string) => {
        if (event === "SIGNED_IN") {
          // Session is now stored — redirect
          window.location.href = "/play";
        }
      }
    );

    // Fallback: if already signed in or hash was already processed
    setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.href = "/play";
      }
    }, 2000);

    return () => subscription.unsubscribe();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Globe className="w-10 h-10 mx-auto text-red-400 mb-4" />
          <h1 className="text-lg font-bold text-white mb-2">Sign in failed</h1>
          <p className="text-sm text-zinc-400 mb-4 max-w-sm">{error}</p>
          <a href="/" className="text-violet-400 hover:text-violet-300 text-sm">Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <Loader2 className="w-8 h-8 mx-auto text-violet-400 animate-spin mb-4" />
        <p className="text-sm text-zinc-400">Signing you in...</p>
      </div>
    </div>
  );
}
