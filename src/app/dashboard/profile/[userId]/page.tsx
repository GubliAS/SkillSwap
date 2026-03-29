"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getProfileById, getSessionsByUser, computeBadges, getTimeSinceLastSeen, createSession, createNotification } from "@/lib/data";
import { Profile, Session, DAYS_OF_WEEK } from "@/lib/types";
import { toast } from "sonner";
import { MessageSquare, Star, Monitor, MapPin, Calendar } from "lucide-react";

export default function PublicProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [showBook, setShowBook] = useState(false);
  const [bookSkill, setBookSkill] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookMode, setBookMode] = useState<"online" | "offline">("online");
  const [bookLocation, setBookLocation] = useState("");
  const [booking, setBooking] = useState(false);

  useEffect(() => { if (!isLoading && !user) router.push("/login"); }, [isLoading, user, router]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([getProfileById(userId), getSessionsByUser(userId)]).then(([p, s]) => {
      setProfile(p);
      setSessions(s);
      setLoading(false);
    });
  }, [userId]);

  const handleBook = async () => {
    if (!user || !profile || !bookSkill || !bookDate || !bookTime) return;
    setBooking(true);
    const isTeaching = user.skills_to_teach.some((t) => t.name.toLowerCase() === bookSkill.toLowerCase());
    const teacherId = isTeaching ? user.id : profile.id;
    const learnerId = isTeaching ? profile.id : user.id;
    const { error } = await createSession({
      teacher_id: teacherId, learner_id: learnerId, skill: bookSkill,
      date: bookDate, time: bookTime, mode: bookMode,
      location: bookMode === "offline" ? bookLocation : "",
      status: "pending", notes: "",
    });
    if (error) {
      toast.error("Failed to book session");
    } else {
      await createNotification({
        user_id: profile.id,
        type: "session_request",
        title: "New Session Request",
        message: `${user.name} wants to book a ${bookSkill} session with you`,
        link: "/dashboard/swaps",
      });
      toast.success("Session request sent!");
      setShowBook(false);
      setBookSkill(""); setBookDate(""); setBookTime(""); setBookLocation("");
    }
    setBooking(false);
  };

  if (isLoading || !user) return null;
  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </main>
    );
  }
  if (!profile) return <main className="max-w-2xl mx-auto p-8 text-center text-gray-400">User not found.</main>;

  const initials = profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const completed = sessions.filter((s) => s.status === "completed");
  const badges = computeBadges(sessions, userId, profile);
  const isOnline = getTimeSinceLastSeen(profile.last_seen) === "Online now";
  const isMe = user.id === userId;

  const allSkills = [...profile.skills_to_teach.map((s) => s.name), ...profile.skills_to_learn.map((s) => s.name)];

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" /> : initials}
            </div>
            {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-navy-800">{profile.name}</h1>
            <p className="text-sm text-gray-500">{profile.faculty}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {profile.rating > 0 && <span>⭐ {profile.rating.toFixed(1)} ({profile.total_ratings} reviews)</span>}
              <span>{completed.length} sessions completed</span>
              <span>{profile.xp} XP</span>
              <span className={isOnline ? "text-emerald-500 font-medium" : ""}>
                {getTimeSinceLastSeen(profile.last_seen)}
              </span>
            </div>
          </div>
          {!isMe && (
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => setShowBook(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-navy-800 text-white text-xs font-medium hover:bg-navy-700 transition-colors">
                <Calendar className="w-3.5 h-3.5" /> Book Session
              </button>
              <Link href={`/dashboard/messages?peer=${userId}`}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </Link>
            </div>
          )}
        </div>
        {profile.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{profile.bio}</p>}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            {profile.preferred_mode === "online" ? <Monitor className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            {profile.preferred_mode === "both" ? "Online & In-person" : profile.preferred_mode}
          </span>
          {profile.availability.length > 0 && (
            <span>Available: {profile.availability.join(", ")}</span>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Skills I Can Teach</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills_to_teach.length === 0 ? <p className="text-xs text-gray-400">None listed</p> :
              profile.skills_to_teach.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">{s.name}</span>
              ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Skills I Want to Learn</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills_to_learn.length === 0 ? <p className="text-xs text-gray-400">None listed</p> :
              profile.skills_to_learn.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">{s.name}</span>
              ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <div key={b.id} className="flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-lg">
                <span className="text-lg">{b.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-navy-800">{b.name}</p>
                  <p className="text-xs text-gray-500">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ratings */}
      {profile.total_ratings > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-2">Rating</h3>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-5 h-5 ${s <= Math.round(profile.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
              ))}
            </div>
            <span className="text-sm font-semibold text-navy-800">{profile.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({profile.total_ratings} reviews)</span>
          </div>
        </div>
      )}

      {/* Book Session Dialog */}
      {showBook && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-navy-800 mb-4">Book a Session</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Skill</label>
                <select value={bookSkill} onChange={(e) => setBookSkill(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                  <option value="">Select a skill</option>
                  {allSkills.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={bookTime} onChange={(e) => setBookTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mode</label>
                <select value={bookMode} onChange={(e) => setBookMode(e.target.value as "online" | "offline")}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                  <option value="online">Online</option>
                  <option value="offline">In-person</option>
                </select>
              </div>
              {bookMode === "offline" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={bookLocation} onChange={(e) => setBookLocation(e.target.value)}
                    placeholder="e.g. Library, Block A"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowBook(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleBook} disabled={!bookSkill || !bookDate || !bookTime || booking}
                className="flex-1 py-2 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-50">
                {booking ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
