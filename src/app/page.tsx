"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Globe,
  MapPin,
  Trophy,
  Users,
  Flame,
  Clock,
  ChevronRight,
  Zap,
  Target,
  Share2,
} from "lucide-react";
import { getDailyLocation } from "@/data/locations";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

export default function LandingPage() {
  const { challengeNumber } = getDailyLocation();
  const countdown = useCountdown();

  const [streak, setStreak] = useState(0);
  useEffect(() => {
    const s = localStorage.getItem("geoleague_streak");
    if (s) setStreak(parseInt(s, 10));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header challengeNumber={challengeNumber} streak={streak} />
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center max-w-2xl"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="relative">
              <Globe className="w-12 h-12 text-violet-400" />
              <div className="absolute inset-0 w-12 h-12 bg-violet-400/20 rounded-full blur-xl" />
            </div>
            <span className="text-4xl font-black text-white tracking-tight">
              GeoLeague
            </span>
          </motion.div>

          {/* Tagline */}
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.1] mb-4">
            The{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Wordle
            </span>{" "}
            of Geography
          </h1>

          <p className="text-lg text-zinc-400 max-w-md mx-auto mb-10 leading-relaxed">
            One secret location. Every day. Guess where in the world it is, compete
            with friends, and climb the ranks.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/play">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-violet-600/25 transition-colors"
              >
                <Zap size={20} />
                Play Daily #{challengeNumber}
                <ChevronRight size={18} />
              </motion.button>
            </Link>
          </div>

          {/* Live stats */}
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span className="font-mono tabular-nums">{countdown}</span>
              <span>remaining</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5">
                <Flame size={14} className="text-amber-500" />
                <span className="text-amber-400 font-bold">{streak}</span>
                <span>day streak</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* How it works */}
      <div className="border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm font-bold uppercase tracking-widest text-zinc-500 mb-10"
          >
            How it works
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StepCard
              step={1}
              icon={<MapPin size={20} />}
              title="Drop Your Pin"
              description="Click anywhere on the map to guess the secret location. You get 6 attempts to zero in."
              delay={0}
            />
            <StepCard
              step={2}
              icon={<Target size={20} />}
              title="Get Feedback"
              description="Each guess shows hot/cold distance feedback and reveals progressive hints to help narrow it down."
              delay={0.1}
            />
            <StepCard
              step={3}
              icon={<Share2 size={20} />}
              title="Share & Compete"
              description="Compare your score with friends, share your results, and climb the daily leaderboard."
              delay={0.2}
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FeatureChip icon={<Flame size={16} />} label="Daily Streaks" />
            <FeatureChip icon={<Trophy size={16} />} label="Ranked Leagues" />
            <FeatureChip icon={<Users size={16} />} label="Friend Rooms" />
            <FeatureChip icon={<Globe size={16} />} label="200+ Locations" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-violet-500" />
            <span>GeoLeague</span>
          </div>
          <span>A new challenge every day at midnight UTC</span>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
  delay,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/10 text-violet-400">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          Step {step}
        </span>
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function FeatureChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
      <div className="text-violet-400">{icon}</div>
      <span className="text-sm font-medium text-zinc-300">{label}</span>
    </div>
  );
}
