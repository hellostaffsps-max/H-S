"use client";

import { useEffect, useState } from "react";
import {
  Flag, Search, Loader2, MessageSquare, CheckCircle,
  Clock, AlertCircle, Mail, Send, MessageCircle, X,
  ChevronDown, ChevronUp, User, ShieldAlert, RefreshCw, UserCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Reply {
  id: string;
  ticket_id: string;
  sender_role: "admin" | "user";
  sender_name: string;
  content: string;
  created_at: string;
}

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  user_id: string | null;
  conversation_open: boolean;
  created_at: string;
  replies?: Reply[];
}

const statusConfig: Record<string, { label: string; style: string; icon: typeof CheckCircle }> = {
  open: { label: "جديدة", style: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
  in_progress: { label: "قيد المعالجة", style: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  closed: { label: "مغلقة", style: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
};

const statusLabels: Record<string, string> = {
  open: "جديدة",
  in_progress: "قيد المعالجة",
  closed: "مغلقة",
};

export default function SupportManagement() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch replies for each ticket
      const ticketIds = (data || []).map((t: Ticket) => t.id);
      let repliesMap: Record<string, Reply[]> = {};
      if (ticketIds.length > 0) {
        const { data: repliesData } = await supabase
          .from("ticket_replies")
          .select("*")
          .in("ticket_id", ticketIds)
          .order("created_at", { ascending: true });
        (repliesData || []).forEach((r: Reply) => {
          if (!repliesMap[r.ticket_id]) repliesMap[r.ticket_id] = [];
          repliesMap[r.ticket_id].push(r);
        });
      }

      const enriched = (data || []).map((t: Ticket) => ({
        ...t,
        replies: repliesMap[t.id] || [],
      }));

      setTickets(enriched);
    } catch (e: any) {
      console.error("Error fetching tickets:", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendNotificationToUser(ticket: Ticket, message: string) {
    if (!ticket.user_id) return; // Guest submission - can't send in-app notification
    try {
      await supabase.from("notifications").insert({
        user_id: ticket.user_id,
        title: `تحديث على تذكرة الدعم: ${ticket.subject}`,
        message,
        type: "system",
        link: "/contact",
      });
    } catch (e) {
      console.error("Failed to send notification:", e);
    }
  }

  async function updateStatus(ticket: Ticket, newStatus: string) {
    setUpdatingStatus(ticket.id);
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id);

      if (error) throw error;

      // Send notification to the user
      const msg = `تم تغيير حالة تذكرتك "${ticket.subject}" إلى: ${statusLabels[newStatus]}`;
      await sendNotificationToUser(ticket, msg);

      // Add a system reply in the conversation thread
      if (ticket.conversation_open) {
        await supabase.from("ticket_replies").insert({
          ticket_id: ticket.id,
          sender_role: "admin",
          sender_name: "النظام",
          content: `🔄 تم تغيير حالة التذكرة إلى: ${statusLabels[newStatus]}`,
        });
      }

      setTickets(prev => prev.map(t =>
        t.id === ticket.id ? { ...t, status: newStatus } : t
      ));
      fetchTickets();
    } catch (e: any) {
      alert("خطأ في تحديث الحالة: " + e.message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function acceptStatusChange(ticket: Ticket) {
    if (!ticket.user_id) return;
    const companyName = ticket.subject.replace("[طلب تغيير حالة]", "").trim();
    if (!companyName) return;

    setUpdatingStatus(ticket.id);
    try {
      // Update seeker status
      const { error: seekerError } = await supabase
        .from("seekers")
        .update({ is_available: false, current_employer: companyName })
        .eq("profile_id", ticket.user_id);
      
      if (seekerError) throw seekerError;

      // Update ticket status to closed
      const { error: ticketError } = await supabase
        .from("support_tickets")
        .update({ status: "closed" })
        .eq("id", ticket.id);
      
      if (ticketError) throw ticketError;

      // Add System Reply
      await supabase.from("ticket_replies").insert({
        ticket_id: ticket.id,
        sender_role: "admin",
        sender_name: "النظام",
        content: `✅ تمت الموافقة على طلبك بنجاح. تم تحديث حالتك إلى: يعمل في ${companyName}`,
      });

      // Send Notification
      await sendNotificationToUser(
        ticket, 
        `تمت الموافقة على طلب تحديث الحالة: حالتك الآن يعمل في ${companyName}`
      );

      setTickets(prev => prev.map(t =>
        t.id === ticket.id ? { ...t, status: "closed" } : t
      ));
      
      alert("تم قبول الطلب وتحديث حالة المستخدم بنجاح");
    } catch (e: any) {
      alert("خطأ: " + e.message);
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function toggleConversation(ticket: Ticket) {
    const newOpen = !ticket.conversation_open;
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ conversation_open: newOpen, status: newOpen ? "in_progress" : "closed" })
        .eq("id", ticket.id);

      if (error) throw error;

      // Add system message
      await supabase.from("ticket_replies").insert({
        ticket_id: ticket.id,
        sender_role: "admin",
        sender_name: "النظام",
        content: newOpen
          ? "✅ تم فتح المحادثة من قبل الإدارة. يمكنك الآن التواصل مع فريق الدعم."
          : "🔒 تم إغلاق المحادثة من قبل الإدارة. شكراً لتواصلك مع هيلو ستاف.",
      });

      // Notify user
      const msg = newOpen
        ? `تم فتح محادثة بشأن تذكرتك "${ticket.subject}". فريق الدعم متاح الآن للتحدث معك.`
        : `تم إغلاق المحادثة الخاصة بتذكرتك "${ticket.subject}". نأمل أن تكون مشكلتك قد حُلّت.`;
      await sendNotificationToUser(ticket, msg);

      fetchTickets();
    } catch (e: any) {
      alert("خطأ: " + e.message);
    }
  }

  async function sendReply(ticket: Ticket) {
    const text = replyText[ticket.id]?.trim();
    if (!text) return;

    setSendingReply(ticket.id);
    try {
      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: ticket.id,
        sender_role: "admin",
        sender_name: profile?.full_name || "الإدارة",
        content: text,
      });

      if (error) throw error;

      // Notify user about admin reply
      await sendNotificationToUser(
        ticket,
        `لديك رد جديد من الإدارة بخصوص تذكرتك "${ticket.subject}"`
      );

      setReplyText(prev => ({ ...prev, [ticket.id]: "" }));
      fetchTickets();
    } catch (e: any) {
      alert("خطأ في إرسال الرد: " + e.message);
    } finally {
      setSendingReply(null);
    }
  }

  const filtered = tickets.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCount = tickets.filter(t => t.status === "open").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">البلاغات والدعم</h2>
          <p className="text-slate-500">إدارة رسائل الزوار وتذاكر الدعم الفني</p>
        </div>
        <div className="flex items-center gap-3">
          {openCount > 0 && (
            <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-200">
              <ShieldAlert className="h-4 w-4" />
              <span className="font-bold">{openCount}</span> تذكرة جديدة تنتظر الرد
            </div>
          )}
          <button
            onClick={fetchTickets}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            title="تحديث"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث بالاسم أو الإيميل أو الموضوع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
          <Flag className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">{searchTerm ? "لا توجد نتائج مطابقة" : "لا توجد تذاكر دعم بعد"}</p>
          <p className="text-xs text-slate-400 mt-1">ستظهر هنا رسائل الزوار المرسلة من نموذج &quot;اتصل بنا&quot;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => {
            const config = statusConfig[ticket.status] || statusConfig.open;
            const StatusIcon = config.icon;
            const isExpanded = expandedId === ticket.id;

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all"
              >
                {/* Ticket Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  className="w-full flex items-center justify-between p-5 text-right hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      ticket.status === "open" ? "bg-red-100" :
                      ticket.status === "in_progress" ? "bg-yellow-100" : "bg-green-100"
                    }`}>
                      <MessageSquare className={`h-5 w-5 ${
                        ticket.status === "open" ? "text-red-600" :
                        ticket.status === "in_progress" ? "text-yellow-600" : "text-green-600"
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</p>
                        {ticket.conversation_open && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                            <MessageCircle className="h-2.5 w-2.5" /> محادثة مفتوحة
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{ticket.name}</span>
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{ticket.email}</span>
                        {ticket.replies && ticket.replies.length > 0 && (
                          <span className="text-brand-600 font-bold">{ticket.replies.length} رد</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 mr-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.style}`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:block">
                      {new Date(ticket.created_at).toLocaleDateString("ar-EG")}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* Original Message */}
                    <div className="p-5 bg-slate-50/30">
                      <p className="text-xs font-bold text-slate-500 mb-2">الرسالة الأصلية:</p>
                      <div className="bg-white rounded-xl p-4 border border-slate-100">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                      </div>
                    </div>

                    {/* Conversation Thread */}
                    {ticket.replies && ticket.replies.length > 0 && (
                      <div className="px-5 pb-3 space-y-3">
                        <p className="text-xs font-bold text-slate-500">سجل المحادثة:</p>
                        {ticket.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`flex gap-3 ${reply.sender_role === "admin" ? "flex-row-reverse" : ""}`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              reply.sender_role === "admin"
                                ? "bg-brand-100 text-brand-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {reply.sender_name.charAt(0)}
                            </div>
                            <div className={`flex-1 max-w-[80%] ${reply.sender_role === "admin" ? "items-end" : "items-start"} flex flex-col`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                                reply.sender_role === "admin"
                                  ? "bg-brand-600 text-white rounded-tr-sm"
                                  : reply.sender_name === "النظام"
                                  ? "bg-slate-100 text-slate-600 italic rounded-tl-sm"
                                  : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                              }`}>
                                {reply.content}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1 px-1">
                                {reply.sender_name} · {new Date(reply.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Box (only if conversation is open) */}
                    {ticket.conversation_open && ticket.status !== "closed" && (
                      <div className="px-5 pb-4">
                        <div className="flex gap-2">
                          <textarea
                            value={replyText[ticket.id] || ""}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder="اكتب ردك على المستخدم..."
                            rows={2}
                            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
                          />
                          <button
                            onClick={() => sendReply(ticket)}
                            disabled={sendingReply === ticket.id || !replyText[ticket.id]?.trim()}
                            className="px-4 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 shrink-0 flex items-center gap-2"
                          >
                            {sendingReply === ticket.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      {/* Status Change */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {ticket.user_id && ticket.subject.startsWith("[طلب تغيير حالة]") && ticket.status !== "closed" && (
                          <button
                            onClick={() => acceptStatusChange(ticket)}
                            disabled={updatingStatus === ticket.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70"
                          >
                            {updatingStatus === ticket.id ? <Loader2 className="h-3 w-3 animate-spin inline" /> : <UserCheck className="h-3 w-3" />}
                            قبول طلب التحديث
                          </button>
                        )}
                        <span className="text-xs font-bold text-slate-500 mr-2">تغيير الحالة:</span>
                        {Object.entries(statusConfig).map(([key, val]) => (
                          <button
                            key={key}
                            onClick={() => updateStatus(ticket, key)}
                            disabled={ticket.status === key || updatingStatus === ticket.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              ticket.status === key
                                ? "bg-brand-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            } disabled:cursor-default`}
                          >
                            {updatingStatus === ticket.id && ticket.status !== key ? (
                              <Loader2 className="h-3 w-3 animate-spin inline" />
                            ) : val.label}
                          </button>
                        ))}
                      </div>

                      {/* Open/Close Conversation */}
                      <button
                        onClick={() => toggleConversation(ticket)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          ticket.conversation_open
                            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                            : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        {ticket.conversation_open ? (
                          <><X className="h-4 w-4" /> إغلاق المحادثة</>
                        ) : (
                          <><MessageCircle className="h-4 w-4" /> فتح محادثة</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
