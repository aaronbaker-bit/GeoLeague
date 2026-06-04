"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Globe } from "lucide-react";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase not configured");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(
        ({ error: err }: { error: { message: string } | null }) => {
          if (err) {
            console.error("Auth callback error:", err.message);
            setError(err.message);
          } else {
            window.location.href = "/play";
          }
        }
      );
    } else {
      supabase.auth.getUser().then(({ data }: { data: { user: unknown } }) => {
        if (data.user) {
          window.location.href = "/play";
        } else {
          setError("No authentication code found");
        }
      });
    }
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
