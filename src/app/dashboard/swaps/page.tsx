"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSessionsByUser, updateSession, getProfileById, createNotification } from "@/lib/data";
import { Session, Profile } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Star, MessageSquare, Monitor, MapPin } from "lucide-react";

type Tab = "upcoming" | "pending" | "completed" | "cancelled";

export default function SwapsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profileCache, setProfileCache] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [isLoading, user, router]);

  const fetchSessions = async () => {
    if (!user) return;
    const data = await getSessionsByUser(user.id);
    setSessions(data);
    const ids = new Set<string>();
    data.forEach((s) => { ids.add(s.teacher_id); ids.add(s.learner_id); });
    ids.delete(user.id);
    const profiles: Record<string, Profile> = { ...profileCache };
    for (const id of ids) {
      if (!profiles[id]) {
        const p = await getProfileById(id);
        if (p) profiles[id] = p;
      }
    }
    setProfileCache(profiles);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, [user]);

  const handleAccept = async (session: Session) => {
    await updateSession(session.id, { status: "accepted" });
    await createNotification({
      user_id: session.learner_id,
      type: "session_accepted",
      title: "Session Accepted",
      message: `Your ${session.skill} session has been accepted!`,
      link: "/dashboard/swaps",
    });
    toast.success("Session accepted!");
    fetchSessions();
  };

  const handleCancel = async (session: Session) => {
    await updateSession(session.id, { status: "cancelled" });
    const otherUserId = session.teacher_id === user!.id ? session.learner_id : session.teacher_id;
    await createNotification({
      user_id: otherUserId,
      type: "session_cancelled",
      title: "Session Cancelled",
      message: `Your ${session.skill} session has been cancelled.`,
      link: "/dashboard/swaps",
    });
    toast.info("Session cancelled");
    fetchSessions();
  };

  const handleComplete = async (session: Session) => {
    await updateSession(session.id, { status: "completed" });
    // Award XP to both participants
    const teacher = profileCache[session.teacher_id];
    const learner = profileCache[session.learner_id];
    if (teacher) {
      await import("@/lib/data").then(({ updateProfile }) =>
        updateProfile(session.teacher_id, { xp: (teacher.xp || 0) + 50 })
      );
    }
    if (learner) {
      await import("@/lib/data").then(({ updateProfile }) =>
        updateProfile(session.learner_id, { xp: (learner.xp || 0) + 50 })
      );
    }
    toast.success("Session marked as complete! +50 XP each");
    fetchSessions();
    setSelectedSession(session);
    setShowRateDialog(true);
  };

  const handleRate = async () => {
    if (!selectedSession || !user || rating === 0) return;
    const isTeacher = selectedSession.teacher_id === user.id;
    const updates: Partial<Session> = isTeacher
      ? { teacher_rating: rating, teacher_feedback: feedback }
      : { learner_rating: rating, learner_feedback: feedback };
    await updateSession(selectedSession.id, updates);
    toast.success("Rating submitted!");
    setShowRateDialog(false);
    setRating(0);
    setFeedback("");
    setSelectedSession(null);
    fetchSessions();
  };

  if (isLoading || !user) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "pending", label: "Pending" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const filtered = sessions.filter((s) => {
    if (activeTab === "upcoming") return s.status === "accepted";
    return s.status === activeTab;
  });

  const badgeColor: Record<Session["status"], string> = {
    pending: "bg-amber-100 text-amber-700",
    accepted: "bg-emerald-100 text-emerald-700",
    completed: "bg-sky-100 text-sky-700",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-navy-800 mb-2">My Sessions</h1>
      <p className="text-gray-500 mb-6">Track your active and completed skill sessions.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => {
          const count = sessions.filter((s) => t.key === "upcoming" ? s.status === "accepted" : s.status === t.key).length;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.key ? "bg-white text-navy-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}{count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No {activeTab} sessions</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((session) => {
            const isTeacher = session.teacher_id === user.id;
            const otherId = isTeacher ? session.learner_id : session.teacher_id;
            const other = profileCache[otherId];
            const hasRated = isTeacher ? !!session.teacher_rating : !!session.learner_rating;
            const initials = (other?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

            return (
              <div key={session.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                      {other?.avatar_url ? <img src={other.avatar_url} alt={other.name} className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div>
                      <p className="font-medium text-navy-800 text-sm">{session.skill}</p>
                      <p className="text-xs text-gray-500">
                        {isTeacher ? "Teaching" : "Learning from"}{" "}
                        <Link href={`/dashboard/profile/${otherId}`} className="text-sky-500 hover:underline">
                          {other?.name || "Unknown"}
                        </Link>
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColor[session.status]}`}>
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span>{new Date(session.date).toLocaleDateString()} at {session.time}</span>
                  <span className="flex items-center gap-1">
                    {session.mode === "online" ? <Monitor className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {session.mode}
                  </span>
                </div>

                {session.status === "completed" && (session.teacher_rating || session.learner_rating) && (
                  <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                    {session.teacher_rating && <p>⭐ Teacher: {session.teacher_rating}/5 {session.teacher_feedback && `— "${session.teacher_feedback}"`}</p>}
                    {session.learner_rating && <p>⭐ Learner: {session.learner_rating}/5 {session.learner_feedback && `— "${session.learner_feedback}"`}</p>}
                  </div>
                )}

                <div className="flex gap-2">
                  {session.status === "pending" && session.teacher_id === user.id && (
                    <>
                      <button onClick={() => handleAccept(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                      </button>
                      <button onClick={() => handleCancel(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  )}
                  {session.status === "pending" && session.learner_id === user.id && (
                    <button onClick={() => handleCancel(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                  {session.status === "accepted" && (
                    <>
                      <button onClick={() => handleComplete(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium hover:bg-sky-400 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                      </button>
                      <Link href={`/dashboard/messages?peer=${otherId}`}>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </button>
                      </Link>
                      <button onClick={() => handleCancel(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                  {session.status === "completed" && !hasRated && (
                    <button onClick={() => { setSelectedSession(session); setShowRateDialog(true); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-400 transition-colors">
                      <Star className="w-3.5 h-3.5" /> Rate & Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rate Dialog */}
      {showRateDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-navy-800 mb-4">Rate this session</h3>
            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-8 h-8 transition-colors ${s <= rating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                </button>
              ))}
            </div>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
              placeholder="Leave a comment (optional)" rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setShowRateDialog(false); setRating(0); setFeedback(""); }}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRate} disabled={rating === 0}
                className="flex-1 py-2 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-50">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
