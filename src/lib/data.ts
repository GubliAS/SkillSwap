import { supabase } from "@/lib/supabase";
import { Profile, Session, Message, Notification, Badge, Reaction, StudyGroup, GroupMember, GroupMessage, SessionStats, TeacherSubRatings, LearnerSubRatings, Report, ReportReason, ReviewReply } from "@/lib/types";

// ─── Profiles ───────────────────────────────────────────────

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return data as Profile | null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*");
  return (data as Profile[]) || [];
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);
  return { error };
}

export async function searchProfiles(query: string, filters?: {
  faculty?: string;
  mode?: string;
  category?: string;
  level?: string;
  contentType?: "academic" | "skills" | "both";
  sort?: "best_match" | "highest_rated" | "most_sessions" | "newest";
  currentUser?: Profile;
}): Promise<Profile[]> {
  let q = supabase.from("profiles").select("*");

  if (filters?.faculty) q = q.eq("faculty", filters.faculty);
  if (filters?.mode && filters.mode !== "both") q = q.or(`preferred_mode.eq.${filters.mode},preferred_mode.eq.both`);

  const { data } = await q;
  let profiles = (data as Profile[]) || [];

  if (query) {
    const lower = query.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.skills_to_teach.some((s) => s.name.toLowerCase().includes(lower)) ||
        p.skills_to_learn.some((s) => s.name.toLowerCase().includes(lower)) ||
        (p.courses_to_teach || []).some(
          (c) => c.code.toLowerCase().includes(lower) || c.name.toLowerCase().includes(lower)
        ) ||
        (p.courses_to_learn || []).some(
          (c) => c.code.toLowerCase().includes(lower) || c.name.toLowerCase().includes(lower)
        )
    );
  }

  if (filters?.category) {
    profiles = profiles.filter((p) =>
      p.skills_to_teach.some((s) => s.category === filters.category) ||
      p.skills_to_learn.some((s) => s.category === filters.category)
    );
  }

  if (filters?.level) {
    profiles = profiles.filter((p) =>
      p.skills_to_teach.some((s) => s.level === filters.level) ||
      p.skills_to_learn.some((s) => s.level === filters.level)
    );
  }

  // Content type filter
  if (filters?.contentType === "academic") {
    profiles = profiles.filter((p) =>
      (p.courses_to_teach || []).length > 0 || (p.courses_to_learn || []).length > 0
    );
  } else if (filters?.contentType === "skills") {
    profiles = profiles.filter((p) =>
      p.skills_to_teach.length > 0 || p.skills_to_learn.length > 0
    );
  }

  // Sorting
  const sort = filters?.sort || "best_match";
  if (sort === "best_match" && filters?.currentUser) {
    profiles.sort((a, b) => getMatchScore(filters.currentUser!, b) - getMatchScore(filters.currentUser!, a));
  } else if (sort === "highest_rated") {
    profiles.sort((a, b) => b.rating - a.rating);
  } else if (sort === "newest") {
    profiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return profiles;
}

export function getMatchScore(currentUser: Profile, peer: Profile): number {
  let score = 0;

  // Skill matching
  currentUser.skills_to_learn.forEach((learn) => {
    if (peer.skills_to_teach.some((t) => t.name.toLowerCase() === learn.name.toLowerCase())) {
      score += 10;
    }
  });
  currentUser.skills_to_teach.forEach((teach) => {
    if (peer.skills_to_learn.some((l) => l.name.toLowerCase() === teach.name.toLowerCase())) {
      score += 10;
    }
  });

  // Course matching (per spec algorithm: course match = +30)
  const myTeachCodes = new Set((currentUser.courses_to_teach || []).map((c) => c.code.toLowerCase()));
  const myLearnCodes = new Set((currentUser.courses_to_learn || []).map((c) => c.code.toLowerCase()));
  (peer.courses_to_learn || []).forEach((c) => {
    if (myTeachCodes.has(c.code.toLowerCase())) score += 30;
  });
  (peer.courses_to_teach || []).forEach((c) => {
    if (myLearnCodes.has(c.code.toLowerCase())) score += 30;
  });

  // Only add bonus points if there's at least one skill/course overlap
  if (score > 0) {
    if (peer.faculty === currentUser.faculty) score += 3;
    if (peer.preferred_mode === currentUser.preferred_mode || peer.preferred_mode === "both") score += 2;
    score += Math.min(peer.rating * 2, 10);
  }
  return score;
}

export function getTimeSinceLastSeen(lastSeen: string | undefined): string {
  if (!lastSeen) return "Unknown";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return "Online now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Sessions ───────────────────────────────────────────────

export async function getSessionsByUser(userId: string): Promise<Session[]> {
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .or(`teacher_id.eq.${userId},learner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return (data as Session[]) || [];
}

export async function createSession(session: Omit<Session, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("sessions")
    .insert(session)
    .select()
    .single();
  return { data: data as Session | null, error };
}

export async function updateSession(id: string, updates: Partial<Session>) {
  const { error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", id);
  return { error };
}

// ─── Messages ───────────────────────────────────────────────

export async function getConversations(userId: string) {
  const [{ data: sent }, { data: received }] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("*")
      .eq("receiver_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const all = [...(sent || []), ...(received || [])] as Message[];
  const convMap = new Map<string, Message[]>();

  all.forEach((msg) => {
    const peerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!convMap.has(peerId)) convMap.set(peerId, []);
    convMap.get(peerId)!.push(msg);
  });

  const conversations = Array.from(convMap.entries()).map(([peerId, msgs]) => {
    msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const unread = msgs.filter((m) => m.receiver_id === userId && !m.read).length;
    return { peerId, lastMessage: msgs[0], messages: msgs, unreadCount: unread };
  });

  conversations.sort(
    (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  );

  return conversations;
}

export async function getMessagesBetween(userId: string, peerId: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });
  return (data as Message[]) || [];
}

export async function sendMessage(msg: {
  sender_id: string;
  receiver_id: string;
  content: string;
  type?: string;
  reply_to?: string;
  reply_preview?: string;
  reply_sender_id?: string;
}) {
  const row: Record<string, unknown> = {
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    content: msg.content,
    type: msg.type || "text",
  };
  if (msg.reply_to) {
    row.reply_to = msg.reply_to;
    row.reply_preview = msg.reply_preview;
    row.reply_sender_id = msg.reply_sender_id;
  }
  const { data, error } = await supabase
    .from("messages")
    .insert(row)
    .select()
    .single();

  if (data && !error) {
    const preview = msg.type === "audio" ? "🎤 Voice note"
      : msg.type === "image" ? "📷 Photo"
      : msg.type === "document" ? "📄 Document"
      : msg.content.length > 80 ? msg.content.slice(0, 80) + "..." : msg.content;

    // Fetch sender name for notification
    getProfileById(msg.sender_id).then((senderProfile) => {
      const senderName = senderProfile?.name || "Someone";

      // In-app notification
      createNotification({
        user_id: msg.receiver_id,
        type: "new_message",
        title: `Message from ${senderName}`,
        message: preview,
        link: `/dashboard/messages?peer=${msg.sender_id}`,
      }).catch(() => {});

      // Push notification
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: msg.receiver_id,
          title: `Message from ${senderName}`,
          body: preview,
          url: "/dashboard/messages",
        }),
      }).catch(() => {});
    }).catch(() => {});
  }

  return { data: data as Message | null, error };
}

export async function markMessagesAsRead(userId: string, senderId: string) {
  await supabase
    .from("messages")
    .update({ read: true, delivered: true })
    .eq("receiver_id", userId)
    .eq("sender_id", senderId)
    .eq("read", false);
}

export async function markMessagesAsDelivered(userId: string) {
  await supabase
    .from("messages")
    .update({ delivered: true })
    .eq("receiver_id", userId)
    .eq("delivered", false);
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString(), content: "" })
    .eq("id", messageId);
  return { error };
}

export async function togglePinMessage(messageId: string, pinned: boolean) {
  const { error } = await supabase
    .from("messages")
    .update({ pinned })
    .eq("id", messageId);
  return { error };
}

export async function editMessage(messageId: string, newContent: string) {
  const { error } = await supabase
    .from("messages")
    .update({ content: newContent, edited_at: new Date().toISOString() })
    .eq("id", messageId);
  return { error };
}

export async function forwardMessage(originalMsg: Message, senderId: string, receiverId: string) {
  const row: Record<string, unknown> = {
    sender_id: senderId,
    receiver_id: receiverId,
    content: originalMsg.content,
    type: originalMsg.type,
    forwarded_from: originalMsg.id,
  };
  const { data, error } = await supabase.from("messages").insert(row).select().single();
  if (data && !error) {
    fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: receiverId,
        title: "New Message",
        body: "Forwarded message",
        url: "/dashboard/messages",
      }),
    }).catch(() => {});
  }
  return { data: data as Message | null, error };
}

export async function addReaction(messageId: string, userId: string, emoji: string) {
  const { data, error } = await supabase
    .from("message_reactions")
    .upsert({ message_id: messageId, user_id: userId, emoji }, { onConflict: "message_id,user_id,emoji" })
    .select()
    .single();
  return { data: data as Reaction | null, error };
}

export async function removeReaction(messageId: string, userId: string, emoji: string) {
  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji);
  return { error };
}

export async function getReactionsForMessages(messageIds: string[]): Promise<Reaction[]> {
  if (messageIds.length === 0) return [];
  const { data } = await supabase
    .from("message_reactions")
    .select("*")
    .in("message_id", messageIds);
  return (data as Reaction[]) || [];
}

export async function searchMessages(userId: string, peerId: string, query: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`)
    .ilike("content", `%${query}%`)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Message[]) || [];
}

export async function updateLastSeen(userId: string) {
  await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId);
}

// ─── Notifications ──────────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as Notification[]) || [];
}

export async function createNotification(notif: Omit<Notification, "id" | "created_at" | "read">) {
  await supabase.from("notifications").insert(notif);
}

export async function markNotificationsRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

// ─── Badges ─────────────────────────────────────────────────

export function computeBadges(sessions: Session[], userId: string, profile?: Profile): Badge[] {
  const badges: Badge[] = [];
  const completed = sessions.filter((s) => s.status === "completed");
  const taught = completed.filter((s) => s.teacher_id === userId);
  const learned = completed.filter((s) => s.learner_id === userId);

  // Core session badges
  if (completed.length >= 1) badges.push({ id: "first", name: "First Session", description: "Completed your first session", icon: "🎯" });
  if (completed.length >= 5) badges.push({ id: "five", name: "High Five", description: "Completed 5 sessions", icon: "🖐️" });
  if (completed.length >= 10) badges.push({ id: "ten", name: "Dedicated", description: "Completed 10 sessions", icon: "🏆" });
  if (taught.length >= 3) badges.push({ id: "teacher", name: "Great Teacher", description: "Taught 3+ sessions", icon: "📚" });
  if (learned.length >= 3) badges.push({ id: "learner", name: "Quick Learner", description: "Learned 3+ sessions", icon: "🧠" });

  // Super Helper — taught 20+ unique students
  const uniqueStudents = new Set(taught.map((s) => s.learner_id));
  if (uniqueStudents.size >= 20) badges.push({ id: "super_helper", name: "Super Helper", description: "Helped 20+ students", icon: "🦸" });

  // Versatile Tutor — taught 5+ different subjects
  const uniqueSubjects = new Set(taught.map((s) => s.skill.toLowerCase()));
  if (uniqueSubjects.size >= 5) badges.push({ id: "versatile", name: "Versatile Tutor", description: "Taught 5+ different subjects", icon: "🎨" });

  // Perfect Score — 5.0 rating with 10+ reviews
  if (profile && profile.rating >= 5.0 && profile.total_ratings >= 10) {
    badges.push({ id: "perfect", name: "Perfect Score", description: "5.0 rating with 10+ reviews", icon: "⭐" });
  }

  // Rising Star — 5+ sessions in first month
  if (completed.length >= 5) {
    const firstSession = completed[completed.length - 1];
    const lastSession = completed[0];
    const daysBetween = (new Date(lastSession.created_at).getTime() - new Date(firstSession.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysBetween <= 30) badges.push({ id: "rising_star", name: "Rising Star", description: "5+ sessions in your first month", icon: "🌟" });
  }

  // Community Builder — both taught and learned 5+ times
  if (taught.length >= 5 && learned.length >= 5) {
    badges.push({ id: "community", name: "Community Builder", description: "Active on both sides of the exchange", icon: "🤝" });
  }

  return badges;
}

// ─── Ratings & Reviews ──────────────────────────────────────

export async function submitRating(
  sessionId: string,
  raterId: string,
  role: "teacher" | "learner",
  rating: number,
  feedback: string,
  subRatings: TeacherSubRatings | LearnerSubRatings
) {
  // role "learner" = learner rating the teacher (stored as learner_rating)
  // role "teacher" = teacher rating the learner (stored as teacher_rating)
  const updates: Partial<Session> =
    role === "learner"
      ? { learner_rating: rating, learner_feedback: feedback, learner_sub_ratings: subRatings as TeacherSubRatings }
      : { teacher_rating: rating, teacher_feedback: feedback, teacher_sub_ratings: subRatings as LearnerSubRatings };

  const { error } = await supabase.from("sessions").update(updates).eq("id", sessionId);
  if (error) return { error };

  // If learner rated the teacher, recalculate teacher's profile rating
  if (role === "learner") {
    const { data: session } = await supabase.from("sessions").select("teacher_id").eq("id", sessionId).single();
    if (session) {
      const { data: teacherSessions } = await supabase
        .from("sessions")
        .select("learner_rating")
        .eq("teacher_id", session.teacher_id)
        .eq("status", "completed")
        .not("learner_rating", "is", null);
      if (teacherSessions && teacherSessions.length > 0) {
        const ratings = teacherSessions.map((s: { learner_rating: number }) => s.learner_rating).filter(Boolean);
        const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
        await supabase
          .from("profiles")
          .update({ rating: Math.round(avg * 10) / 10, total_ratings: ratings.length })
          .eq("id", session.teacher_id);
      }
    }
  }

  return { error: null };
}

export async function getReviewsForProfile(userId: string, limit = 5) {
  const { data } = await supabase
    .from("sessions")
    .select("id, skill, learner_rating, learner_feedback, learner_sub_ratings, learner_id, created_at")
    .eq("teacher_id", userId)
    .eq("status", "completed")
    .not("learner_rating", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export function computeSessionStats(sessions: Session[], userId: string): SessionStats {
  const completed = sessions.filter((s) => s.status === "completed");
  const asTeacher = completed.filter((s) => s.teacher_id === userId);
  const asLearner = completed.filter((s) => s.learner_id === userId);

  const totalMinutes = completed.reduce((sum, s) => sum + (s.duration || 60), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  // Most taught skill
  const skillCount: Record<string, number> = {};
  asTeacher.forEach((s) => { skillCount[s.skill] = (skillCount[s.skill] || 0) + 1; });
  const mostTaughtSkill = Object.keys(skillCount).sort((a, b) => skillCount[b] - skillCount[a])[0] || null;

  // Learning streak — count consecutive days with at least one session up to today
  const sessionDates = new Set(
    completed.map((s) => new Date(s.date).toDateString())
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (sessionDates.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    total_completed: completed.length,
    total_hours: totalHours,
    most_taught_skill: mostTaughtSkill,
    learning_streak: streak,
    sessions_as_teacher: asTeacher.length,
    sessions_as_learner: asLearner.length,
  };
}

// ─── Study Groups ────────────────────────────────────────────

export async function getStudyGroups(filters?: { department?: string; course_code?: string }): Promise<StudyGroup[]> {
  let q = supabase.from("study_groups").select("*, group_members(count)").order("created_at", { ascending: false });
  if (filters?.department) q = q.eq("department", filters.department);
  if (filters?.course_code) q = q.ilike("course_code", `%${filters.course_code}%`);
  const { data } = await q;
  return ((data || []) as (StudyGroup & { group_members: { count: number }[] })[]).map((g) => ({
    ...g,
    member_count: g.group_members?.[0]?.count ?? 0,
  }));
}

export async function getUserGroups(userId: string): Promise<StudyGroup[]> {
  const { data } = await supabase
    .from("group_members")
    .select("study_groups(*, group_members(count))")
    .eq("user_id", userId)
    .eq("status", "approved");
  return ((data || []) as unknown as { study_groups: StudyGroup & { group_members: { count: number }[] } }[])
    .map((row) => ({
      ...row.study_groups,
      member_count: row.study_groups?.group_members?.[0]?.count ?? 0,
    }))
    .filter(Boolean);
}

export async function createStudyGroup(
  group: Omit<StudyGroup, "id" | "created_at" | "member_count">,
  creatorId: string
) {
  const { data, error } = await supabase
    .from("study_groups")
    .insert(group)
    .select()
    .single();
  if (error || !data) return { data: null, error };
  // Auto-join creator as coordinator
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: (data as StudyGroup).id,
    user_id: creatorId,
    role: "coordinator",
    status: "approved",
  });
  if (memberError) {
    console.error("Failed to add creator as coordinator:", memberError);
  }
  return { data: data as StudyGroup, error: null };
}

export async function deleteStudyGroup(groupId: string) {
  const { error } = await supabase.from("study_groups").delete().eq("id", groupId);
  return { error };
}

export async function requestJoinGroup(groupId: string, userId: string) {
  const { error } = await supabase.from("group_members").insert({
    group_id: groupId,
    user_id: userId,
    role: "member",
    status: "pending",
  });
  return { error };
}

export async function approveGroupMember(memberId: string) {
  const { error } = await supabase
    .from("group_members")
    .update({ status: "approved" })
    .eq("id", memberId);
  return { error };
}

export async function removeGroupMember(memberId: string) {
  const { error } = await supabase.from("group_members").delete().eq("id", memberId);
  return { error };
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data } = await supabase
    .from("group_members")
    .select("*, profile:profiles(*)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  return (data || []) as GroupMember[];
}

export async function getGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const { data } = await supabase
    .from("group_messages")
    .select("*, sender:profiles(id,name,avatar_url)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(100);
  return (data || []) as GroupMessage[];
}

export async function sendGroupMessage(groupId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from("group_messages")
    .insert({ group_id: groupId, sender_id: senderId, content })
    .select("*, sender:profiles(id,name,avatar_url)")
    .single();
  return { data: data as GroupMessage | null, error };
}

export async function getUserGroupMembership(groupId: string, userId: string): Promise<GroupMember | null> {
  const { data } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();
  return data as GroupMember | null;
}

// ─── Reports & Blocking ─────────────────────────────────────

export async function reportUser(reporterId: string, reportedUserId: string, reason: ReportReason, details: string) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    reason,
    details,
  });
  return { error };
}

export async function reportMessage(reporterId: string, reportedUserId: string, messageId: string, reason: ReportReason, details: string) {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    reported_message_id: messageId,
    reason,
    details,
  });
  return { error };
}

export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase.from("blocked_users").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  return { error };
}

export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  return { error };
}

export async function getBlockedUsers(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", userId);
  return (data || []).map((r: { blocked_id: string }) => r.blocked_id);
}

export async function getBlockedByUsers(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("blocked_users")
    .select("blocker_id")
    .eq("blocked_id", userId);
  return (data || []).map((r: { blocker_id: string }) => r.blocker_id);
}

export async function computeResponseRate(userId: string): Promise<number> {
  // Get all sessions where this user is the teacher
  const { data: sessions } = await supabase
    .from("sessions")
    .select("status, created_at")
    .eq("teacher_id", userId);
  if (!sessions || sessions.length === 0) return 0;
  const total = sessions.length;
  const responded = sessions.filter(
    (s: { status: string }) => s.status === "accepted" || s.status === "completed" || s.status === "cancelled"
  ).length;
  return Math.round((responded / total) * 100);
}

// ─── Review Helpful Votes & Replies ─────────────────────────

export async function voteReviewHelpful(sessionId: string, voterId: string) {
  // Toggle: if already voted, remove; else add
  const { data: existing } = await supabase
    .from("review_helpful_votes")
    .select("id")
    .eq("session_id", sessionId)
    .eq("voter_id", voterId)
    .maybeSingle();
  if (existing) {
    await supabase.from("review_helpful_votes").delete().eq("id", existing.id);
    return { voted: false };
  }
  await supabase.from("review_helpful_votes").insert({ session_id: sessionId, voter_id: voterId });
  return { voted: true };
}

export async function getHelpfulVoteCounts(sessionIds: string[]): Promise<Record<string, number>> {
  if (sessionIds.length === 0) return {};
  const { data } = await supabase
    .from("review_helpful_votes")
    .select("session_id")
    .in("session_id", sessionIds);
  const counts: Record<string, number> = {};
  (data || []).forEach((r: { session_id: string }) => {
    counts[r.session_id] = (counts[r.session_id] || 0) + 1;
  });
  return counts;
}

export async function getUserHelpfulVotes(sessionIds: string[], userId: string): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set();
  const { data } = await supabase
    .from("review_helpful_votes")
    .select("session_id")
    .in("session_id", sessionIds)
    .eq("voter_id", userId);
  return new Set((data || []).map((r: { session_id: string }) => r.session_id));
}

export async function replyToReview(sessionId: string, teacherId: string, content: string) {
  const { error } = await supabase.from("review_replies").upsert({
    session_id: sessionId,
    teacher_id: teacherId,
    content,
  }, { onConflict: "session_id" });
  return { error };
}

export async function getReviewReplies(sessionIds: string[]): Promise<Record<string, ReviewReply>> {
  if (sessionIds.length === 0) return {};
  const { data } = await supabase
    .from("review_replies")
    .select("*")
    .in("session_id", sessionIds);
  const map: Record<string, ReviewReply> = {};
  (data || []).forEach((r: ReviewReply) => { map[r.session_id] = r; });
  return map;
}
