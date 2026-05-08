"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Mail, MapPin, Phone, Loader2, CheckCircle2, AlertCircle, MessageCircle, Send, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { submitContactForm } from "@/app/actions/contact";
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
  subject: string;
  message: string;
  status: string;
  conversation_open: boolean;
  created_at: string;
  replies?: Reply[];
}

const statusLabel: Record<string, { text: string; color: string }> = {
  open: { text: "جديدة", color: "bg-red-100 text-red-700" },
  in_progress: { text: "قيد المعالجة", color: "bg-yellow-100 text-yellow-700" },
  closed: { text: "مغلقة", color: "bg-green-100 text-green-700" },
};

export default function Contact() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // My tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchMyTickets();
  }, [user]);

  async function fetchMyTickets() {
    if (!user) return;
    setTicketsLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch replies
      const ticketIds = (data || []).map((t: Ticket) => t.id);
      let repliesMap: Record<string, Reply[]> = {};
      if (ticketIds.length > 0) {
        const { data: replies } = await supabase
          .from("ticket_replies")
          .select("*")
          .in("ticket_id", ticketIds)
          .order("created_at", { ascending: true });

        (replies || []).forEach((r: Reply) => {
          if (!repliesMap[r.ticket_id]) repliesMap[r.ticket_id] = [];
          repliesMap[r.ticket_id].push(r);
        });
      }

      setTickets((data || []).map((t: Ticket) => ({ ...t, replies: repliesMap[t.id] || [] })));
    } catch (e) {
      console.error("Error fetching tickets:", e);
    } finally {
      setTicketsLoading(false);
    }
  }

  async function sendUserReply(ticket: Ticket) {
    const text = replyText[ticket.id]?.trim();
    if (!text || !profile) return;
    setSendingReply(ticket.id);
    try {
      const { error } = await supabase.from("ticket_replies").insert({
        ticket_id: ticket.id,
        sender_role: "user",
        sender_name: profile.full_name || "مستخدم",
        content: text,
      });
      if (error) throw error;
      setReplyText(prev => ({ ...prev, [ticket.id]: "" }));
      fetchMyTickets();
    } catch (e: any) {
      alert("خطأ في إرسال الرد: " + e.message);
    } finally {
      setSendingReply(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);

    if (result.success) {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      if (user) fetchMyTickets();
    } else {
      setError(result.error || "حدث خطأ");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">نحن هنا لمساعدتك</h1>
        <p className="text-lg text-slate-600">هل لديك استفسار أو مشكلة؟ تواصل مع فريق الدعم الفني لدينا وسنقوم بالرد عليك في أقرب وقت ممكن.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
        <div className="space-y-8">
          {/* Contact Form */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">أرسل رسالة</h2>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-700 text-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p>تم إرسال رسالتك بنجاح! سنقوم بالرد عليك في أقرب وقت.</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم الكامل</label>
                  <input name="name" type="text" required defaultValue={profile?.full_name || ""} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="اسمك الكريم" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">البريد الإلكتروني</label>
                  <input name="email" type="email" required defaultValue={profile?.email || ""} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-left" dir="ltr" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الموضوع</label>
                <input name="subject" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="كيف يمكننا مساعدتك؟" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الرسالة</label>
                <textarea name="message" required rows={5} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="تفاصيل رسالتك..."></textarea>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                إرسال الرسالة
              </button>
            </form>
          </div>

          {/* My Tickets Section */}
          {user && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-brand-600" />
                تذاكر الدعم الخاصة بي
              </h2>
              <p className="text-sm text-slate-500 mb-6">تابع حالة تذاكرك وتواصل مع فريق الدعم</p>

              {ticketsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">لم تقم بإرسال أي تذاكر دعم بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => {
                    const st = statusLabel[ticket.status] || statusLabel.open;
                    const isExpanded = expandedTicket === ticket.id;
                    const hasUnreadAdminReply = ticket.replies?.some(r => r.sender_role === "admin" && r.sender_name !== "النظام");

                    return (
                      <div key={ticket.id} className={`border rounded-2xl overflow-hidden transition-all ${hasUnreadAdminReply ? "border-brand-300 bg-brand-50/30" : "border-slate-100"}`}>
                        <button
                          onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                          className="w-full flex items-center justify-between p-4 text-right hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</p>
                              {hasUnreadAdminReply && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-brand-600 text-white rounded-full font-bold">رد جديد</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>{new Date(ticket.created_at).toLocaleDateString("ar-EG")}</span>
                              {ticket.replies && ticket.replies.length > 0 && (
                                <span className="text-brand-600 font-bold">{ticket.replies.length} رد</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 mr-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.color}`}>{st.text}</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-slate-100 p-4 space-y-3 bg-white">
                            {/* Original message */}
                            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {ticket.message}
                            </div>

                            {/* Replies */}
                            {ticket.replies && ticket.replies.length > 0 && (
                              <div className="space-y-3 pt-2">
                                {ticket.replies.map(reply => (
                                  <div
                                    key={reply.id}
                                    className={`flex gap-2.5 ${reply.sender_role === "user" ? "flex-row-reverse" : ""}`}
                                  >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      reply.sender_role === "admin"
                                        ? "bg-brand-100 text-brand-700"
                                        : "bg-slate-200 text-slate-600"
                                    }`}>
                                      {reply.sender_role === "admin" ? "د" : reply.sender_name.charAt(0)}
                                    </div>
                                    <div className={`flex-1 max-w-[85%] flex flex-col ${reply.sender_role === "user" ? "items-end" : "items-start"}`}>
                                      <div className={`px-3.5 py-2 rounded-2xl text-sm ${
                                        reply.sender_role === "user"
                                          ? "bg-brand-600 text-white rounded-tr-sm"
                                          : reply.sender_name === "النظام"
                                          ? "bg-slate-100 text-slate-500 italic rounded-tl-sm text-xs"
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

                            {/* User reply input */}
                            {ticket.conversation_open && ticket.status !== "closed" ? (
                              <div className="flex gap-2 pt-2">
                                <textarea
                                  value={replyText[ticket.id] || ""}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                  placeholder="اكتب ردك..."
                                  rows={2}
                                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
                                />
                                <button
                                  onClick={() => sendUserReply(ticket)}
                                  disabled={sendingReply === ticket.id || !replyText[ticket.id]?.trim()}
                                  className="px-3 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 shrink-0"
                                >
                                  {sendingReply === ticket.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </button>
                              </div>
                            ) : ticket.status === "closed" ? (
                              <div className="text-center py-2 text-xs text-slate-400 flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                تم إغلاق هذه التذكرة
                              </div>
                            ) : (
                              <div className="text-center py-2 text-xs text-slate-400 flex items-center justify-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                بانتظار فتح المحادثة من قبل الإدارة
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">معلومات التواصل</h3>
            <div className="space-y-6">
              <a href="mailto:support@staffps.com" className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100 group-hover:bg-brand-50 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">البريد الإلكتروني</div>
                  <div className="text-slate-600 text-sm" dir="ltr">support@staffps.com</div>
                </div>
              </a>
              <a href="tel:+970569069686" className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100 group-hover:bg-brand-50 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">رقم الهاتف</div>
                  <div className="text-slate-600 text-sm" dir="ltr">+970 56 906 9686</div>
                </div>
              </a>
              <a href="https://wa.me/970569069686" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-600 shrink-0 shadow-sm border border-slate-100 group-hover:bg-green-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">واتساب</div>
                  <div className="text-slate-600 text-sm" dir="ltr">+970 56 906 9686</div>
                </div>
              </a>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">العنوان</div>
                  <div className="text-slate-600 text-sm">فلسطين</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-3xl border border-brand-100 bg-brand-50 flex gap-4">
            <ShieldCheck className="w-10 h-10 text-brand-600 shrink-0" />
            <div>
              <h4 className="font-bold text-brand-900 mb-1">دعم فني موثوق</h4>
              <p className="text-sm text-brand-700/80 leading-relaxed">فريقنا متواجد للرد على استفساراتكم خلال أوقات العمل الرسمية من الأحد للخميس (9AM - 5PM).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
