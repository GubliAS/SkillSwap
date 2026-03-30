"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getStudyGroups,
  getUserGroups,
  createStudyGroup,
  deleteStudyGroup,
  requestJoinGroup,
  approveGroupMember,
  removeGroupMember,
  getGroupMembers,
  getGroupMessages,
  sendGroupMessage,
  getUserGroupMembership,
} from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { StudyGroup, GroupMember, GroupMessage, FACULTIES, DAYS_OF_WEEK } from "@/lib/types";
import { toast } from "sonner";
import { Plus, X, Send, Users, MessageSquare, Info, ChevronLeft, Search } from "lucide-react";

// ─── Create Group Modal ──────────────────────────────────────

function CreateGroupModal({ onClose, onCreate }: { onClose: () => void; onCreate: (g: StudyGroup) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(10);
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleDay = (d: string) =>
    setScheduleDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const { data, error } = await createStudyGroup(
      {
        name: name.trim(),
        course_code: courseCode.trim().toUpperCase(),
        department,
        description: description.trim(),
        max_members: maxMembers,
        schedule_days: scheduleDays,
        schedule_time: scheduleTime,
        location: location.trim(),
        creator_id: user.id,
      },
      user.id
    );
    setSaving(false);
    if (error || !data) { toast.error("Failed to create group"); return; }
    toast.success("Study group created!");
    onCreate(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-navy-800">Create Study Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Group Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. CSM 399 Study Circle"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Course Code</label>
              <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="e.g. CSM 399"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white">
                <option value="">Any</option>
                {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              placeholder="What will this group focus on?"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Members (3–15)</label>
              <input type="number" min={3} max={15} value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Meeting Time</label>
              <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Meeting Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((d) => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    scheduleDays.includes(d) ? "bg-navy-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>{d.slice(0, 3)}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Library Study Room 3, Online"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={saving || !name.trim()}
            className="flex-1 py-2.5 rounded-lg bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors disabled:opacity-60">
            {saving ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Card ──────────────────────────────────────────────

function GroupCard({ group, isMember, onSelect }: { group: StudyGroup; isMember: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className="w-full text-left bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-navy-800 text-sm">{group.name}</h3>
          {group.course_code && (
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full">
              {group.course_code}
            </span>
          )}
        </div>
        {isMember && (
          <span className="shrink-0 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Joined</span>
        )}
      </div>
      {group.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{group.description}</p>}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.member_count ?? 0}/{group.max_members}</span>
        {group.schedule_days?.length > 0 && (
          <span>{group.schedule_days.map((d) => d.slice(0, 3)).join(", ")}{group.schedule_time ? ` · ${group.schedule_time}` : ""}</span>
        )}
        {group.location && <span>📍 {group.location}</span>}
      </div>
    </button>
  );
}

// ─── Group Detail ────────────────────────────────────────────

function GroupDetail({
  group,
  currentUserId,
  onBack,
  onGroupUpdated,
}: {
  group: StudyGroup;
  currentUserId: string;
  onBack: () => void;
  onGroupUpdated: () => void;
}) {
  const [tab, setTab] = useState<"info" | "members" | "chat">("info");
  const [membership, setMembership] = useState<GroupMember | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCreator = group.creator_id === currentUserId;
  const isCoordinator = membership?.role === "coordinator" && membership?.status === "approved";
  const isApprovedMember = membership?.status === "approved";

  const loadMembers = useCallback(async () => {
    const data = await getGroupMembers(group.id);
    setMembers(data);
  }, [group.id]);

  const loadMessages = useCallback(async () => {
    const data = await getGroupMessages(group.id);
    setMessages(data);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [group.id]);

  useEffect(() => {
    (async () => {
      const m = await getUserGroupMembership(group.id, currentUserId);
      setMembership(m);
    })();
    loadMembers();
  }, [group.id, currentUserId, loadMembers]);

  // Subscribe to group messages via Realtime
  useEffect(() => {
    if (!isApprovedMember) return;
    loadMessages();
    const channel = supabase
      .channel(`group_messages:${group.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "group_messages",
        filter: `group_id=eq.${group.id}`,
      }, async (payload) => {
        // Fetch full message with sender profile
        const { data } = await supabase
          .from("group_messages")
          .select("*, sender:profiles(id,name,avatar_url)")
          .eq("id", payload.new.id)
          .single();
        if (data) {
          setMessages((prev) => [...prev, data as GroupMessage]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [group.id, isApprovedMember, loadMessages]);

  const handleJoin = async () => {
    setJoining(true);
    const { error } = await requestJoinGroup(group.id, currentUserId);
    setJoining(false);
    if (error) { toast.error("Failed to request join"); return; }
    toast.success("Join request sent! Waiting for coordinator approval.");
    const m = await getUserGroupMembership(group.id, currentUserId);
    setMembership(m);
  };

  const handleApprove = async (memberId: string) => {
    const { error } = await approveGroupMember(memberId);
    if (error) { toast.error("Failed to approve"); return; }
    toast.success("Member approved!");
    loadMembers();
    onGroupUpdated();
  };

  const handleRemove = async (memberId: string, memberUserId: string) => {
    if (memberUserId === currentUserId) {
      if (!confirm("Leave this group?")) return;
    }
    const { error } = await removeGroupMember(memberId);
    if (error) { toast.error("Failed"); return; }
    if (memberUserId === currentUserId) {
      setMembership(null);
      onGroupUpdated();
      onBack();
      return;
    }
    loadMembers();
    onGroupUpdated();
  };

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg("");
    const { error } = await sendGroupMessage(group.id, currentUserId, content);
    setSending(false);
    if (error) { toast.error("Failed to send"); setNewMsg(content); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    const { error } = await deleteStudyGroup(group.id);
    if (error) { toast.error("Failed to delete group"); return; }
    toast.success("Group deleted");
    onGroupUpdated();
    onBack();
  };

  const approvedMembers = members.filter((m) => m.status === "approved");
  const pendingMembers = members.filter((m) => m.status === "pending");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-4">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-navy-800 truncate">{group.name}</h2>
          {group.course_code && (
            <span className="text-xs font-bold text-sky-600">{group.course_code}</span>
          )}
        </div>
        {!membership && (
          <button onClick={handleJoin} disabled={joining}
            className="shrink-0 px-4 py-1.5 rounded-lg bg-navy-800 text-white text-sm font-medium hover:bg-navy-700 transition-colors disabled:opacity-60">
            {joining ? "Requesting..." : "Request to Join"}
          </button>
        )}
        {membership?.status === "pending" && (
          <span className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-medium">Pending Approval</span>
        )}
        {isApprovedMember && !isCoordinator && (
          <button onClick={() => { const m = members.find((x) => x.user_id === currentUserId); if (m) handleRemove(m.id, m.user_id); }}
            className="shrink-0 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50">
            Leave
          </button>
        )}
        {isCreator && (
          <button onClick={handleDelete}
            className="shrink-0 px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50 transition-colors">
            Delete
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {([["info", "Info", Info], ["members", "Members", Users], ["chat", "Chat", MessageSquare]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            disabled={key === "chat" && !isApprovedMember}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === key ? "bg-white text-navy-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
            {key === "members" && pendingMembers.length > 0 && isCoordinator && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {pendingMembers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === "info" && (
        <div className="space-y-4 overflow-y-auto">
          {group.description && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">{group.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-0.5">Members</p>
              <p className="font-semibold text-navy-800">{approvedMembers.length} / {group.max_members}</p>
            </div>
            {group.schedule_days?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Schedule</p>
                <p className="font-semibold text-navy-800 text-xs">
                  {group.schedule_days.map((d) => d.slice(0, 3)).join(", ")}
                  {group.schedule_time && ` · ${group.schedule_time}`}
                </p>
              </div>
            )}
            {group.location && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Location</p>
                <p className="font-semibold text-navy-800">{group.location}</p>
              </div>
            )}
            {group.department && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Department</p>
                <p className="font-semibold text-navy-800 text-xs">{group.department}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members tab */}
      {tab === "members" && (
        <div className="overflow-y-auto space-y-3">
          {isCoordinator && pendingMembers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 mb-2">Pending Requests ({pendingMembers.length})</p>
              <div className="space-y-2">
                {pendingMembers.map((m) => {
                  const profile = m.profile;
                  const initials = (profile?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-800 truncate">{profile?.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400 truncate">{profile?.faculty || ""}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => handleApprove(m.id)}
                          className="px-2.5 py-1 rounded-md bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-400">
                          Approve
                        </button>
                        <button onClick={() => handleRemove(m.id, m.user_id)}
                          className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200">
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Members ({approvedMembers.length})</p>
            <div className="space-y-2">
              {approvedMembers.map((m) => {
                const profile = m.profile;
                const initials = (profile?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-navy-800 truncate">{profile?.name || "Unknown"}</p>
                        {m.role === "coordinator" && (
                          <span className="px-1.5 py-0.5 bg-navy-100 text-navy-700 text-[10px] font-medium rounded">Coordinator</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{profile?.faculty || ""}</p>
                    </div>
                    {isCoordinator && m.user_id !== currentUserId && (
                      <button onClick={() => handleRemove(m.id, m.user_id)}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chat tab */}
      {tab === "chat" && isApprovedMember && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-3 mb-3">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === currentUserId;
                const sender = msg.sender;
                const initials = (sender?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    {!isMe && (
                      <div className="w-6 h-6 bg-navy-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0">
                        {sender?.avatar_url ? <img src={sender.avatar_url} alt={sender.name} className="w-full h-full object-cover" /> : initials}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      {!isMe && <p className="text-[10px] text-gray-400 ml-1">{sender?.name}</p>}
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        isMe ? "bg-navy-800 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      <p className="text-[10px] text-gray-400 mx-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Message the group..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <button onClick={handleSend} disabled={!newMsg.trim() || sending}
              className="w-10 h-10 rounded-xl bg-navy-800 text-white flex items-center justify-center hover:bg-navy-700 transition-colors disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function GroupsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"mine" | "browse">("mine");
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => { if (!isLoading && !user) router.push("/login"); }, [isLoading, user, router]);

  const loadMyGroups = useCallback(async () => {
    if (!user) return;
    const data = await getUserGroups(user.id);
    setMyGroups(data);
  }, [user]);

  const loadAllGroups = useCallback(async () => {
    setLoadingGroups(true);
    const data = await getStudyGroups({
      department: deptFilter || undefined,
      course_code: query || undefined,
    });
    setAllGroups(data);
    setLoadingGroups(false);
  }, [deptFilter, query]);

  useEffect(() => { if (user) { loadMyGroups(); loadAllGroups(); } }, [user, loadMyGroups, loadAllGroups]);

  const handleGroupCreated = (g: StudyGroup) => {
    setMyGroups((prev) => [g, ...prev]);
    setAllGroups((prev) => [g, ...prev]);
    setSelectedGroup(g);
  };

  const filteredBrowse = allGroups.filter((g) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.course_code?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q)
    );
  });

  const myGroupIds = new Set(myGroups.map((g) => g.id));

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
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Study Groups</h1>
            <p className="mt-2 text-white/60">Collaborate with peers in focused study sessions.</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="hidden sm:flex items-center gap-1.5 px-6 py-3 rounded-full bg-sky-500 text-white text-sm font-semibold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/25">
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      {/* Mobile create button */}
      <button onClick={() => setShowCreate(true)}
        className="sm:hidden flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-navy-800 text-white text-sm font-semibold hover:bg-navy-700 transition-colors shadow-lg shadow-navy-800/25 mb-4 w-full justify-center">
        <Plus className="w-4 h-4" /> New Group
      </button>
      <div className={`flex gap-6 ${selectedGroup ? "h-[calc(100vh-14rem)]" : ""}`}>
        {/* Left panel — group list */}
        <div className={`flex flex-col ${selectedGroup ? "hidden lg:flex w-80 shrink-0" : "w-full"}`}>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setTab("mine")}
              className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all ${tab === "mine" ? "bg-navy-800 text-white shadow-lg shadow-navy-800/25" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-navy-800"}`}>
              My Groups ({myGroups.length})
            </button>
            <button onClick={() => setTab("browse")}
              className={`px-5 py-2.5 rounded-full text-xs font-medium transition-all ${tab === "browse" ? "bg-navy-800 text-white shadow-lg shadow-navy-800/25" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-navy-800"}`}>
              Browse All
            </button>
          </div>

          {/* Search + filter (browse tab) */}
          {tab === "browse" && (
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Course code or name..."
                  className="w-full pl-8 pr-3 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 hover:border-gray-300 transition-colors" />
              </div>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-full border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white hover:border-gray-300 transition-colors">
                <option value="">All Depts</option>
                {FACULTIES.map((f) => <option key={f} value={f}>{f.replace("College of ", "")}</option>)}
              </select>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {tab === "mine" && (
              myGroups.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium text-navy-800 mb-1">No groups yet</p>
                  <p className="text-xs">Create a group or browse to join one</p>
                </div>
              ) : myGroups.map((g) => (
                <GroupCard key={g.id} group={g} isMember={true}
                  onSelect={() => setSelectedGroup(g)} />
              ))
            )}
            {tab === "browse" && (
              loadingGroups ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                      <div className="h-3 bg-gray-100 rounded w-2/3 mb-2" />
                      <div className="h-2 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredBrowse.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-sm font-medium text-navy-800 mb-1">No groups found</p>
                  <p className="text-xs">Try a different search or create one</p>
                </div>
              ) : filteredBrowse.map((g) => (
                <GroupCard key={g.id} group={g} isMember={myGroupIds.has(g.id)}
                  onSelect={() => setSelectedGroup(g)} />
              ))
            )}
          </div>
        </div>

        {/* Right panel — group detail */}
        {selectedGroup && (
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 flex flex-col overflow-hidden">
            <GroupDetail
              group={selectedGroup}
              currentUserId={user.id}
              onBack={() => setSelectedGroup(null)}
              onGroupUpdated={() => { loadMyGroups(); loadAllGroups(); }}
            />
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreate={handleGroupCreated}
        />
      )}
      </div>
    </main>
  );
}
