"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAllProfiles, getMatchScore, getTimeSinceLastSeen } from "@/lib/data";
import { Profile } from "@/lib/types";

type Tab = "mutual" | "teach" | "learn";

export default function MatchesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("mutual");

  useEffect(() => { if (!isLoading && !user) router.push("/login"); }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    getAllProfiles().then((profiles) => {
      setAllProfiles(profiles.filter((p) => p.id !== user.id));
      setLoading(false);
    });
  }, [user]);

  if (isLoading || !user) return null;

  const withScores = allProfiles
    .map((p) => ({ profile: p, score: getMatchScore(user, p) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const mutual = withScores.filter(({ profile: p }) =>
    user.skills_to_learn.some((l) => p.skills_to_teach.some((t) => t.name.toLowerCase() === l.name.toLowerCase())) &&
    user.skills_to_teach.some((t) => p.skills_to_learn.some((l) => l.name.toLowerCase() === t.name.toLowerCase()))
  );
  const canTeach = withScores.filter(({ profile: p }) =>
    p.skills_to_teach.some((t) => user.skills_to_learn.some((l) => l.name.toLowerCase() === t.name.toLowerCase()))
  );
  const canLearn = withScores.filter(({ profile: p }) =>
    p.skills_to_learn.some((l) => user.skills_to_teach.some((t) => t.name.toLowerCase() === l.name.toLowerCase()))
  );

  const lists: Record<Tab, typeof withScores> = { mutual, teach: canTeach, learn: canLearn };
  const current = lists[activeTab];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "mutual", label: "Mutual Match", count: mutual.length },
    { key: "teach", label: "Can Teach You", count: canTeach.length },
    { key: "learn", label: "Can Learn From You", count: canLearn.length },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-2">Your Matches</h1>
      <p className="text-gray-500 mb-6">Peers whose skills complement yours.</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === t.key ? "bg-navy-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100" />
                <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-1/2 mb-2" /><div className="h-2 bg-gray-100 rounded w-1/3" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : current.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium text-navy-800 mb-1">No matches yet</p>
          <p className="text-sm">Add more skills to your profile to find matches.</p>
          <Link href="/dashboard/profile" className="mt-4 inline-block px-4 py-2 rounded-lg bg-navy-800 text-white text-sm font-medium hover:bg-navy-700 transition-colors">
            Update Profile
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {current.map(({ profile: p, score }) => {
            const initials = p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const isOnline = getTimeSinceLastSeen(p.last_seen) === "Online now";
            const sharedTeach = p.skills_to_teach.filter((t) =>
              user.skills_to_learn.some((l) => l.name.toLowerCase() === t.name.toLowerCase())
            );
            const sharedLearn = p.skills_to_learn.filter((l) =>
              user.skills_to_teach.some((t) => t.name.toLowerCase() === l.name.toLowerCase())
            );
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 bg-navy-800 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                      {p.avatar_url ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" /> : initials}
                    </div>
                    {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-navy-800 truncate">{p.name}</p>
                      <span className="text-xs text-sky-600 font-semibold bg-sky-50 px-2 py-0.5 rounded-full shrink-0 ml-2">
                        {score} pts
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{p.faculty}</p>
                    {p.rating > 0 && <p className="text-xs text-gray-400">⭐ {p.rating.toFixed(1)} · {p.preferred_mode}</p>}
                  </div>
                </div>
                {sharedTeach.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-500 mb-1">Can teach you</p>
                    <div className="flex flex-wrap gap-1">
                      {sharedTeach.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full">{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {sharedLearn.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Wants to learn</p>
                    <div className="flex flex-wrap gap-1">
                      {sharedLearn.slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href={`/dashboard/profile/${p.id}`} className="flex-1 text-center py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    View Profile
                  </Link>
                  <Link href={`/dashboard/messages?peer=${p.id}`} className="flex-1 text-center py-1.5 rounded-lg bg-navy-800 text-white text-xs font-medium hover:bg-navy-700 transition-colors">
                    Message
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
