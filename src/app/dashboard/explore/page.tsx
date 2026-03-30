"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { searchProfiles, getTimeSinceLastSeen, getBlockedUsers, getBlockedByUsers } from "@/lib/data";
import { Profile, FACULTIES, SKILL_CATEGORIES } from "@/lib/types";
import { Search, Star, Monitor, MapPin, Users } from "lucide-react";

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
    <main>
      {/* ─── Hero Banner ─── */}
      <section className="relative bg-navy-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Explore Skills</h1>
          <p className="mt-2 text-white/60 max-w-lg">Find peers to exchange skills with at KNUST.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Filters ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
          {/* Search row */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="Search by name, skill, or course code..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 hover:border-gray-300 transition-colors" />
            </div>
            <button onClick={doSearch} className="px-7 py-2.5 rounded-full bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors shadow-lg shadow-navy-800/25">
              Search
            </button>
          </div>
          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            <select value={faculty} onChange={(e) => { setFaculty(e.target.value); }}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white hover:border-gray-300 transition-colors">
              <option value="">All Faculties</option>
              {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={mode} onChange={(e) => { setMode(e.target.value); }}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white hover:border-gray-300 transition-colors">
              <option value="">Any Mode</option>
              <option value="online">Online</option>
              <option value="offline">In-person</option>
            </select>
            <select value={category} onChange={(e) => { setCategory(e.target.value); }}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white hover:border-gray-300 transition-colors">
              <option value="">All Categories</option>
              {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={level} onChange={(e) => { setLevel(e.target.value); }}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white hover:border-gray-300 transition-colors">
              <option value="">Any Proficiency</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select value={contentType} onChange={(e) => { setContentType(e.target.value as ContentType); }}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white hover:border-gray-300 transition-colors">
              <option value="both">Academic & Skills</option>
              <option value="academic">Academic Only</option>
              <option value="skills">Skills Only</option>
            </select>
            <select value={sort} onChange={(e) => { setSort(e.target.value as SortOption); }}
              className="px-4 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white hover:border-gray-300 transition-colors">
              <option value="best_match">Best Match</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* ─── Results ─── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gray-100" />
                  <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-2/3 mb-2" /><div className="h-2 bg-gray-100 rounded w-1/2" /></div>
                </div>
                <div className="h-2 bg-gray-100 rounded w-full mb-2" /><div className="h-2 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-sky-600" />
            </div>
            <p className="text-lg font-semibold text-navy-800 mb-1">No results found</p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">Try adjusting your filters or search query to find peers.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-5">{results.length} peer{results.length !== 1 ? "s" : ""} found</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((p) => {
                const initials = p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                const isOnline = getTimeSinceLastSeen(p.last_seen) === "Online now";
                return (
                  <Link key={p.id} href={`/dashboard/profile/${p.id}`}
                    className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow block group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="w-11 h-11 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden group-hover:scale-105 transition-transform duration-300">
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
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1.5">Can teach</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.skills_to_teach.slice(0, 3).map((s, i) => (
                            <span key={i} className="px-2.5 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">{s.name}</span>
                          ))}
                          {p.skills_to_teach.length > 3 && <span className="px-2.5 py-1 text-xs text-gray-400">+{p.skills_to_teach.length - 3}</span>}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        {p.preferred_mode === "online" || p.preferred_mode === "both" ? <Monitor className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {p.preferred_mode === "both" ? "Online & In-person" : p.preferred_mode === "online" ? "Online" : "In-person"}
                      </span>
                      {p.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {p.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
