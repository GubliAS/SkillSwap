"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSessionsByUser, getAllProfiles, getMatchScore, computeBadges, getNotifications, computeSessionStats } from "@/lib/data";
import { Session, Profile, Notification, SessionStats } from "@/lib/types";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [topMatchCount, setTopMatchCount] = useState(0);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [sessData, allProfiles, notifs] = await Promise.all([
        getSessionsByUser(user.id),
        getAllProfiles(),
        getNotifications(user.id),
      ]);
      setSessions(sessData);
      setNotifications(notifs);
      const others = allProfiles.filter((p) => p.id !== user.id);
      const matches = others.filter((p) => getMatchScore(user, p) > 0);
      setTopMatchCount(matches.length);
      setStats(computeSessionStats(sessData, user.id));
      setLoaded(true);
    };
    load();
  }, [user]);

  if (isLoading || !user) return null;

  const activeSessions = sessions.filter((s) => s.status === "accepted");
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const skillsCount = (user.skills_to_teach?.length || 0) + (user.skills_to_learn?.length || 0);
  const badges = computeBadges(sessions, user.id, user);
  const recentNotifs = notifications.slice(0, 5);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-6">
        Welcome back, {user.name.split(" ")[0]}!
      </h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Active Sessions</p>
          <p className="text-3xl font-bold text-sky-500">{loaded ? activeSessions.length : "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Skills Listed</p>
          <p className="text-3xl font-bold text-emerald-600">{skillsCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Completed Sessions</p>
          <p className="text-3xl font-bold text-violet-600">{loaded ? completedSessions.length : "—"}</p>
        </div>
      </div>

      {/* Session stats row */}
      {loaded && stats && stats.total_completed > 0 && (
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Hours Spent</p>
            <p className="text-2xl font-bold text-navy-800">{stats.total_hours}<span className="text-sm font-normal text-gray-400">h</span></p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Sessions Taught</p>
            <p className="text-2xl font-bold text-sky-600">{stats.sessions_as_teacher}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">Sessions Learned</p>
            <p className="text-2xl font-bold text-violet-600">{stats.sessions_as_learner}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-1">{stats.learning_streak > 0 ? "🔥 Learning Streak" : "Most Taught"}</p>
            <p className="text-2xl font-bold text-emerald-600">
              {stats.learning_streak > 0 ? `${stats.learning_streak}d` : stats.most_taught_skill || "—"}
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy-800 mb-4">Recent Activity</h2>
          {recentNotifs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No activity yet — book your first session to get started!
            </p>
          ) : (
            <div className="space-y-4">
              {recentNotifs.map((n) => (
                <div key={n.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? "bg-gray-300" : "bg-sky-500"}`} />
                  <div>
                    <p className="text-sm text-gray-700">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy-800 mb-4">Your Badges</h2>
          {badges.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Complete sessions to earn badges!</p>
          ) : (
            <div className="space-y-2">
              {badges.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg bg-sky-50">
                  <span className="text-xl">{b.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-navy-800">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Link href="/dashboard/explore" className="bg-navy-800 text-white rounded-xl p-6 hover:bg-navy-700 transition-colors">
          <h3 className="font-semibold mb-1">Find New Skills</h3>
          <p className="text-sm text-white/60">Browse peers and send session requests.</p>
        </Link>
        <Link href="/dashboard/matches" className="bg-sky-500 text-white rounded-xl p-6 hover:bg-sky-400 transition-colors">
          <h3 className="font-semibold mb-1">Your Matches</h3>
          <p className="text-sm text-white/60">{topMatchCount} peers match your skills.</p>
        </Link>
        <Link href="/dashboard/profile" className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-navy-800 mb-1">Update Profile</h3>
          <p className="text-sm text-gray-500">Add new skills or update availability.</p>
        </Link>
      </div>
    </main>
  );
}
