"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAllProfiles, getSessionsByUser } from "@/lib/data";
import { Profile } from "@/lib/types";

export default function LeaderboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [leaders, setLeaders] = useState<(Profile & { completedCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isLoading && !user) router.push("/login"); }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const profiles = await getAllProfiles();
      const withCounts = await Promise.all(
        profiles.map(async (p) => {
          const sessions = await getSessionsByUser(p.id);
          const completedCount = sessions.filter((s) => s.status === "completed").length;
          return { ...p, completedCount };
        })
      );
      const sorted = withCounts
        .sort((a, b) => b.rating - a.rating || b.completedCount - a.completedCount)
        .slice(0, 10);
      setLeaders(sorted);
      setLoading(false);
    };
    load();
  }, [user]);

  if (isLoading || !user) return null;

  const medals: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-2">Leaderboard</h1>
      <p className="text-gray-500 mb-6">Top peers ranked by rating and sessions completed.</p>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full" />
              <div className="w-10 h-10 bg-gray-100 rounded-full" />
              <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-1/3 mb-2" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((p, i) => {
            const initials = p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const isMe = p.id === user.id;
            return (
              <Link key={p.id} href={`/dashboard/profile/${p.id}`}
                className={`flex items-center gap-4 bg-white rounded-xl border p-4 hover:shadow-md transition-shadow ${
                  isMe ? "border-sky-300 bg-sky-50/30" : "border-gray-200"
                }`}>
                <div className="w-8 text-center font-bold text-lg">
                  {medals[i] || <span className="text-sm text-gray-500">#{i + 1}</span>}
                </div>
                <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                  {p.avatar_url ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" /> : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-navy-800 truncate">{p.name}</p>
                    {isMe && <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-medium shrink-0">You</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{p.faculty}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-navy-800">
                    {p.rating > 0 ? `⭐ ${p.rating.toFixed(1)}` : "No ratings"}
                  </p>
                  <p className="text-xs text-gray-400">{p.completedCount} sessions</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
