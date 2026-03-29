"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSessionsByUser, updateSession, getProfileById, createNotification, submitRating } from "@/lib/data";
import { Session, Profile, TeacherSubRatings, LearnerSubRatings } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Star, MessageSquare, Monitor, MapPin, Clock, RotateCcw, LogIn } from "lucide-react";

type Tab = "upcoming" | "pending" | "completed" | "cancelled";

// ─── Two-way Rating Dialog ───────────────────────────────────

function RateDialog({
  session,
  role,
  otherName,
  onClose,
  onSubmit,
}: {
  session: Session;
  role: "teacher" | "learner";
  otherName: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [overall, setOverall] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [subs, setSubs] = useState({ a: 0, b: 0, c: 0 });
  const [submitting, setSubmitting] = useState(false);

  const isLearner = role === "learner";
  const subLabels = isLearner
    ? ["Teaching Clarity", "Patience", "Punctuality"]
    : ["Engagement", "Preparation", "Punctuality"];

  const handleSubmit = async () => {
    if (overall === 0) return;
    setSubmitting(true);
    const subRatings = isLearner
      ? ({ teaching_clarity: subs.a, patience: subs.b, punctuality: subs.c } as TeacherSubRatings)
      : ({ engagement: subs.a, preparation: subs.b, punctuality: subs.c } as LearnerSubRatings);
    const { error } = await submitRating(session.id, "", role, overall, feedback, subRatings);
    setSubmitting(false);
    if (error) { toast.error("Failed to submit rating"); return; }
    toast.success("Rating submitted!");
    onSubmit();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-navy-800 mb-1">
          Rate {isLearner ? "your teacher" : "your learner"}
        </h3>
        <p className="text-sm text-gray-500 mb-5">How was your session with <span className="font-medium">{otherName}</span>?</p>

        {/* Overall stars */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-600 mb-2">Overall Experience</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setOverall(s)}>
                <Star className={`w-9 h-9 transition-colors ${s <= overall ? "text-amber-500 fill-amber-500" : "text-gray-200"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Sub-category ratings */}
        <div className="mb-5 space-y-3">
          <p className="text-xs font-medium text-gray-600">Specific Ratings (optional)</p>
          {subLabels.map((label, idx) => {
            const key = idx === 0 ? "a" : idx === 1 ? "b" : "c";
            const val = subs[key as keyof typeof subs];
            return (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 w-32">{label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setSubs((prev) => ({ ...prev, [key]: s }))}>
                      <Star className={`w-5 h-5 transition-colors ${s <= val ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Would you recommend? */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-600 mb-2">Written feedback (optional)</p>
          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
            placeholder={isLearner ? "Describe what made this session great or how it could improve..." : "How engaged and prepared was this learner?"}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Skip
          </button>
          <button onClick={handleSubmit} disabled={overall === 0 || submitting}
            className="flex-1 py-2.5 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Dialog ───────────────────────────────────────

function RescheduleDialog({
  session,
  userId,
  onClose,
  onDone,
}: {
  session: Session;
  userId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState(session.date || "");
  const [time, setTime] = useState(session.time || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!date || !time) return;
    setSaving(true);
    await updateSession(session.id, {
      reschedule_date: date,
      reschedule_time: time,
      reschedule_proposed_by: userId,
    });
    const otherId = session.teacher_id === userId ? session.learner_id : session.teacher_id;
    await createNotification({
      user_id: otherId,
      type: "session_rescheduled",
      title: "Reschedule Proposed",
      message: `A new time has been proposed for your ${session.skill} session.`,
      link: "/dashboard/swaps",
    });
    toast.success("Reschedule proposal sent!");
    setSaving(false);
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 className="text-lg font-semibold text-navy-800 mb-4">Propose New Time</h3>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={!date || !time || saving}
            className="flex-1 py-2.5 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-60">
            {saving ? "Sending..." : "Propose"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function SwapsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profileCache, setProfileCache] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  // Rate dialog state
  const [rateSession, setRateSession] = useState<Session | null>(null);
  const [rateRole, setRateRole] = useState<"teacher" | "learner">("learner");
  // Reschedule dialog
  const [rescheduleSession, setRescheduleSession] = useState<Session | null>(null);

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
    const otherId = session.teacher_id === user!.id ? session.learner_id : session.teacher_id;
    await createNotification({
      user_id: otherId,
      type: "session_cancelled",
      title: "Session Cancelled",
      message: `Your ${session.skill} session has been cancelled.`,
      link: "/dashboard/swaps",
    });
    toast.info("Session cancelled");
    fetchSessions();
  };

  const handleCheckIn = async (session: Session) => {
    await updateSession(session.id, { checked_in_at: new Date().toISOString() });
    toast.success("Checked in! Session is now in progress.");
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
    toast.success("Session complete! +50 XP each 🎉");
    fetchSessions();
    // Open rating dialog for current user's role
    const role = session.teacher_id === user!.id ? "teacher" : "learner";
    setRateRole(role);
    setRateSession(session);
  };

  const handleRebook = async (session: Session) => {
    const otherId = session.teacher_id === user!.id ? session.learner_id : session.teacher_id;
    router.push(`/dashboard/profile/${otherId}`);
  };

  const handleAcceptReschedule = async (session: Session) => {
    await updateSession(session.id, {
      date: session.reschedule_date!,
      time: session.reschedule_time!,
      reschedule_date: null,
      reschedule_time: null,
      reschedule_proposed_by: null,
    });
    toast.success("Reschedule accepted!");
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
            const otherHasRated = isTeacher ? !!session.learner_rating : !!session.teacher_rating;
            const initials = (other?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const isCheckedIn = !!session.checked_in_at;
            const rescheduleProposedByOther = session.reschedule_date && session.reschedule_proposed_by !== user.id;

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
                    {session.status === "accepted" && isCheckedIn ? "In Progress" : session.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                  <span>{new Date(session.date).toLocaleDateString()} at {session.time}</span>
                  <span className="flex items-center gap-1">
                    {session.mode === "online" ? <Monitor className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {session.mode === "online" ? "Online" : session.location || "In-person"}
                  </span>
                  {session.duration && session.duration !== 60 && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.duration}min</span>
                  )}
                </div>

                {/* Reschedule proposal from other party */}
                {rescheduleProposedByOther && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                    <p className="font-medium text-amber-800 mb-1">Reschedule proposed</p>
                    <p className="text-amber-700">{new Date(session.reschedule_date!).toLocaleDateString()} at {session.reschedule_time}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleAcceptReschedule(session)}
                        className="px-3 py-1 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-400">
                        Accept
                      </button>
                      <button onClick={() => updateSession(session.id, { reschedule_date: null, reschedule_time: null, reschedule_proposed_by: null }).then(fetchSessions)}
                        className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 font-medium hover:bg-gray-200">
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Ratings display for completed */}
                {session.status === "completed" && (session.teacher_rating || session.learner_rating) && (
                  <div className="text-xs text-gray-500 mb-3 space-y-1 bg-gray-50 rounded-lg p-3">
                    {session.learner_rating && (
                      <div>
                        <span className="font-medium">Teacher rated: </span>
                        {"⭐".repeat(session.learner_rating)} {session.learner_rating}/5
                        {session.learner_feedback && <span className="italic text-gray-400"> — "{session.learner_feedback}"</span>}
                      </div>
                    )}
                    {session.teacher_rating && (
                      <div>
                        <span className="font-medium">Learner rated: </span>
                        {"⭐".repeat(session.teacher_rating)} {session.teacher_rating}/5
                        {session.teacher_feedback && <span className="italic text-gray-400"> — "{session.teacher_feedback}"</span>}
                      </div>
                    )}
                    {otherHasRated && !hasRated && (
                      <p className="text-amber-600 font-medium">⚠ {other?.name} has rated — your turn!</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
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
                      {!isCheckedIn && (
                        <button onClick={() => handleCheckIn(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors">
                          <LogIn className="w-3.5 h-3.5" /> Check In
                        </button>
                      )}
                      <button onClick={() => handleComplete(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-medium hover:bg-sky-400 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                      </button>
                      <Link href={`/dashboard/messages?peer=${otherId}`}>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </button>
                      </Link>
                      {!session.reschedule_date && (
                        <button onClick={() => setRescheduleSession(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                          <RotateCcw className="w-3.5 h-3.5" /> Reschedule
                        </button>
                      )}
                      <button onClick={() => handleCancel(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors">
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                  {session.status === "completed" && !hasRated && (
                    <button onClick={() => {
                      setRateRole(isTeacher ? "teacher" : "learner");
                      setRateSession(session);
                    }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-400 transition-colors">
                      <Star className="w-3.5 h-3.5" /> Rate & Review
                    </button>
                  )}
                  {session.status === "completed" && (
                    <button onClick={() => handleRebook(session)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sky-600 text-xs font-medium hover:bg-sky-50 transition-colors">
                      <RotateCcw className="w-3.5 h-3.5" /> Rebook
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Two-way Rating Dialog */}
      {rateSession && (
        <RateDialog
          session={rateSession}
          role={rateRole}
          otherName={profileCache[rateRole === "learner" ? rateSession.teacher_id : rateSession.learner_id]?.name || "them"}
          onClose={() => setRateSession(null)}
          onSubmit={fetchSessions}
        />
      )}

      {/* Reschedule Dialog */}
      {rescheduleSession && (
        <RescheduleDialog
          session={rescheduleSession}
          userId={user.id}
          onClose={() => setRescheduleSession(null)}
          onDone={fetchSessions}
        />
      )}
    </main>
  );
}
