"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  getConversations,
  getMessages,
  sendMessage,
  getUnreadMessagesCount,
} from "@/app/actions/messages";
import { supabase } from "../../lib/supabase";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  User,
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
  sender: { full_name: string; avatar_url: string | null } | null;
}

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">الرسائل</h1>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm h-[70vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      </div>
    }>
      <MessagesPage />
    </Suspense>
  );
}

function MessagesPage() {
  const searchParams = useSearchParams();
  const initialPartner = searchParams.get("with");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(
    initialPartner
  );
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    loadConversations();
    getMyId();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      loadMessages(selectedPartner);
      setMobileOpen(true);
      // If partner is not in conversations list, fetch their info
      const existing = conversations.find((c) => c.partnerId === selectedPartner);
      if (!existing) {
        fetchPartnerInfo(selectedPartner);
      }
    }
  }, [selectedPartner, conversations]);

  async function fetchPartnerInfo(partnerId: string) {
    try {
      const res = await fetch("/api/auth/user");
      const currentUser = await res.json();
      // Fetch partner profile from Supabase
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
        });
      }
    } catch {
      setPartnerInfo(null);
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function getMyId() {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      if (data?.id) setMyId(data.id);
    } catch {
      setMyId(null);
    }
  }

  async function loadConversations() {
    setLoadingConversations(true);
    const result = await getConversations();
    if (result.success) {
      setConversations(result.data as Conversation[]);
    }
    setLoadingConversations(false);
  }

  async function loadMessages(partnerId: string) {
    setLoadingMessages(true);
    const result = await getMessages(partnerId);
    if (result.success) {
      setMessages(result.data as Message[]);
    }
    setLoadingMessages(false);
  }

  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel("realtime_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${myId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // If the message is from the currently selected partner, add it to messages
          if (newMsg.sender_id === selectedPartner) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
          // Refresh conversations list to update last message and unread count
          loadConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${myId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // If we sent the message to the current partner, it's already added by handleSend locally,
          // but we sync it here just in case or for multi-tab sync.
          if (newMsg.receiver_id === selectedPartner) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, selectedPartner]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    const msgContent = newMessage.trim();
    setNewMessage(""); // Clear early for better UX
    setSending(true);
    
    const formData = new FormData();
    formData.append("receiver_id", selectedPartner);
    formData.append("content", msgContent);

    const result = await sendMessage(formData);
    if (!result.success) {
      alert("فشل إرسال الرسالة");
      setNewMessage(msgContent); // Restore content on failure
    } else {
      // Message will be added via Realtime subscription or we could add it manually for even faster feel
      await loadConversations();
    }
    setSending(false);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const selectedConversation =
    conversations.find((c) => c.partnerId === selectedPartner) || partnerInfo;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">الرسائل</h1>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[70vh]">
        {/* Conversations list */}
        <div
          className={`w-full md:w-80 border-l border-slate-200 bg-slate-50/50 flex flex-col ${
            mobileOpen ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-700">المحادثات</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  لا توجد محادثات بعد
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedPartner(conv.partnerId)}
                    className={`w-full text-right p-4 hover:bg-white transition-colors flex items-start gap-3 ${
                      selectedPartner === conv.partnerId
                        ? "bg-white border-r-2 border-brand-500"
                        : ""
                    }`}
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      {conv.partnerAvatar ? (
                        <img
                          src={conv.partnerAvatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {conv.partnerName}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(conv.lastMessageAt).toLocaleDateString(
                          "ar-EG"
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          className={`flex-1 flex flex-col ${
            mobileOpen ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-200 bg-slate-50/50">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="md:hidden p-1 hover:bg-slate-200 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                  {selectedConversation.partnerAvatar ? (
                    <img
                      src={selectedConversation.partnerAvatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedConversation.partnerName}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedConversation.partnerRole === "employer"
                      ? "صاحب عمل"
                      : selectedConversation.partnerRole === "seeker"
                      ? "باحث عن عمل"
                      : selectedConversation.partnerRole === "admin"
                      ? "مدير"
                      : ""}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    لا توجد رسائل بعد
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === myId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isMe ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-brand-600 text-white rounded-bl-md"
                              : "bg-slate-100 text-slate-800 rounded-br-md"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span
                            className={`text-[10px] mt-1 block ${
                              isMe ? "text-brand-100" : "text-slate-400"
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString(
                              "ar-EG",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="p-4 border-t border-slate-200 bg-white"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="p-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle className="w-12 h-12 mb-3" />
              <p className="text-sm">اختر محادثة لعرض الرسائل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
