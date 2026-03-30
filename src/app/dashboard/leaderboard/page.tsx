"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAllProfiles, getSessionsByUser } from "@/lib/data";
import { Profile } from "@/lib/types";
import { Star, Trophy } from "lucide-react";

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

  const medalColors: Record<number, { bg: string; text: string; border: string }> = {
    0: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    1: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
    2: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  };

  return (
    <main>
      {/* ─── Hero Banner ─── */}
      <section className="relative bg-navy-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Leaderboard</h1>
          <p className="mt-2 text-white/60 max-w-lg">Top peers ranked by rating and sessions completed.</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full" />
                <div className="w-11 h-11 bg-gray-100 rounded-full" />
                <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-1/3 mb-2" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 text-amber-600" />
            </div>
            <p className="text-lg font-semibold text-navy-800 mb-1">No rankings yet</p>
            <p className="text-sm text-gray-400">Complete sessions to appear on the leaderboard.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((p, i) => {
              const initials = p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              const isMe = p.id === user.id;
              const medal = medalColors[i];
              return (
                <Link key={p.id} href={`/dashboard/profile/${p.id}`}
                  className={`flex items-center gap-4 bg-white rounded-2xl border p-5 hover:shadow-lg transition-shadow ${
                    isMe ? "border-sky-300 bg-sky-50/30 ring-1 ring-sky-200" : "border-gray-200"
                  }`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    medal ? `${medal.bg} ${medal.text} border ${medal.border}` : "bg-gray-50 text-gray-400 border border-gray-200"
                  }`}>
                    {i < 3 ? (
                      <Trophy className="w-4 h-4" />
                    ) : (
                      <span>#{i + 1}</span>
                    )}
                  </div>
                  <div className="w-11 h-11 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                    {p.avatar_url ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-navy-800 truncate">{p.name}</p>
                      {isMe && <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full font-medium shrink-0">You</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{p.faculty}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {p.rating > 0 ? (
                      <p className="text-sm font-semibold text-navy-800 flex items-center gap-1 justify-end">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {p.rating.toFixed(1)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No ratings</p>
                    )}
                    <p className="text-xs text-gray-400">{p.completedCount} sessions</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
