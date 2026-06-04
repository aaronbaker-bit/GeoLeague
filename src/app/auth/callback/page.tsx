"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Globe, Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = async () => {
      try {
        const supabase = createClient();
        if (!supabase) { setError("Supabase not configured"); return; }

        // Implicit flow: tokens are in the URL hash, Supabase picks them up automatically
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
          setError(error.message);
          return;
        }

        if (data.session) {
          window.location.href = "/play";
        } else {
          // Wait a moment for Supabase to process the hash
          setTimeout(async () => {
            const { data: retry } = await supabase.auth.getSession();
            if (retry.session) {
              window.location.href = "/play";
            } else {
              window.location.href = "/play";
            }
          }, 1000);
        }
      } catch (e) {
        console.error("Callback error:", e);
        setError(String(e));
      }
    };

    handle();
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
