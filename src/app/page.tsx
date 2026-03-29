'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getAllProfiles } from '@/lib/data';
import { Profile } from '@/lib/types';

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Create Profile',
    desc: 'Sign up and list the skills you can teach and the ones you want to learn.',
    icon: (
      <svg className="w-6 h-6 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    step: '2',
    title: 'Find a Skill Match',
    desc: 'Browse or search for students offering skills you want to learn.',
    icon: (
      <svg className="w-6 h-6 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: '3',
    title: 'Start Swapping',
    desc: 'Connect, schedule sessions, and begin exchanging knowledge.',
    icon: (
      <svg className="w-6 h-6 text-navy-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  {
    name: 'Priscilla Asante',
    text: 'SkillSwap connected me with a Python tutor in my own hall. We meet every Saturday and it has completely changed my understanding of programming!',
    avatar: 'PA',
  },
  {
    name: 'Daniel Mensah',
    text: 'I taught Photoshop and learned JavaScript in return. This platform makes peer learning so easy and accessible.',
    avatar: 'DM',
  },
  {
    name: 'Akua Boateng',
    text: 'The best part is that everything is free. You just swap skills with other students. No money involved!',
    avatar: 'AB',
  },
];

export default function Home() {
  const [featuredProfiles, setFeaturedProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    getAllProfiles().then((profiles) => {
      // Show profiles that have skills to teach, sorted by rating
      const withSkills = profiles
        .filter((p) => p.skills_to_teach.length > 0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
      setFeaturedProfiles(withSkills);
    });
  }, []);

  return (
    <>
      <Navbar />
      <main>
        {/* ─── Hero Section ─── */}
        <section className="relative bg-navy-800 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Exchange Skills,
                <br />
                <span className="text-sky-400">Grow Together.</span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-white/70 leading-relaxed max-w-lg">
                Connect with fellow KNUST students to teach what you know and learn what you need. Free, peer-to-peer skill exchange.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/explore"
                  className="inline-flex items-center px-7 py-3.5 rounded-full bg-sky-500 text-white font-semibold text-sm hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/25"
                >
                  Explore Skills
                </Link>
                <Link
                  href="/guide"
                  className="inline-flex items-center px-7 py-3.5 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  How It Works
                </Link>
              </div>
            </div>
          </div>

          {/* Hero image overlay on right (desktop) */}
          <div className="hidden lg:block absolute right-0 top-0 w-[45%] h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-navy-800 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
              alt="Students collaborating"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">How It Works</h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">
                Get started in three simple steps and begin your learning journey.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-navy-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Featured Skills ─── */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">Featured Skills</h2>
              <p className="mt-3 text-gray-500 max-w-md mx-auto">
                Discover skills offered by students across KNUST.
              </p>
            </div>

            {featuredProfiles.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No skills listed yet. Be the first to sign up and share your skills!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProfiles.map((p) => {
                  const initials = p.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  const topSkill = p.skills_to_teach[0];
                  return (
                    <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group">
                      <div className="relative h-44 bg-gradient-to-br from-navy-800 to-sky-600 flex items-center justify-center">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <span className="text-4xl font-bold text-white/30">{initials}</span>
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-full">
                          {topSkill?.category || "Skills"}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-semibold text-navy-800 mb-1">{topSkill?.name || "Various Skills"}</h3>
                        <p className="text-xs text-gray-400 mb-3">
                          {p.skills_to_teach.length > 1 && `+${p.skills_to_teach.length - 1} more skill${p.skills_to_teach.length > 2 ? "s" : ""}`}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-navy-800 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                              {p.avatar_url ? <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" /> : initials}
                            </div>
                            <span className="text-sm text-gray-500">{p.name}</span>
                          </div>
                          {p.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                              <span className="text-sm text-gray-500 font-medium">{p.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <Link href="/signup"
                          className="mt-4 block w-full text-center py-2.5 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors">
                          Request Swap
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-center mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center px-6 py-3 rounded-full border-2 border-navy-800 text-navy-800 font-semibold text-sm hover:bg-navy-800 hover:text-white transition-colors"
              >
                View All Skills →
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">What Students Say</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {t.avatar}
                    </div>
                    <span className="font-semibold text-navy-800">{t.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800">
              Ready To Learn Something New?
            </h2>
            <p className="mt-4 text-gray-500 max-w-md mx-auto">
              Join thousands of KNUST students already exchanging skills on the platform.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center mt-8 px-8 py-3.5 rounded-full bg-navy-800 text-white font-semibold text-sm hover:bg-navy-700 transition-colors shadow-lg shadow-navy-800/25"
            >
              Join Now
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
