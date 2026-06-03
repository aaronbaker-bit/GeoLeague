"use client";

import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, X, Mail } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthButton() {
  const { user, profile, loading, error, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithDiscord, signOut, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (isSignUp) {
      await signUpWithEmail(email, password, displayName || email.split("@")[0]);
    } else {
      await signInWithEmail(email, password);
    }
    setSubmitting(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <LogIn size={14} />Sign In
        </button>
        <AnimatePresence>
          {showAuthModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAuthModal(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">{isSignUp ? "Create Account" : "Sign In"}</h2>
                  <button onClick={() => setShowAuthModal(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                </div>
                <form onSubmit={handleEmailSubmit} className="space-y-3 mb-4">
                  {isSignUp && (
                    <input type="text" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500" />
                  )}
                  <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500" />
                  <input type="password" placeholder="Password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500" />
                  {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
                  <button type="submit" disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors">
                    <Mail size={16} />{submitting ? "..." : isSignUp ? "Create Account" : "Sign In with Email"}
                  </button>
                </form>
                <div className="text-center mb-4">
                  <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-violet-400 hover:text-violet-300">
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-zinc-800" /><span className="text-[10px] uppercase tracking-widest text-zinc-600">or</span><div className="flex-1 h-px bg-zinc-800" />
                </div>
                <div className="space-y-2">
                  <button onClick={() => { signInWithGoogle(); setShowAuthModal(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 rounded-xl transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </button>
                  <button onClick={() => { signInWithDiscord(); setShowAuthModal(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 rounded-xl transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    Continue with Discord
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full border-2 border-zinc-700" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
            {(profile?.display_name || user?.email || "?")[0].toUpperCase()}
          </div>
        )}
      </button>
      <AnimatePresence>
        {showMenu && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-56 p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50">
            <div className="px-3 py-2 border-b border-zinc-800 mb-1">
              <div className="text-sm font-medium text-white">{profile?.display_name || "Player"}</div>
              <div className="text-xs text-zinc-500">{user?.email}</div>
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                <span>ELO: <strong className="text-white">{profile?.elo_rating}</strong></span>
                <span>Games: <strong className="text-white">{profile?.total_games}</strong></span>
                <span>🔥 {profile?.current_streak}</span>
              </div>
            </div>
            <button onClick={() => { signOut(); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 rounded-lg transition-colors">
              <LogOut size={14} />Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
