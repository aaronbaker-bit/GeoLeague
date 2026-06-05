"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  useEffect(() => {
    // With implicit flow, tokens are in the hash.
    // createClient() with detectSessionInUrl handles it automatically.
    // Just redirect to /play and let that page pick up the session.
    const supabase = createClient();
    if (supabase) {
      // Give the client a moment to detect the hash tokens
      setTimeout(() => {
        window.location.replace("/play");
      }, 1000);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
    </div>
  );
}
