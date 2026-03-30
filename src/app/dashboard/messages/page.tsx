"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getConversations, getProfileById, getMessagesBetween, sendMessage,
  markMessagesAsRead, deleteMessage, editMessage, addReaction, removeReaction,
  getReactionsForMessages, searchMessages, togglePinMessage, forwardMessage,
  reportUser, reportMessage, blockUser,
} from "@/lib/data";
import { Profile, Message, Reaction, ReportReason } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Send, Search, Trash2, Edit2, Pin, PinOff, Forward, Smile, Reply, X, Check, CheckCheck, MoreVertical, Flag, Ban } from "lucide-react";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function MessagesInner() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<{ peerId: string; lastMessage: Message; unreadCount: number }[]>([]);
  const [peerProfiles, setPeerProfiles] = useState<Record<string, Profile>>({});
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [deleteConfirmMsg, setDeleteConfirmMsg] = useState<Message | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("harassment");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!isLoading && !user) router.push("/login"); }, [isLoading, user, router]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const convs = await getConversations(user.id);
    setConversations(convs.map(({ peerId, lastMessage, unreadCount }) => ({ peerId, lastMessage, unreadCount })));
    const profiles: Record<string, Profile> = {};
    await Promise.all(convs.map(async ({ peerId }) => {
      const p = await getProfileById(peerId);
      if (p) profiles[peerId] = p;
    }));
    setPeerProfiles(profiles);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Handle ?peer= query param
  useEffect(() => {
    const peer = searchParams.get("peer");
    if (peer) setActivePeerId(peer);
  }, [searchParams]);

  const loadMessages = useCallback(async () => {
    if (!user || !activePeerId) return;
    const msgs = await getMessagesBetween(user.id, activePeerId);
    setMessages(msgs);
    const rxns = await getReactionsForMessages(msgs.map((m) => m.id));
    const grouped: Record<string, Reaction[]> = {};
    rxns.forEach((r) => { if (!grouped[r.message_id]) grouped[r.message_id] = []; grouped[r.message_id].push(r); });
    setReactions(grouped);
    await markMessagesAsRead(user.id, activePeerId);
    loadConversations();
    if (!peerProfiles[activePeerId]) {
      const p = await getProfileById(activePeerId);
      if (p) setPeerProfiles((prev) => ({ ...prev, [activePeerId]: p }));
    }
  }, [user, activePeerId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user || !activePeerId) return;
    const channel = supabase
      .channel(`messages-${user.id}-${activePeerId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => { loadMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activePeerId, loadMessages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !activePeerId) return;
    const content = input.trim();
    setInput("");
    if (editingMsg) {
      await editMessage(editingMsg.id, content);
      setEditingMsg(null);
      setEditContent("");
    } else {
      await sendMessage({
        sender_id: user.id, receiver_id: activePeerId, content,
        ...(replyTo ? { reply_to: replyTo.id, reply_preview: replyTo.content.slice(0, 60), reply_sender_id: replyTo.sender_id } : {}),
      });
      setReplyTo(null);
    }
    loadMessages();
  };

  const handleSearch = async () => {
    if (!user || !activePeerId || !searchQuery.trim()) return;
    const results = await searchMessages(user.id, activePeerId, searchQuery);
    setSearchResults(results);
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    const existing = reactions[msgId]?.find((r) => r.user_id === user.id && r.emoji === emoji);
    if (existing) { await removeReaction(msgId, user.id, emoji); }
    else { await addReaction(msgId, user.id, emoji); }
    setEmojiPickerMsgId(null);
    loadMessages();
  };

  const handleForward = async (peerId: string) => {
    if (!forwardMsg || !user) return;
    await forwardMessage(forwardMsg, user.id, peerId);
    setForwardMsg(null);
    toast.success("Message forwarded!");
  };

  const handleReport = async () => {
    if (!user || !activePeerId) return;
    setReportSubmitting(true);
    const { error } = await reportUser(user.id, activePeerId, reportReason, reportDetails);
    setReportSubmitting(false);
    if (error) { toast.error("Failed to submit report"); return; }
    toast.success("Report submitted. We'll review it shortly.");
    setShowReportDialog(false);
    setReportReason("harassment");
    setReportDetails("");
  };

  const handleBlock = async () => {
    if (!user || !activePeerId) return;
    const { error } = await blockUser(user.id, activePeerId);
    if (error) { toast.error("Failed to block user"); return; }
    toast.success("User blocked");
    setShowBlockConfirm(false);
    setActivePeerId(null);
    loadConversations();
  };

  const handleDeleteMsg = async () => {
    if (!deleteConfirmMsg) return;
    await deleteMessage(deleteConfirmMsg.id);
    setDeleteConfirmMsg(null);
    loadMessages();
  };

  if (isLoading || !user) return null;

  const activePeer = activePeerId ? peerProfiles[activePeerId] : null;
  const activePeerInitials = activePeer?.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-gray-200 bg-white flex flex-col ${activePeerId ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-navy-800 text-lg">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-center text-sm text-gray-400 p-8">No conversations yet</p>
          ) : (
            conversations.map(({ peerId, lastMessage, unreadCount }) => {
              const peer = peerProfiles[peerId];
              const initials = (peer?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <button key={peerId} onClick={() => setActivePeerId(peerId)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${activePeerId === peerId ? "bg-sky-50 border-sky-100" : ""}`}>
                  <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                    {peer?.avatar_url ? <img src={peer.avatar_url} alt={peer.name} className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-navy-800 text-sm truncate">{peer?.name || "Unknown"}</p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${unreadCount > 0 ? "text-navy-800 font-medium" : "text-gray-500"}`}>
                      {lastMessage.deleted_at ? "Message deleted" : lastMessage.content.slice(0, 40)}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs flex items-center justify-center shrink-0">{unreadCount}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      {activePeerId ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <button onClick={() => setActivePeerId(null)} className="md:hidden text-gray-500 hover:text-navy-800">
              <X className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 bg-navy-800 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
              {activePeer?.avatar_url ? <img src={activePeer.avatar_url} alt={activePeer.name} className="w-full h-full object-cover" /> : activePeerInitials}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-navy-800 text-sm">{activePeer?.name || "Unknown"}</p>
              <p className="text-xs text-gray-400">{activePeer?.faculty || ""}</p>
            </div>
            <button onClick={() => setShowSearch(!showSearch)} className="text-gray-400 hover:text-navy-800 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button onClick={() => setShowChatMenu(!showChatMenu)} className="text-gray-400 hover:text-navy-800 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
              {showChatMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1">
                  <button onClick={() => { setShowChatMenu(false); setShowReportDialog(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Flag className="w-4 h-4 text-amber-500" /> Report User
                  </button>
                  <button onClick={() => { setShowChatMenu(false); setShowBlockConfirm(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <Ban className="w-4 h-4" /> Block User
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          {showSearch && (
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search messages..." className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400" />
              <button onClick={handleSearch} className="px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm font-medium">Search</button>
              <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(""); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Pinned message bar */}
          {(() => {
            const pinnedMsg = messages.find((m) => m.pinned && !m.deleted_at);
            if (!pinnedMsg) return null;
            return (
              <button
                onClick={() => {
                  const el = messageRefs.current[pinnedMsg.id];
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                    el.classList.add("bg-amber-50");
                    setTimeout(() => el.classList.remove("bg-amber-50"), 2000);
                  }
                }}
                className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left w-full"
              >
                <div className="w-1 h-8 bg-sky-500 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-sky-600">Pinned Message</p>
                  <p className="text-xs text-gray-600 truncate">{pinnedMsg.content}</p>
                </div>
                <Pin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              </button>
            );
          })()}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {(searchResults.length > 0 ? searchResults : messages).map((msg) => {
              const isMine = msg.sender_id === user.id;
              const msgReactions = reactions[msg.id] || [];
              const grouped: Record<string, number> = {};
              msgReactions.forEach((r) => { grouped[r.emoji] = (grouped[r.emoji] || 0) + 1; });

              if (msg.deleted_at) {
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <span className="text-xs text-gray-400 italic px-3 py-1.5 bg-gray-100 rounded-full">Message deleted</span>
                  </div>
                );
              }

              return (
                <div key={msg.id} ref={(el) => { messageRefs.current[msg.id] = el; }} className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                  <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                    {msg.forwarded_from && (
                      <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Forward className="w-3 h-3" /> Forwarded</p>
                    )}
                    {msg.reply_preview && (
                      <div className={`text-xs px-2 py-1 rounded mb-0.5 border-l-2 ${isMine ? "bg-sky-100 border-sky-400 text-sky-700" : "bg-gray-100 border-gray-400 text-gray-600"}`}>
                        {msg.reply_preview}
                      </div>
                    )}
                    <div className={`relative px-4 py-2.5 rounded-2xl text-sm ${
                      isMine ? "bg-navy-800 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                    }`}>
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      {msg.edited_at && <span className="text-xs opacity-60 ml-1">(edited)</span>}
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <span className="text-xs opacity-50">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isMine && (
                          msg.read ? <CheckCheck className="w-3 h-3 opacity-60" /> : <Check className="w-3 h-3 opacity-40" />
                        )}
                      </div>
                    </div>

                    {/* Reactions */}
                    {Object.keys(grouped).length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(grouped).map(([emoji, count]) => (
                          <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}
                            className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs hover:bg-gray-50">
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action bar (on hover) */}
                    <div className={`hidden group-hover:flex items-center gap-1 mt-1 ${isMine ? "flex-row-reverse" : ""}`}>
                      <button onClick={() => setReplyTo(msg)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Reply">
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="React">
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setForwardMsg(msg)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Forward">
                        <Forward className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={async () => {
                        if (!msg.pinned) {
                          const currentlyPinned = messages.find((m) => m.pinned && m.id !== msg.id);
                          if (currentlyPinned) await togglePinMessage(currentlyPinned.id, false);
                        }
                        await togglePinMessage(msg.id, !msg.pinned);
                        loadMessages();
                      }} className={`p-1 rounded hover:bg-gray-100 ${msg.pinned ? "text-amber-500 hover:text-amber-600" : "text-gray-400 hover:text-gray-600"}`} title={msg.pinned ? "Unpin" : "Pin"}>
                        {msg.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      </button>
                      {isMine && (
                        <>
                          <button onClick={() => { setEditingMsg(msg); setEditContent(msg.content); setInput(msg.content); }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirmMsg(msg)} className="p-1 rounded hover:bg-gray-100 text-red-400 hover:text-red-600" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Emoji picker */}
                    {emojiPickerMsgId === msg.id && (
                      <div className="flex gap-1 p-2 bg-white border border-gray-200 rounded-xl shadow-md mt-1">
                        {EMOJI_LIST.map((e) => (
                          <button key={e} onClick={() => handleReaction(msg.id, e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply preview */}
          {replyTo && (
            <div className="bg-sky-50 border-t border-sky-100 px-4 py-2 flex items-center gap-2">
              <Reply className="w-4 h-4 text-sky-500 shrink-0" />
              <p className="text-xs text-sky-700 flex-1 truncate">{replyTo.content.slice(0, 80)}</p>
              <button onClick={() => setReplyTo(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
          )}

          {/* Edit indicator */}
          {editingMsg && (
            <div className="bg-amber-50 border-t border-amber-100 px-4 py-2 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 flex-1">Editing message</p>
              <button onClick={() => { setEditingMsg(null); setInput(""); }}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
          )}

          {/* Input */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Type a message..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <button onClick={handleSend} disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-navy-800 text-white flex items-center justify-center hover:bg-navy-700 transition-colors disabled:opacity-50 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <p className="text-lg font-medium text-navy-800 mb-1">Select a conversation</p>
            <p className="text-sm">Choose from the list on the left to start chatting</p>
          </div>
        </div>
      )}

      {/* Forward dialog */}
      {forwardMsg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-navy-800 mb-4">Forward to...</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conversations.filter((c) => c.peerId !== activePeerId).map(({ peerId }) => {
                const p = peerProfiles[peerId];
                return (
                  <button key={peerId} onClick={() => handleForward(peerId)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {(p?.name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <span className="text-sm text-navy-800">{p?.name || "Unknown"}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setForwardMsg(null)} className="w-full mt-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
      {/* Report dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-navy-800 mb-1">Report User</h3>
            <p className="text-xs text-gray-500 mb-4">Why are you reporting {activePeer?.name || "this user"}?</p>
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
      {/* Delete confirmation modal */}
      {deleteConfirmMsg && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="font-semibold text-navy-800 mb-2">Delete Message</h3>
            <p className="text-sm text-gray-500 mb-5">This message will be deleted for everyone. This can&apos;t be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmMsg(null)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDeleteMsg}
                className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Block confirmation modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h3 className="font-semibold text-navy-800 mb-2">Block User</h3>
            <p className="text-sm text-gray-500 mb-5">They won&apos;t appear in your explore results or matches. You can unblock later.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleBlock}
                className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-colors">Block</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>}>
      <MessagesInner />
    </Suspense>
  );
}
