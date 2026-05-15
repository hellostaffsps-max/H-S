"use client";

import Image from "next/image";
import { Suspense, useEffect, useRef, useState } from "react";
import { getConversations, getMessages } from "@/app/actions/messages";
import { supabase } from "../../lib/supabase";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Check, CheckCheck, Loader2, Lock,
  MessageCircle, MoreVertical, Send, Trash2, User, X,
} from "lucide-react";

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

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100dvh-64px)] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>}>
      <MessagesPage />
    </Suspense>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(iso);
  const diff = now.getTime() - d.getTime();
  if (diff < 172800000) return "أمس";
  return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
}

function groupByDate(msgs: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  msgs.forEach((m) => {
    const label = new Date(m.created_at).toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" });
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.messages.push(m);
    else groups.push({ label, messages: [m] });
  });
  return groups;
}

function MessagesPage() {
  const searchParams = useSearchParams();
  const initialPartner = searchParams.get("with");

  const [myId, setMyId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(initialPartner);
  const [partnerInfo, setPartnerInfo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [showChat, setShowChat] = useState(!!initialPartner);
  // Delete state
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showConvMenu, setShowConvMenu] = useState(false);
  const [deletingConv, setDeletingConv] = useState(false);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedPartnerRef = useRef(selectedPartnerId);
  useEffect(() => { selectedPartnerRef.current = selectedPartnerId; }, [selectedPartnerId]);

  // ── Seeker reply permission: true by default, only false when confirmed seeker with no received messages (and not verified)
  const isSeeker = myRole === "seeker";
  const canReply = !isSeeker || isVerified || messages.some((m) => m.sender_id === selectedPartnerId && m.receiver_id === myId);
  const isBroadcast = selectedPartnerId === "system-broadcasts";

  // ── Boot
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/user");
        const data = await res.json();
        if (data?.id) { 
          setMyId(data.id); 
          setMyRole(data.role ?? null); 
          
          if (data.role === 'seeker') {
            const { data: seeker } = await supabase.from('seekers').select('verification_status').eq('profile_id', data.id).single();
            if (seeker?.verification_status === 'verified') setIsVerified(true);
          }
        }
      } catch {}
    })();
    loadConversations();
  }, []);

  useEffect(() => {
    if (initialPartner) { setSelectedPartnerId(initialPartner); setShowChat(true); }
  }, [initialPartner]);

  useEffect(() => {
    if (!selectedPartnerId) return;
    setSelectMode(false);
    setSelectedMsgIds(new Set());
    loadMessages(selectedPartnerId);
    const existing = conversations.find((c) => c.partnerId === selectedPartnerId);
    if (!existing) fetchPartnerInfo(selectedPartnerId);
  }, [selectedPartnerId]);

  // ── Real-time
  useEffect(() => {
    if (!myId) return;
    const ch = supabase.channel(`chat_${myId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${myId}` }, (p) => {
        const msg = p.new as Message;
        if (msg.sender_id === selectedPartnerRef.current)
          setMessages((prev) => prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]);
        loadConversations();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, (p) => {
        const old = p.old as { id: string };
        setMessages((prev) => prev.filter((m) => m.id !== old.id));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `sender_id=eq.${myId}` }, (p) => {
        const updated = p.new as Message;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, is_read: updated.is_read } : m));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [myId]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  // ── Data fetchers
  async function loadConversations() {
    setLoadingConvs(true);
    const r = await getConversations();
    if (r.success) setConversations(r.data as Conversation[]);
    setLoadingConvs(false);
  }

  async function loadMessages(partnerId: string) {
    setLoadingMsgs(true);
    setMessages([]);
    const r = await getMessages(partnerId);
    if (r.success) setMessages(r.data as Message[]);
    setLoadingMsgs(false);
  }

  async function fetchPartnerInfo(partnerId: string) {
    if (partnerId === "system-broadcasts") {
      setPartnerInfo({ partnerId, partnerName: "إعلانات النظام", partnerAvatar: null, partnerRole: "system", lastMessage: "", lastMessageAt: "", unreadCount: 0 });
      return;
    }
    const { data } = await supabase.from("profiles").select("full_name, avatar_url, role").eq("id", partnerId).single();
    if (data) setPartnerInfo({ partnerId, partnerName: data.full_name || "مستخدم", partnerAvatar: data.avatar_url || null, partnerRole: data.role || null, lastMessage: "", lastMessageAt: "", unreadCount: 0 });
  }

  function scrollToBottom() {
    const el = chatAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ── Send message
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !selectedPartnerId || !myId || sending) return;
    setNewMessage("");
    setSending(true);

    const tempId = `temp_${Date.now()}`;
    const optimistic: Message = { id: tempId, sender_id: myId, receiver_id: selectedPartnerId, content: text, is_read: false, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    const { data, error } = await supabase.from("messages").insert({ sender_id: myId, receiver_id: selectedPartnerId, title: "", content: text }).select().single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(text);
      alert("فشل إرسال الرسالة. حاول مرة أخرى.");
    } else {
      setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, id: data.id } : m));
      // Fire notification in background
      fetch("/api/messages/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: selectedPartnerId, content: text }) }).catch(() => {});
      loadConversations();
    }
    setSending(false);
    inputRef.current?.focus();
  }

  // ── Delete selected messages
  async function handleDeleteMessages() {
    if (!myId || selectedMsgIds.size === 0) return;
    const ids = Array.from(selectedMsgIds);
    const { error } = await supabase.from("messages").delete().in("id", ids).eq("sender_id", myId);
    if (!error) {
      setMessages((prev) => prev.filter((m) => !selectedMsgIds.has(m.id)));
      setSelectedMsgIds(new Set());
      setSelectMode(false);
      loadConversations();
    } else {
      alert("لا يمكن حذف رسائل الطرف الآخر.");
    }
  }

  // ── Delete entire conversation
  async function handleDeleteConversation() {
    if (!myId || !selectedPartnerId || deletingConv) return;
    setDeletingConv(true);
    // Delete only MY messages in this conversation (RLS: sender_id = auth.uid())
    await supabase.from("messages").delete()
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${selectedPartnerId})`);
    setMessages([]);
    setConversations((prev) => prev.filter((c) => c.partnerId !== selectedPartnerId));
    setSelectedPartnerId(null);
    setShowChat(false);
    setShowConvMenu(false);
    setDeletingConv(false);
  }

  const activeConv = conversations.find((c) => c.partnerId === selectedPartnerId) ?? partnerInfo;
  const groups = groupByDate(messages);

  function toggleMsgSelect(id: string, isMine: boolean) {
    if (!isMine) return; // can only select own messages
    setSelectedMsgIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="flex h-[calc(100dvh-64px)] overflow-hidden" style={{ background: "#F0F2F5" }}>

      {/* ── Sidebar */}
      <aside className={`${showChat ? "hidden" : "flex"} md:flex w-full md:w-[340px] lg:w-[380px] flex-col border-l bg-white shrink-0`}>
        <div className="flex items-center px-4 py-4 border-b bg-[#F0F2F5]">
          <h1 className="text-lg font-black text-slate-800">الرسائل</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"><MessageCircle className="w-8 h-8 text-slate-300" /></div>
              <p className="text-sm font-bold text-slate-600">لا توجد محادثات بعد</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.partnerId === selectedPartnerId;
              return (
                <button key={conv.partnerId} onClick={() => { setSelectedPartnerId(conv.partnerId); setShowChat(true); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F5F6F6] transition-colors text-right ${isActive ? "bg-[#F0F2F5]" : ""}`}>
                  <div className="relative shrink-0 w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {conv.partnerAvatar ? <Image src={conv.partnerAvatar} alt="" fill className="object-cover rounded-full" sizes="48px" /> : <User className="w-6 h-6 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-bold text-slate-900 truncate">{conv.partnerName}</span>
                      <span className="text-[11px] text-slate-400 shrink-0 mr-2">{formatDate(conv.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                      {conv.unreadCount > 0 && <span className="shrink-0 mr-2 min-w-[20px] h-5 bg-[#25D366] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1">{conv.unreadCount > 99 ? "99+" : conv.unreadCount}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Chat */}
      <main className={`${showChat ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#F0F2F5] border-b border-slate-200">
              <button onClick={() => { setShowChat(false); setSelectMode(false); setSelectedMsgIds(new Set()); }} className="md:hidden p-1.5 rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="relative w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {activeConv.partnerAvatar ? <Image src={activeConv.partnerAvatar} alt="" fill className="object-cover" sizes="40px" /> : <User className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{activeConv.partnerName}</p>
                <p className="text-[11px] text-slate-500">{activeConv.partnerRole === "employer" ? "منشأة" : activeConv.partnerRole === "seeker" ? "باحث عن عمل" : activeConv.partnerRole === "admin" ? "مدير النظام" : ""}</p>
              </div>

              {/* Header actions */}
              {selectMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-bold">{selectedMsgIds.size} محدد</span>
                  {selectedMsgIds.size > 0 && (
                    <button onClick={handleDeleteMessages} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  )}
                  <button onClick={() => { setSelectMode(false); setSelectedMsgIds(new Set()); }} className="p-1.5 rounded-full hover:bg-slate-200 transition-colors">
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button onClick={() => setShowConvMenu((v) => !v)} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-600" />
                  </button>
                  {showConvMenu && (
                    <div className="absolute left-0 top-10 bg-white rounded-xl shadow-lg border border-slate-100 z-50 w-48 overflow-hidden">
                      <button onClick={() => { setSelectMode(true); setShowConvMenu(false); }} className="w-full text-right px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> تحديد رسائل للحذف
                      </button>
                      <button onClick={handleDeleteConversation} disabled={deletingConv} className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50">
                        <Trash2 className="w-4 h-4" /> {deletingConv ? "جارٍ الحذف..." : "حذف المحادثة"}
                      </button>
                      <button onClick={() => setShowConvMenu(false)} className="w-full text-right px-4 py-3 text-sm text-slate-500 hover:bg-slate-50">إغلاق</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages area */}
            <div
              ref={chatAreaRef}
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", backgroundColor: "#E5DDD5" }}
              onClick={() => { if (showConvMenu) setShowConvMenu(false); }}>
              {loadingMsgs ? (
                <div className="flex justify-center py-16">
                  <div className="bg-white/80 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                    <span className="text-sm text-slate-600">جارٍ تحميل الرسائل...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center py-16">
                  <div className="bg-[#FFF9C4] text-[#5C4A00] text-sm rounded-xl px-5 py-2.5 shadow-sm text-center">
                    {isBroadcast ? "الرسائل الإدارية تظهر هنا" : "لا توجد رسائل. ابدأ المحادثة!"}
                  </div>
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.label}>
                    <div className="flex justify-center my-4">
                      <span className="bg-[#FFF9C4] text-[#5C4A00] text-[11px] font-bold rounded-full px-3 py-1 shadow-sm">{g.label}</span>
                    </div>
                    <div className="space-y-1">
                      {g.messages.map((msg) => {
                        const isMe = msg.sender_id === myId;
                        const isSelected = selectedMsgIds.has(msg.id);
                        return (
                          <div key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"} ${selectMode && isMe ? "cursor-pointer" : ""}`}
                            onClick={() => selectMode && toggleMsgSelect(msg.id, isMe)}>
                            {selectMode && isMe && (
                              <div className={`self-center ml-2 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "bg-brand-600 border-brand-600" : "border-slate-400 bg-white"}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            )}
                            <div className={`relative max-w-[72%] md:max-w-[55%] px-3 pt-2 pb-1.5 rounded-2xl shadow-sm transition-all ${isMe ? "bg-[#D9FDD3] rounded-tr-sm" : "bg-white rounded-tl-sm"} ${isSelected ? "ring-2 ring-brand-400" : ""}`}>
                              <p className="text-sm text-slate-800 leading-relaxed" style={{ wordBreak: "break-word" }}>{msg.content}</p>
                              <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                <span className="text-[10px] text-slate-400">{formatTime(msg.created_at)}</span>
                                {isMe && (msg.is_read ? <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" /> : <Check className="w-3.5 h-3.5 text-slate-400" />)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            {isBroadcast ? (
              <div className="bg-[#F0F2F5] border-t border-slate-200 px-4 py-4 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">هذه القناة مخصصة للإعلانات الإدارية فقط</span>
              </div>
            ) : isSeeker && !canReply ? (
              <div className="bg-[#F0F2F5] border-t border-slate-200 px-4 py-4 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500 text-center">يمكنك الرد فقط بعد أن تتلقى رسالة من المنشأة أولاً</span>
              </div>
            ) : selectMode ? null : (
              <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 bg-[#F0F2F5] border-t border-slate-200">
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 px-4 py-2.5 shadow-sm">
                  <input ref={inputRef} type="text" value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                    placeholder="اكتب رسالتك..." className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent" dir="auto" />
                </div>
                <button type="submit" disabled={sending || !newMessage.trim()}
                  className="w-11 h-11 rounded-full bg-[#00A884] hover:bg-[#008f6f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors shadow-md">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6" style={{ backgroundColor: "#F0F2F5" }}>
            <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mb-6"><MessageCircle className="w-12 h-12 text-slate-300" /></div>
            <h2 className="text-xl font-black text-slate-700 mb-2">مرحباً بك في الرسائل</h2>
            <p className="text-sm text-slate-500 max-w-xs">اختر محادثة من القائمة لعرض الرسائل والتواصل</p>
          </div>
        )}
      </main>
    </div>
  );
}
