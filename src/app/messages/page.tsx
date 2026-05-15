"use client";

import Image from "next/image";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { getConversations, getMessages } from "@/app/actions/messages";
import { supabase } from "../../lib/supabase";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  Lock,
  MessageCircle,
  Send,
  User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  partnerRole: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string; avatar_url: string | null } | null;
}

// ─── Root Wrapper ──────────────────────────────────────────────────────────────
export default function MessagesPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-64px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <MessagesPage />
    </Suspense>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate())
    return formatTime(iso);
  if (diff < 172800000) return "أمس";
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const d = new Date(msg.created_at);
    const label = d.toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const last = groups[groups.length - 1];
    if (last && last.date === label) {
      last.messages.push(msg);
    } else {
      groups.push({ date: label, messages: [msg] });
    }
  });
  return groups;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function MessagesPage() {
  const searchParams = useSearchParams();
  const initialPartner = searchParams.get("with");

  // Auth state
  const [myId, setMyId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  // UI state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(initialPartner);
  const [partnerInfo, setPartnerInfo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [canReply, setCanReply] = useState(true); // default to allowed; only seekers get restricted
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Loading state
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Panel state (mobile)
  const [showChat, setShowChat] = useState(!!initialPartner);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const selectedPartnerRef = useRef(selectedPartnerId);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectedPartnerRef.current = selectedPartnerId;
  }, [selectedPartnerId]);

  // ── Boot ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/user");
        const data = await res.json();
        if (data?.id) {
          setMyId(data.id);
          setMyRole(data.role ?? null);
        }
      } catch {}
    })();
    loadConversations();
  }, []);

  // ── Auto-select conversation from URL ─────────────────────────────────────
  useEffect(() => {
    if (!initialPartner) return;
    setSelectedPartnerId(initialPartner);
    setShowChat(true);
  }, [initialPartner]);

  // ── Load messages when partner changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedPartnerId) return;
    loadMessages(selectedPartnerId);

    // Fetch partner info if not in conversations list
    const existing = conversations.find((c) => c.partnerId === selectedPartnerId);
    if (!existing) fetchPartnerInfo(selectedPartnerId);
  }, [selectedPartnerId]);

  // ── Check seeker reply permission when messages load ─────────────────────
  useEffect(() => {
    if (!myId) return;
    // Only restrict seekers — employers/admins/unknown roles can always send
    if (myRole === "seeker") {
      const hasReceivedMessage = messages.some(
        (m) => m.sender_id === selectedPartnerId && m.receiver_id === myId
      );
      setCanReply(hasReceivedMessage);
    } else {
      // employer, admin, or still loading (null) → allow sending
      setCanReply(true);
    }
  }, [messages, myId, myRole, selectedPartnerId]);

  // ── Real-time subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel(`chat_${myId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${myId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === selectedPartnerRef.current) {
            setMessages((prev) =>
              prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]
            );
            scrollToBottom("smooth");
          }
          loadConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${myId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, is_read: updated.is_read } : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId]);

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    scrollToBottom("instant");
  }, [messages.length]);

  // ─── Functions ──────────────────────────────────────────────────────────────
  async function loadConversations() {
    setLoadingConvs(true);
    const result = await getConversations();
    if (result.success) setConversations(result.data as Conversation[]);
    setLoadingConvs(false);
  }

  async function loadMessages(partnerId: string) {
    setLoadingMsgs(true);
    setMessages([]);
    const result = await getMessages(partnerId);
    if (result.success) setMessages(result.data as Message[]);
    setLoadingMsgs(false);
  }

  async function fetchPartnerInfo(partnerId: string) {
    if (partnerId === "system-broadcasts") {
      setPartnerInfo({
        partnerId,
        partnerName: "إعلانات النظام",
        partnerAvatar: null,
        partnerRole: "system",
        lastMessage: "",
        lastMessageAt: "",
        unreadCount: 0,
      });
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, role")
      .eq("id", partnerId)
      .single();
    if (data) {
      setPartnerInfo({
        partnerId,
        partnerName: data.full_name || "مستخدم",
        partnerAvatar: data.avatar_url || null,
        partnerRole: data.role || null,
        lastMessage: "",
        lastMessageAt: "",
        unreadCount: 0,
      });
    }
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !selectedPartnerId || !myId || sending) return;

    // Block seeker if not allowed
    if (myRole === "seeker" && !canReply) return;

    setNewMessage("");
    setSending(true);

    // Optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: myId,
      receiver_id: selectedPartnerId,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom("smooth");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: myId,
        receiver_id: selectedPartnerId,
        title: "",
        content: text,
      })
      .select()
      .single();

    if (error) {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(text);
      alert(
        error.message.includes("policy")
          ? "لا يمكنك إرسال رسائل إلا بعد أن تتلقى رسالة من المنشأة أولاً."
          : "فشل إرسال الرسالة. حاول مرة أخرى."
      );
    } else {
      // Replace temp with real message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: data.id } : m))
      );
      // Trigger notification via server action (fire and forget)
      try {
        const { sendMessageToUser } = await import("@/app/actions/messages");
        // We already inserted; just need the notification — call a lighter helper
        // Notification is handled by the RLS insert trigger on the server side
        // (already wired in sendMessage action). Since we inserted directly via
        // browser client, we call the notification-only helper here.
        await triggerMessageNotification(selectedPartnerId, text, myId);
      } catch {}
      loadConversations();
    }
    setSending(false);
    inputRef.current?.focus();
  }

  // ─── Derived state ──────────────────────────────────────────────────────────
  const activeConversation =
    conversations.find((c) => c.partnerId === selectedPartnerId) ?? partnerInfo;
  const messageGroups = groupMessagesByDate(messages);
  const isBroadcast = selectedPartnerId === "system-broadcasts";
  const seekerBlocked = myRole === "seeker" && !canReply && !isBroadcast;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-[calc(100dvh-64px)] overflow-hidden"
      style={{ background: "#F0F2F5" }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`${
          showChat ? "hidden" : "flex"
        } md:flex w-full md:w-[340px] lg:w-[380px] flex-col border-l bg-white shrink-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b bg-[#F0F2F5]">
          <h1 className="text-lg font-black text-slate-800">الرسائل</h1>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-600">لا توجد محادثات بعد</p>
              <p className="text-xs text-slate-400 mt-1">ستظهر محادثاتك هنا</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.partnerId === selectedPartnerId;
              return (
                <button
                  key={conv.partnerId}
                  onClick={() => {
                    setSelectedPartnerId(conv.partnerId);
                    setShowChat(true);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F5F6F6] transition-colors text-right ${
                    isActive ? "bg-[#F0F2F5]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      {conv.partnerAvatar ? (
                        <Image
                          src={conv.partnerAvatar}
                          alt=""
                          fill
                          className="object-cover rounded-full"
                          sizes="48px"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {conv.partnerName}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0 mr-2">
                        {formatDate(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 mr-2 min-w-[20px] h-5 bg-[#25D366] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1">
                          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Chat Area ──────────────────────────────────────────────────────── */}
      <main
        className={`${
          showChat ? "flex" : "hidden"
        } md:flex flex-1 flex-col min-w-0`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#F0F2F5] border-b border-slate-200">
              <button
                onClick={() => setShowChat(false)}
                className="md:hidden p-1.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>

              <div className="relative w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {activeConversation.partnerAvatar ? (
                  <Image
                    src={activeConversation.partnerAvatar}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">
                  {activeConversation.partnerName}
                </p>
                <p className="text-[11px] text-slate-500">
                  {activeConversation.partnerRole === "employer"
                    ? "منشأة"
                    : activeConversation.partnerRole === "seeker"
                    ? "باحث عن عمل"
                    : activeConversation.partnerRole === "admin"
                    ? "مدير النظام"
                    : ""}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={chatAreaRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                backgroundColor: "#E5DDD5",
              }}
            >
              {loadingMsgs ? (
                <div className="flex justify-center py-16">
                  <div className="bg-white/80 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                    <span className="text-sm text-slate-600">جارٍ تحميل الرسائل...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center py-16">
                  <div className="bg-[#FFF9C4] text-[#5C4A00] text-sm rounded-xl px-5 py-2.5 shadow-sm max-w-xs text-center">
                    {isBroadcast
                      ? "الرسائل الإدارية تظهر هنا"
                      : "لا توجد رسائل بعد. ابدأ المحادثة!"}
                  </div>
                </div>
              ) : (
                messageGroups.map((group) => (
                  <div key={group.date}>
                    {/* Date Label */}
                    <div className="flex justify-center my-4">
                      <span className="bg-[#FFF9C4] text-[#5C4A00] text-[11px] font-bold rounded-full px-3 py-1 shadow-sm">
                        {group.date}
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="space-y-1">
                      {group.messages.map((msg) => {
                        const isMe = msg.sender_id === myId;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`relative max-w-[72%] md:max-w-[55%] px-3 pt-2 pb-1.5 rounded-2xl shadow-sm ${
                                isMe
                                  ? "bg-[#D9FDD3] rounded-tr-sm"
                                  : "bg-white rounded-tl-sm"
                              }`}
                            >
                              <p
                                className="text-sm text-slate-800 leading-relaxed pr-2"
                                style={{ wordBreak: "break-word" }}
                              >
                                {msg.content}
                              </p>
                              <div
                                className={`flex items-center gap-1 mt-0.5 ${
                                  isMe ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span className="text-[10px] text-slate-400">
                                  {formatTime(msg.created_at)}
                                </span>
                                {isMe && (
                                  <span className="text-[#53BDEB]">
                                    {msg.is_read ? (
                                      <CheckCheck className="w-3.5 h-3.5" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            {isBroadcast ? (
              <div className="bg-[#F0F2F5] border-t border-slate-200 px-4 py-4 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">
                  هذه القناة مخصصة للإعلانات الإدارية فقط
                </span>
              </div>
            ) : seekerBlocked ? (
              <div className="bg-[#F0F2F5] border-t border-slate-200 px-4 py-4 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500 text-center">
                  يمكنك الرد فقط بعد أن تتلقى رسالة من المنشأة أولاً
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2 px-3 py-3 bg-[#F0F2F5] border-t border-slate-200"
              >
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 px-4 py-2.5 shadow-sm">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as any);
                      }
                    }}
                    placeholder="اكتب رسالتك..."
                    className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                    dir="auto"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="w-11 h-11 rounded-full bg-[#00A884] hover:bg-[#008f6f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors shadow-md"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </form>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6"
            style={{ backgroundColor: "#F0F2F5" }}
          >
            <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-700 mb-2">
              مرحباً بك في الرسائل
            </h2>
            <p className="text-sm text-slate-500 max-w-xs">
              اختر محادثة من القائمة لعرض الرسائل والتواصل
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Notification helper (client-side trigger) ────────────────────────────────
async function triggerMessageNotification(
  receiverId: string,
  content: string,
  senderId: string
) {
  // We call sendMessageToUser which handles the notification but NOT the insert
  // (insert already happened). We use a dedicated action for notification only.
  // This is a best-effort call.
  try {
    const resp = await fetch("/api/messages/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId, content }),
    });
  } catch {}
}
