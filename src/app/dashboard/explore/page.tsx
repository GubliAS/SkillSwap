"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { searchProfiles, getTimeSinceLastSeen, getBlockedUsers, getBlockedByUsers } from "@/lib/data";
import { Profile, FACULTIES, SKILL_CATEGORIES } from "@/lib/types";
import { Search } from "lucide-react";

type SortOption = "best_match" | "highest_rated" | "newest";
type ContentType = "both" | "academic" | "skills";

export default function ExplorePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [faculty, setFaculty] = useState("");
  const [mode, setMode] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState<SortOption>("best_match");
  const [contentType, setContentType] = useState<ContentType>("both");
  const [results, setResults] = useState<Profile[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!isLoading && !user) router.push("/login"); }, [isLoading, user, router]);

  // Load blocked user IDs on mount
  useEffect(() => {
    if (!user) return;
    Promise.all([getBlockedUsers(user.id), getBlockedByUsers(user.id)]).then(([blocked, blockedBy]) => {
      setBlockedIds(new Set([...blocked, ...blockedBy]));
    });
  }, [user]);

  const doSearch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const profiles = await searchProfiles(query, {
      faculty: faculty || undefined,
      mode: mode || undefined,
      category: category || undefined,
      level: level || undefined,
      contentType: contentType === "both" ? undefined : contentType,
      sort,
      currentUser: user,
    });
    // Filter out: self, blocked users, and dept-only profiles from other faculties
    setResults(profiles.filter((p) =>
      p.id !== user.id &&
      !blockedIds.has(p.id) &&
      (p.profile_visibility !== "department" || p.faculty === user.faculty)
    ));
    setLoading(false);
  }, [query, faculty, mode, category, level, sort, contentType, user, blockedIds]);

  useEffect(() => { if (user) doSearch(); }, [user, doSearch]);

  if (isLoading || !user) return null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-2">Explore Skills</h1>
      <p className="text-gray-500 mb-6">Find peers to exchange skills with at KNUST.</p>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search by name, skill, or course code..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
        <select value={faculty} onChange={(e) => setFaculty(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
          <option value="">All Faculties</option>
          {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
          <option value="">Any Mode</option>
          <option value="online">Online</option>
          <option value="offline">In-person</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
          <option value="">All Categories</option>
          {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
          <option value="">Any Proficiency</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select value={contentType} onChange={(e) => setContentType(e.target.value as ContentType)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
          <option value="both">Academic & Skills</option>
          <option value="academic">Academic Only</option>
          <option value="skills">Skills Only</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
          <option value="best_match">Best Match</option>
          <option value="highest_rated">Highest Rated</option>
          <option value="newest">Newest</option>
        </select>
        <button onClick={doSearch} className="px-4 py-2 rounded-lg bg-navy-800 text-white text-sm font-medium hover:bg-navy-700 transition-colors">
          Search
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100" />
                <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-2/3 mb-1" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
              </div>
              <div className="h-2 bg-gray-100 rounded w-full mb-1" /><div className="h-2 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium text-navy-800 mb-1">No results found</p>
          <p className="text-sm">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{results.length} peer{results.length !== 1 ? "s" : ""} found</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((p) => {
              const initials = p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              const isOnline = getTimeSinceLastSeen(p.last_seen) === "Online now";
              return (
                <Link key={p.id} href={`/dashboard/profile/${p.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow block">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                        {p.avatar_url ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" /> : initials}
                      </div>
                      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-800 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">{p.faculty}{p.student_level ? ` · L${p.student_level}` : ""}</p>
                    </div>
                  </div>
                  {p.skills_to_teach.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Can teach</p>
                      <div className="flex flex-wrap gap-1">
                        {p.skills_to_teach.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full">{s.name}</span>
                        ))}
                        {p.skills_to_teach.length > 3 && <span className="text-xs text-gray-400">+{p.skills_to_teach.length - 3}</span>}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span>{p.preferred_mode === "both" ? "Online & In-person" : p.preferred_mode}</span>
                    {p.rating > 0 && <span>⭐ {p.rating.toFixed(1)}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
