"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Globe, Check, X, Loader2 } from "lucide-react";

interface UsernameModalProps {
  userId: string;
  onComplete: (username: string) => void;
}

export default function UsernameModal({ userId, onComplete }: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = async (name: string) => {
    if (name.length < 3) { setAvailable(null); return; }
    setChecking(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from("profiles").select("id").eq("username", name).maybeSingle();
    setAvailable(!data || data.id === userId);
    setChecking(false);
  };

  const handleChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(clean);
    setAvailable(null);
    setError(null);
    if (clean.length >= 3) {
      setTimeout(() => checkAvailability(clean), 400);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!available || username.length < 3) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any).from("profiles").update({ username }).eq("id", userId);
    if (err) {
      setError(err.message.includes("unique") ? "Username already taken" : err.message);
      setSaving(false);
    } else {
      onComplete(username);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <Globe className="w-10 h-10 mx-auto text-violet-400 mb-3" />
          <h2 className="text-lg font-bold text-white">Choose your username</h2>
          <p className="text-sm text-zinc-500 mt-1">This is how friends will find you</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
            <input type="text" placeholder="username" value={username} onChange={(e) => handleChange(e.target.value)}
              className="w-full pl-9 pr-10 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500" autoFocus />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking && <Loader2 size={16} className="text-zinc-500 animate-spin" />}
              {!checking && available === true && <Check size={16} className="text-emerald-400" />}
              {!checking && available === false && <X size={16} className="text-red-400" />}
            </div>
          </div>
          {username.length > 0 && username.length < 3 && <p className="text-xs text-zinc-500">At least 3 characters</p>}
          {available === false && <p className="text-xs text-red-400">Username already taken</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={!available || saving || username.length < 3}
            className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium rounded-xl transition-colors">
            {saving ? "Saving..." : "Set Username"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
