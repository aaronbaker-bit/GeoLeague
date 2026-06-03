"use client";

import Link from "next/link";
import { Globe, BarChart3, Users, Settings } from "lucide-react";
import AuthButton from "@/components/auth/AuthButton";

interface HeaderProps {
  challengeNumber: number;
  streak: number;
}

export default function Header({ challengeNumber, streak }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Globe className="w-6 h-6 text-violet-400" />
          <span className="text-lg font-bold text-white tracking-tight">
            GeoLeague
          </span>
        </Link>
        <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
          #{challengeNumber}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {streak > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mr-2">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-bold text-amber-400">{streak}</span>
          </div>
        )}
        <Link href="/leaderboard" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200">
          <BarChart3 size={18} />
        </Link>
        <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200">
          <Users size={18} />
        </button>
        <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200">
          <Settings size={18} />
        </button>
        <AuthButton />
      </div>
    </header>
  );
}
