"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getProfileById, getSessionsByUser, computeBadges, getTimeSinceLastSeen, createSession, createNotification, getReviewsForProfile, reportUser, blockUser, computeResponseRate, voteReviewHelpful, getHelpfulVoteCounts, getUserHelpfulVotes, replyToReview, getReviewReplies } from "@/lib/data";
import { Profile, Session, DAYS_OF_WEEK, ReportReason, ReviewReply } from "@/lib/types";
import { toast } from "sonner";
import { MessageSquare, Star, Monitor, MapPin, Calendar, Clock, ShieldCheck, Phone, Flag, Ban, MoreVertical, ThumbsUp, MessageCircle } from "lucide-react";

export default function PublicProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reviews, setReviews] = useState<{ id: string; skill: string; learner_rating: number; learner_feedback: string; learner_sub_ratings: { teaching_clarity: number; patience: number; punctuality: number } | null; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseRate, setResponseRate] = useState(0);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [myHelpfulVotes, setMyHelpfulVotes] = useState<Set<string>>(new Set());
  const [reviewReplies, setReviewReplies] = useState<Record<string, ReviewReply>>({});
  const [reviewSort, setReviewSort] = useState<"recent" | "helpful">("recent");

  // Report/block state
  const [showMenu, setShowMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Reply to review state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

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
    if (!userId || !user) return;
    const load = async () => {
      const [p, s, r, rate] = await Promise.all([
        getProfileById(userId),
        getSessionsByUser(userId),
        getReviewsForProfile(userId, 20),
        computeResponseRate(userId),
      ]);
      setProfile(p);
      setSessions(s);
      setReviews(r as typeof reviews);
      setResponseRate(rate);
      if (r && r.length > 0) {
        const sessionIds = r.map((rv: { id: string }) => rv.id);
        const [counts, myVotes, replies] = await Promise.all([
          getHelpfulVoteCounts(sessionIds),
          getUserHelpfulVotes(sessionIds, user.id),
          getReviewReplies(sessionIds),
        ]);
        setHelpfulCounts(counts);
        setMyHelpfulVotes(myVotes);
        setReviewReplies(replies);
      }
      setLoading(false);
    };
    load();
  }, [userId, user]);

  const handleBook = async () => {
    if (!user || !profile || !bookSkill || !bookDate || !bookTime) return;
    setBooking(true);
    const isTeaching = user.skills_to_teach.some((t) => t.name.toLowerCase() === bookSkill.toLowerCase());
    const teacherId = isTeaching ? user.id : profile.id;
    const learnerId = isTeaching ? profile.id : user.id;
    const { error } = await createSession({
      teacher_id: teacherId, learner_id: learnerId, skill: bookSkill,
      date: bookDate, time: bookTime, mode: bookMode,
      duration: profile.session_duration_pref || 60,
      location: bookMode === "offline" ? bookLocation : "",
      status: "pending", notes: "",
    });
    if (error) {
      console.error("Session booking error:", error);
      toast.error(`Failed to book session: ${error.message}`);
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

  const handleReport = async () => {
    if (!user) return;
    setReportSubmitting(true);
    const { error } = await reportUser(user.id, userId, reportReason, reportDetails);
    setReportSubmitting(false);
    if (error) { toast.error("Failed to submit report"); return; }
    toast.success("Report submitted. We'll review it shortly.");
    setShowReportDialog(false);
    setReportReason("harassment");
    setReportDetails("");
  };

  const handleBlock = async () => {
    if (!user) return;
    if (!confirm("Block this user? They won't appear in your explore results or matches.")) return;
    const { error } = await blockUser(user.id, userId);
    if (error) { toast.error("Failed to block user"); return; }
    toast.success("User blocked");
    router.push("/dashboard/explore");
  };

  const handleHelpful = async (sessionId: string) => {
    if (!user) return;
    const { voted } = await voteReviewHelpful(sessionId, user.id);
    setHelpfulCounts((prev) => ({
      ...prev,
      [sessionId]: (prev[sessionId] || 0) + (voted ? 1 : -1),
    }));
    setMyHelpfulVotes((prev) => {
      const next = new Set(prev);
      if (voted) next.add(sessionId); else next.delete(sessionId);
      return next;
    });
  };

  const handleReplySubmit = async (sessionId: string) => {
    if (!user || !replyContent.trim()) return;
    setReplySubmitting(true);
    const { error } = await replyToReview(sessionId, user.id, replyContent.trim());
    setReplySubmitting(false);
    if (error) { toast.error("Failed to submit reply"); return; }
    setReviewReplies((prev) => ({
      ...prev,
      [sessionId]: { id: "", session_id: sessionId, teacher_id: user.id, content: replyContent.trim(), created_at: new Date().toISOString() },
    }));
    setReplyingTo(null);
    setReplyContent("");
    toast.success("Reply posted!");
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

  const allSkills = [
    ...profile.skills_to_teach.map((s) => s.name),
    ...profile.skills_to_learn.map((s) => s.name),
    ...(profile.courses_to_teach || []).map((c) => `${c.code} – ${c.name}`),
    ...(profile.courses_to_learn || []).map((c) => `${c.code} – ${c.name}`),
  ].filter((v, i, a) => a.indexOf(v) === i);

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
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{profile.name}</h1>
          <p className="mt-2 text-white/60">{profile.faculty}{profile.student_level ? ` · Level ${profile.student_level}` : ""}</p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
              {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" /> : initials}
            </div>
            {isOnline && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-navy-800">{profile.name}</h1>
            <p className="text-sm text-gray-500">{profile.faculty}{profile.student_level ? ` · Level ${profile.student_level}` : ""}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {profile.rating > 0 && <span>⭐ {profile.rating.toFixed(1)} ({profile.total_ratings} reviews)</span>}
              <span>{completed.length} sessions completed</span>
              <span>{profile.xp} XP</span>
              <span className={isOnline ? "text-emerald-500 font-medium" : ""}>
                {getTimeSinceLastSeen(profile.last_seen)}
              </span>
              {responseRate > 0 && (
                <span className={`${responseRate >= 80 ? "text-emerald-600" : responseRate >= 50 ? "text-amber-600" : "text-red-500"}`}>
                  Responds to {responseRate}% of requests
                </span>
              )}
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
              {profile.whatsapp && (
                <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-600 text-xs font-medium hover:bg-emerald-50 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-400 text-xs hover:bg-gray-50 transition-colors">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
                    <button onClick={() => { setShowMenu(false); setShowReportDialog(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                      <Flag className="w-3.5 h-3.5 text-amber-500" /> Report User
                    </button>
                    <button onClick={() => { setShowMenu(false); handleBlock(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                      <Ban className="w-3.5 h-3.5" /> Block User
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {profile.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{profile.bio}</p>}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            {profile.preferred_mode === "online" ? <Monitor className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
            {profile.preferred_mode === "both" ? "Online & In-person" : profile.preferred_mode}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {profile.session_duration_pref === 30 ? "30 min" : profile.session_duration_pref === 120 ? "2 hr" : "1 hr"} sessions
          </span>
          {profile.availability.length > 0 && (
            <span>Available: {profile.availability.join(", ")}</span>
          )}
          {(profile.email.endsWith(".knust.edu.gh") || profile.email.endsWith("st.knust.edu.gh")) && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified KNUST Student
            </span>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Skills I Can Teach</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills_to_teach.length === 0 ? <p className="text-xs text-gray-400">None listed</p> :
              profile.skills_to_teach.map((s, i) => (
                <span key={i} className="px-3 py-1.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">{s.name}</span>
              ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-navy-800 mb-3">Skills I Want to Learn</h3>
          {profile.skills_to_learn.length === 0 ? <p className="text-xs text-gray-400">None listed</p> : (
            <div className="space-y-2">
              {profile.skills_to_learn.map((s, i) => (
                <div key={i}>
                  <span className="inline-block px-3 py-1.5 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">{s.name}</span>
                  {profile.learning_goals?.[s.name] && (
                    <p className="text-xs text-gray-500 mt-1 ml-1">Goal: {profile.learning_goals[s.name]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Courses */}
      {((profile.courses_to_teach || []).length > 0 || (profile.courses_to_learn || []).length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {(profile.courses_to_teach || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-navy-800 mb-3">Courses I Can Help With</h3>
              <div className="flex flex-wrap gap-2">
                {profile.courses_to_teach.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 bg-sky-100 text-sky-700 text-xs font-medium rounded-full">
                    <span className="font-bold">{c.code}</span> – {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(profile.courses_to_learn || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-navy-800 mb-3">Courses I Need Help With</h3>
              <div className="flex flex-wrap gap-2">
                {profile.courses_to_learn.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    <span className="font-bold">{c.code}</span> – {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
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

      {/* Ratings — only shown after 3+ completed sessions per spec */}
      {profile.total_ratings >= 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-navy-800">Rating</h3>
            <div className="flex items-center gap-2">
              <select value={reviewSort} onChange={(e) => setReviewSort(e.target.value as "recent" | "helpful")}
                className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-600">
                <option value="recent">Most Recent</option>
                <option value="helpful">Most Helpful</option>
              </select>
              <span className="text-xs text-gray-400">{profile.total_ratings} reviews</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-5 h-5 ${s <= Math.round(profile.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
              ))}
            </div>
            <span className="text-lg font-bold text-navy-800">{profile.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">/ 5.0</span>
          </div>
          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="space-y-3">
              {[...reviews]
                .sort((a, b) => reviewSort === "helpful"
                  ? (helpfulCounts[b.id] || 0) - (helpfulCounts[a.id] || 0)
                  : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
                .map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= r.learner_rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{r.skill} · {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.learner_feedback && (
                    <p className="text-xs text-gray-600 italic">"{r.learner_feedback}"</p>
                  )}
                  {r.learner_sub_ratings && (
                    <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                      {r.learner_sub_ratings.teaching_clarity > 0 && <span>Clarity: {r.learner_sub_ratings.teaching_clarity}/5</span>}
                      {r.learner_sub_ratings.patience > 0 && <span>Patience: {r.learner_sub_ratings.patience}/5</span>}
                      {r.learner_sub_ratings.punctuality > 0 && <span>Punctuality: {r.learner_sub_ratings.punctuality}/5</span>}
                    </div>
                  )}
                  {/* Teacher reply */}
                  {reviewReplies[r.id] && (
                    <div className="mt-2 pl-3 border-l-2 border-sky-300 bg-sky-50 rounded-r p-2">
                      <p className="text-xs font-medium text-sky-700 mb-0.5">Teacher reply:</p>
                      <p className="text-xs text-gray-600">{reviewReplies[r.id].content}</p>
                    </div>
                  )}
                  {/* Actions: Helpful + Reply */}
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => handleHelpful(r.id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        myHelpfulVotes.has(r.id) ? "text-sky-600 font-medium" : "text-gray-400 hover:text-gray-600"
                      }`}>
                      <ThumbsUp className="w-3.5 h-3.5" /> Helpful{helpfulCounts[r.id] ? ` (${helpfulCounts[r.id]})` : ""}
                    </button>
                    {isMe && !reviewReplies[r.id] && (
                      <button onClick={() => { setReplyingTo(replyingTo === r.id ? null : r.id); setReplyContent(""); }}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                        <MessageCircle className="w-3.5 h-3.5" /> Reply
                      </button>
                    )}
                  </div>
                  {/* Reply form */}
                  {replyingTo === r.id && (
                    <div className="mt-2 flex gap-2">
                      <input value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..." className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400" />
                      <button onClick={() => handleReplySubmit(r.id)} disabled={!replyContent.trim() || replySubmitting}
                        className="px-3 py-1.5 rounded-lg bg-navy-800 text-white text-xs font-medium hover:bg-navy-700 disabled:opacity-50">
                        {replySubmitting ? "..." : "Post"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {profile.total_ratings > 0 && profile.total_ratings < 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 text-center">Rating visible after 3+ completed sessions ({profile.total_ratings}/3 so far)</p>
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
      {/* Report dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-navy-800 mb-1">Report User</h3>
            <p className="text-xs text-gray-500 mb-4">Why are you reporting {profile.name}?</p>
            <div className="space-y-3 mb-4">
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value as ReportReason)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                <option value="harassment">Harassment</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="other">Other</option>
              </select>
              <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Additional details (optional)..." rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowReportDialog(false); setReportDetails(""); }}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleReport} disabled={reportSubmitting}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50">
                {reportSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}
