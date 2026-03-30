"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAllProfiles, getMatchScore, getTimeSinceLastSeen } from "@/lib/data";
import { Profile } from "@/lib/types";
import { Users, Star, MessageSquare, UserPlus } from "lucide-react";

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
    <main>
      {/* ─── Hero Banner ─── */}
      <section className="relative bg-navy-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Your Matches</h1>
          <p className="mt-2 text-white/60 max-w-lg">Peers whose skills complement yours.</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Tabs ─── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === t.key
                  ? "bg-navy-800 text-white shadow-lg shadow-navy-800/25"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-navy-800"
              }`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* ─── Results ─── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100" />
                  <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-1/2 mb-2" /><div className="h-2 bg-gray-100 rounded w-1/3" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : current.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-sky-600" />
            </div>
            <p className="text-lg font-semibold text-navy-800 mb-1">No matches yet</p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">Add more skills to your profile to find peers who complement your abilities.</p>
            <Link href="/dashboard/profile" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors shadow-lg shadow-navy-800/25">
              <UserPlus className="w-4 h-4" /> Update Profile
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
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
                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 bg-navy-800 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                        {p.avatar_url ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" /> : initials}
                      </div>
                      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-navy-800 truncate">{p.name}</p>
                        <span className="text-xs text-sky-600 font-semibold bg-sky-100 px-3 py-1 rounded-full shrink-0 ml-2">
                          {score} pts
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{p.faculty}</p>
                      {p.rating > 0 && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {p.rating.toFixed(1)} · {p.preferred_mode}
                        </p>
                      )}
                    </div>
                  </div>
                  {sharedTeach.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Can teach you</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sharedTeach.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2.5 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sharedLearn.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Wants to learn</p>
                      <div className="flex flex-wrap gap-1.5">
                        {sharedLearn.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">{s.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Link href={`/dashboard/profile/${p.id}`} className="flex-1 text-center py-2 rounded-full border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                      View Profile
                    </Link>
                    <Link href={`/dashboard/messages?peer=${p.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-navy-800 text-white text-xs font-medium hover:bg-navy-700 transition-colors shadow-lg shadow-navy-800/25">
                      <MessageSquare className="w-3 h-3" /> Message
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
