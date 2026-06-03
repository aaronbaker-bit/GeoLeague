"use client";

import Link from "next/link";
import { Globe, BarChart3, Users, Settings, X, Flame, Trophy, Target, User } from "lucide-react";
import AuthButton from "@/components/auth/AuthButton";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  challengeNumber: number;
  streak: number;
}

export default function Header({ challengeNumber, streak }: HeaderProps) {
  const [showFriends, setShowFriends] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Globe className="w-6 h-6 text-violet-400" />
            <span className="text-lg font-bold text-white tracking-tight">GeoLeague</span>
          </Link>
          <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">#{challengeNumber}</span>
        </div>
        <div className="flex items-center gap-1">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mr-2">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-bold text-amber-400">{streak}</span>
            </div>
          )}
          <Link href="/leaderboard" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"><BarChart3 size={18} /></Link>
          <button onClick={() => setShowFriends(true)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"><Users size={18} /></button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"><Settings size={18} /></button>
          <AuthButton />
        </div>
      </header>
      <AnimatePresence>{showFriends && <FriendsModal onClose={() => setShowFriends(false)} />}</AnimatePresence>
      <AnimatePresence>{showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}</AnimatePresence>
    </>
  );
}

function FriendsModal({ onClose }: { onClose: () => void }) {
  const [friendCode, setFriendCode] = useState("");
  const [copied, setCopied] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} /> Friends</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 mb-2 block">Add Friend</label>
            <div className="flex gap-2">
              <input type="text" placeholder="Enter username or email" value={friendCode} onChange={(e) => setFriendCode(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500" />
              <button className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">Add</button>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <p className="text-sm text-violet-300 mb-2">Invite friends to GeoLeague!</p>
            <div className="flex gap-2">
              <input type="text" readOnly value="geoleague.vercel.app" className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 font-mono" />
              <button onClick={() => { navigator.clipboard.writeText("https://geoleague.vercel.app"); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">Your Friends</label>
            <div className="text-center py-8">
              <User className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">No friends yet</p>
              <p className="text-xs text-zinc-600 mt-1">Add friends to compete on daily challenges!</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState({ gamesPlayed: 0, bestScore: 0, currentStreak: 0, longestStreak: 0 });

  useEffect(() => {
    const streak = parseInt(localStorage.getItem("geoleague_streak") || "0", 10);
    const stored = localStorage.getItem("geoleague_history");
    const history: { score: number }[] = stored ? JSON.parse(stored) : [];
    const best = history.length > 0 ? Math.max(...history.map(h => h.score)) : 0;
    setStats({
      gamesPlayed: history.length || (streak > 0 ? streak : 0),
      bestScore: best,
      currentStreak: streak,
      longestStreak: parseInt(localStorage.getItem("geoleague_longest_streak") || String(streak), 10),
    });
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings size={18} /> Settings</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">Your Stats</label>
            <div className="grid grid-cols-2 gap-3">
              <StatBox icon={<Trophy size={16} />} label="Games Played" value={String(stats.gamesPlayed)} />
              <StatBox icon={<Target size={16} />} label="Best Score" value={stats.bestScore > 0 ? String(stats.bestScore) : "—"} />
              <StatBox icon={<Flame size={16} />} label="Current Streak" value={`${stats.currentStreak} days`} />
              <StatBox icon={<Flame size={16} />} label="Longest Streak" value={`${stats.longestStreak} days`} />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">How to Play</label>
            <div className="space-y-2 text-sm text-zinc-400">
              <p>📍 You get <strong className="text-white">6 locations</strong> each day</p>
              <p>🎯 <strong className="text-white">1 guess</strong> per location — drop a pin on the map</p>
              <p>💰 Up to <strong className="text-white">200 points</strong> per round (1200 max)</p>
              <p>📏 Closer guess = more points</p>
              <p>🔥 Play every day to build your streak</p>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-500 mb-3 block">About</label>
            <div className="text-sm text-zinc-500">
              <p>GeoLeague — The Wordle of Geography</p>
              <p className="mt-1">New challenge every day at midnight UTC</p>
              <p className="mt-2 text-xs text-zinc-600">v1.0.0 · Built by Ethan Riley</p>
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800">
            <button onClick={() => {
              if (confirm("Reset all local data? This clears your streak and game history.")) {
                localStorage.removeItem("geoleague_daily_v2");
                localStorage.removeItem("geoleague_streak");
                localStorage.removeItem("geoleague_last_played");
                localStorage.removeItem("geoleague_history");
                window.location.reload();
              }
            }} className="text-sm text-red-400 hover:text-red-300 transition-colors">Reset Local Data</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
      <div className="flex items-center gap-2 text-zinc-500 mb-1">{icon}<span className="text-[10px] uppercase tracking-widest">{label}</span></div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}
