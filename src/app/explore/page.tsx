'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getAllProfiles } from '@/lib/data';
import { Profile, SKILL_CATEGORIES } from '@/lib/types';

const CATEGORIES = ['All', ...SKILL_CATEGORIES];

export default function ExplorePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProfiles().then((data) => {
      setProfiles(data.filter((p) => p.skills_to_teach.length > 0));
      setLoading(false);
    });
  }, []);

  // Flatten profiles into skill cards
  const skillCards = profiles.flatMap((p) =>
    p.skills_to_teach.map((skill) => ({
      profileId: p.id,
      title: skill.name,
      category: skill.category || 'Other',
      level: skill.level,
      instructor: p.name,
      avatar_url: p.avatar_url,
      rating: p.rating,
    }))
  );

  const filtered = skillCards.filter((s) => {
    const matchCat = activeCategory === 'All' || s.category === activeCategory;
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.instructor.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-navy-800 py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Explore Skills</h1>
            <p className="mt-3 text-white/60 max-w-md mx-auto">
              Browse skills offered by students and find your perfect learning match.
            </p>

            {/* Search */}
            <div className="mt-8 max-w-lg mx-auto relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search skills or instructors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>
        </section>

        {/* Filters + Grid */}
        <section className="py-10 sm:py-14 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-navy-800 text-white'
                      : 'bg-white border border-gray-200 text-gray-500 hover:border-navy-800 hover:text-navy-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Skills grid */}
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                    <div className="h-40 bg-gray-100 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No skills found. Try a different filter.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((skill, idx) => {
                  const initials = skill.instructor.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={`${skill.profileId}-${skill.title}-${idx}`}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
                    >
                      <div className="relative h-40 bg-gradient-to-br from-navy-800 to-sky-600 flex items-center justify-center overflow-hidden">
                        {skill.avatar_url ? (
                          <img src={skill.avatar_url} alt={skill.instructor} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <span className="text-3xl font-bold text-white/30">{initials}</span>
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-full">
                          {skill.category}
                        </span>
                        <span className="absolute top-3 right-3 px-3 py-1 bg-white/90 text-navy-800 text-xs font-semibold rounded-full capitalize">
                          {skill.level}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-navy-800 text-sm mb-2">{skill.title}</h3>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-navy-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                              {skill.avatar_url ? <img src={skill.avatar_url} alt={skill.instructor} className="w-full h-full object-cover" /> : initials}
                            </div>
                            <span className="text-xs text-gray-500">{skill.instructor}</span>
                          </div>
                          {skill.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                              <span className="text-xs text-gray-500 font-medium">{skill.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <Link href="/signup"
                          className="block w-full py-2.5 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors text-center">
                          Request Swap
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
