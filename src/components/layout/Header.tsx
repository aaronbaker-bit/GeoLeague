"use client";

import Link from "next/link";
import { Globe, BarChart3, Users, Settings, X, Flame, Trophy, Target, User, Search, UserPlus, Check, Loader2, LogOut } from "lucide-react";
import AuthButton from "@/components/auth/AuthButton";
import UsernameModal from "@/components/auth/UsernameModal";
import { useAuth } from "@/hooks/useAuth";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  challengeNumber: number;
  streak: number;
}

export default function Header({ challengeNumber, streak }: HeaderProps) {
  const [showFriends, setShowFriends] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, profile, isAuthenticated } = useAuth();

  // Show username modal if logged in but no username set
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  useEffect(() => {
    if (isAuthenticated && profile && !profile.username) {
      setShowUsernameModal(true);
    }
  }, [isAuthenticated, profile]);

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

      <AnimatePresence>
        {showFriends && <FriendsModal onClose={() => setShowFriends(false)} userId={user?.id} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} username={profile?.username} />}
      </AnimatePresence>
      <AnimatePresence>
        {showUsernameModal && user && (
          <UsernameModal userId={user.id} onComplete={() => setShowUsernameModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

interface FriendProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  friend_profile?: FriendProfile;
}

function FriendsModal({ onClose, userId }: { onClose: () => void; userId?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Load friends and pending requests
  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) { setLoading(false); return; }
    const load = async () => {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      // Get accepted friends (where I'm user_id)
      const { data: sent } = await sb.from("friendships").select("id, user_id, friend_id, status").eq("user_id", userId).eq("status", "accepted");
      // Get accepted friends (where I'm friend_id)
      const { data: received } = await sb.from("friendships").select("id, user_id, friend_id, status").eq("friend_id", userId).eq("status", "accepted");

      const allFriendIds = [
        ...(sent || []).map((f: Friendship) => f.friend_id),
        ...(received || []).map((f: Friendship) => f.user_id),
      ];

      // Fetch profiles for friends
      let friendList: Friendship[] = [];
      if (allFriendIds.length > 0) {
        const { data: profiles } = await sb.from("profiles").select("id, username, display_name, avatar_url").in("id", allFriendIds);
        const profileMap = new Map((profiles || []).map((p: FriendProfile) => [p.id, p]));
        friendList = [...(sent || []), ...(received || [])].map((f: Friendship) => ({
          ...f,
          friend_profile: profileMap.get(f.user_id === userId ? f.friend_id : f.user_id) as FriendProfile | undefined,
        }));
      }
      setFriends(friendList);

      // Get pending incoming requests
      const { data: pending } = await sb.from("friendships").select("id, user_id, friend_id, status").eq("friend_id", userId).eq("status", "pending");
      if (pending && pending.length > 0) {
        const pIds = pending.map((p: Friendship) => p.user_id);
        const { data: pProfiles } = await sb.from("profiles").select("id, username, display_name, avatar_url").in("id", pIds);
        const pMap = new Map((pProfiles || []).map((p: FriendProfile) => [p.id, p]));
        setPendingRequests(pending.map((p: Friendship) => ({ ...p, friend_profile: pMap.get(p.user_id) as FriendProfile | undefined })));
      }

      // Track already sent requests
      const { data: mySent } = await sb.from("friendships").select("friend_id").eq("user_id", userId);
      if (mySent) setSentIds(new Set(mySent.map((s: { friend_id: string }) => s.friend_id)));

      setLoading(false);
    };
    load();
  }, [userId]);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2 || !isSupabaseConfigured()) return;
    setSearching(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from("profiles").select("id, username, display_name, avatar_url").ilike("username", `%${query}%`).neq("id", userId).limit(10);
    setSearchResults(data || []);
    setSearching(false);
  }, [userId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const t = setTimeout(() => searchUsers(searchQuery), 300);
      return () => clearTimeout(t);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchUsers]);

  const sendRequest = async (friendId: string) => {
    if (!userId || !isSupabaseConfigured()) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("friendships").insert({ user_id: userId, friend_id: friendId, status: "pending" });
    setSentIds((prev) => new Set(prev).add(friendId));
  };

  const acceptRequest = async (friendshipId: string) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    setPendingRequests((prev) => prev.filter((p) => p.id !== friendshipId));
    // Refresh — quick hack
    window.location.reload();
  };

  const declineRequest = async (friendshipId: string) => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("friendships").delete().eq("id", friendshipId);
    setPendingRequests((prev) => prev.filter((p) => p.id !== friendshipId));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} /> Friends</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!userId ? (
            <div className="text-center py-8">
              <User className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-400">Sign in to add friends</p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-500 mb-2 block">Find Friends</label>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="text" placeholder="Search by @username" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500" />
                  {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />}
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                            {(user.display_name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{user.display_name}</div>
                          <div className="text-xs text-zinc-500">@{user.username}</div>
                        </div>
                        {sentIds.has(user.id) ? (
                          <span className="text-xs text-zinc-500">Sent</span>
                        ) : (
                          <button onClick={() => sendRequest(user.id)}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-xs text-white font-medium rounded-lg transition-colors flex items-center gap-1">
                            <UserPlus size={12} /> Add
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-xs text-zinc-500 mt-2">No users found for &quot;{searchQuery}&quot;</p>
                )}
              </div>

              {/* Pending requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <label className="text-xs uppercase tracking-widest text-zinc-500 mb-2 block">Friend Requests</label>
                  <div className="space-y-1">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        {req.friend_profile?.avatar_url ? (
                          <img src={req.friend_profile.avatar_url} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                            {(req.friend_profile?.display_name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{req.friend_profile?.display_name}</div>
                          <div className="text-xs text-zinc-500">@{req.friend_profile?.username}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => acceptRequest(req.id)} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors">
                            <Check size={14} className="text-white" />
                          </button>
                          <button onClick={() => declineRequest(req.id)} className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors">
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends list */}
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-500 mb-2 block">Your Friends ({friends.length})</label>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-zinc-800 rounded-xl animate-pulse" />)}
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-6">
                    <User className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
                    <p className="text-sm text-zinc-500">No friends yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Search by username above to add friends</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {friends.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                        {f.friend_profile?.avatar_url ? (
                          <img src={f.friend_profile.avatar_url} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                            {(f.friend_profile?.display_name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{f.friend_profile?.display_name}</div>
                          <div className="text-xs text-zinc-500">@{f.friend_profile?.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invite link */}
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
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SettingsModal({ onClose, username }: { onClose: () => void; username?: string | null }) {
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
          {username && (
            <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
              <div className="text-xs text-zinc-500 mb-1">Your Username</div>
              <div className="text-sm font-medium text-white">@{username}</div>
            </div>
          )}
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
              <p className="mt-2 text-xs text-zinc-600">v1.0.0 · Built by Rizla</p>
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <ForceLogoutButton />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ForceLogoutButton() {
  const [clicked, setClicked] = useState(false);

  function handleForceLogout(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setClicked(true);

    // Only clear auth-related storage — preserve game data
    try {
      localStorage.removeItem("gl-auth-tokens");
      localStorage.removeItem("geoleague-session-backup");
      Object.keys(localStorage)
        .filter(k => k.startsWith("sb-"))
        .forEach(k => localStorage.removeItem(k));
    } catch {}
    try { sessionStorage.clear(); } catch {}
    try {
      document.cookie.split(";").forEach(c => {
        const name = c.split("=")[0].trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    } catch {}

    // Supabase signout (fire and forget)
    try {
      if (isSupabaseConfigured()) {
        createClient().auth.signOut().catch(() => {});
      }
    } catch {}

    // Force navigate after short delay
    setTimeout(() => { window.location.replace("/"); }, 300);
  }

  return (
    <>
      <button
        type="button"
        onMouseDown={handleForceLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm font-medium rounded-xl border border-red-500/20 transition-colors cursor-pointer"
      >
        <LogOut size={14} /> {clicked ? "Logging out..." : "Sign Out"}
      </button>
      <p className="text-[10px] text-zinc-600 text-center">Signs you out — your game data is saved</p>
    </>
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
