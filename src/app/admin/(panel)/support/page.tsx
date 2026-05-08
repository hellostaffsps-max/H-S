"use client";

import { useEffect, useState } from "react";
import { Flag, Search, Loader2, Calendar, MessageSquare, CheckCircle, Clock, AlertCircle, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; style: string; icon: typeof CheckCircle }> = {
  open: { label: "جديدة", style: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
  in_progress: { label: "قيد المعالجة", style: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  closed: { label: "مغلقة", style: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
};

export default function SupportManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (e: any) {
      console.error("Error fetching tickets:", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      setTickets(tickets.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (e: any) {
      alert("خطأ في تحديث الحالة: " + e.message);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">البلاغات والدعم</h2>
          <p className="text-slate-500">إدارة رسائل الزوار وتذاكر الدعم الفني</p>
        </div>
        {openCount > 0 && (
          <div className="flex items-center gap-2 text-sm bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-200">
            <AlertCircle className="h-4 w-4" />
            <span className="font-bold">{openCount}</span> تذكرة جديدة تنتظر الرد
          </div>
        )}
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
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                  className="w-full flex items-center justify-between p-5 text-right hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${ticket.status === "open" ? "bg-red-100" : ticket.status === "in_progress" ? "bg-yellow-100" : "bg-green-100"}`}>
                      <MessageSquare className={`h-5 w-5 ${ticket.status === "open" ? "text-red-600" : ticket.status === "in_progress" ? "text-yellow-600" : "text-green-600"}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>{ticket.name}</span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {ticket.email}
                        </span>
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
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/30">
                    <div className="bg-white rounded-xl p-4 border border-slate-100 mb-4">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500">تغيير الحالة:</span>
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => updateStatus(ticket.id, key)}
                          disabled={ticket.status === key}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            ticket.status === key
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          } disabled:cursor-default`}
                        >
                          {val.label}
                        </button>
                      ))}
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
