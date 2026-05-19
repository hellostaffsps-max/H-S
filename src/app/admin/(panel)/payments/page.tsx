"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Receipt, Search, Loader2, Calendar, CreditCard, ExternalLink, CheckCircle, Clock, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Subscription {
  id: string;
  status: string;
  plan_name: string;
  amount: number | null;
  payment_method: string | null;
  payment_receipt_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  subscription_plans: {
    target_role: string;
    price: number;
  } | null;
}

const statusConfig: Record<string, { label: string; style: string; icon: typeof CheckCircle }> = {
  active: { label: "فعال", style: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  pending: { label: "معلق", style: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  expired: { label: "منتهي", style: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  canceled: { label: "ملغى", style: "bg-slate-50 text-slate-600 border-slate-200", icon: XCircle },
};

export default function PaymentsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "employer" | "seeker">("all");

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("id, status, plan_name, payment_receipt_url, starts_at, ends_at, created_at, profiles(full_name, email, avatar_url), subscription_plans(target_role, price)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      const normalized = (data || []).map((sub: any) => ({
        ...sub,
        profiles: Array.isArray(sub.profiles) && sub.profiles.length > 0 ? sub.profiles[0] : sub.profiles,
        subscription_plans: Array.isArray(sub.subscription_plans) && sub.subscription_plans.length > 0 ? sub.subscription_plans[0] : sub.subscription_plans,
      }));
      setSubscriptions(normalized);
    } catch (e: any) {
      console.error("Error fetching subscriptions:", e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = subscriptions.filter((sub) => {
    const matchesSearch = 
      sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      filterType === "all" || 
      sub.subscription_plans?.target_role === filterType;

    return matchesSearch && matchesRole;
  });

  const totalRevenue = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.amount || s.subscription_plans?.price || 0), 0);

  const employerRevenue = subscriptions
    .filter((s) => s.status === "active" && s.subscription_plans?.target_role === "employer")
    .reduce((sum, s) => sum + (s.amount || s.subscription_plans?.price || 0), 0);

  const seekerRevenue = subscriptions
    .filter((s) => s.status === "active" && s.subscription_plans?.target_role === "seeker")
    .reduce((sum, s) => sum + (s.amount || s.subscription_plans?.price || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">الدفع والفواتير</h2>
          <p className="text-slate-500">سجل اشتراكات ومدفوعات المستخدمين</p>
        </div>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">إجمالي الإيرادات</p>
          <p className="text-2xl font-black text-slate-900">{totalRevenue.toLocaleString()} ₪</p>
          <div className="mt-2 text-[10px] text-slate-400 font-bold">الاشتراكات الفعالة فقط</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">إيرادات الشركات</p>
          <p className="text-2xl font-black text-brand-600">{employerRevenue.toLocaleString()} ₪</p>
          <div className="mt-2 text-[10px] text-brand-400 font-bold">
            {subscriptions.filter(s => s.status === "active" && s.subscription_plans?.target_role === "employer").length} اشتراك فعال
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">إيرادات الموظفين</p>
          <p className="text-2xl font-black text-indigo-600">{seekerRevenue.toLocaleString()} ₪</p>
          <div className="mt-2 text-[10px] text-indigo-400 font-bold">
            {subscriptions.filter(s => s.status === "active" && s.subscription_plans?.target_role === "seeker").length} اشتراك فعال
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">بانتظار المراجعة</p>
          <p className="text-2xl font-black text-amber-600">
            {subscriptions.filter(s => s.status === "pending").length}
          </p>
          <div className="mt-2 text-[10px] text-amber-400 font-bold">تحتاج تأكيد الدفع</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button 
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilterType("employer")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === "employer" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            الشركات
          </button>
          <button 
            onClick={() => setFilterType("seeker")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterType === "seeker" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            الموظفين
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="البحث بالعميل أو الباقة أو الإيميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">المستخدم</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الباقة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">المبلغ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الحالة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الفترة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الإيصال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    {searchTerm ? "لا توجد نتائج مطابقة" : "لا توجد اشتراكات بعد"}
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const config = statusConfig[sub.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0 overflow-hidden">
                            {sub.profiles?.avatar_url ? (
                              <Image src={sub.profiles.avatar_url} alt="" fill className="object-cover rounded-full" sizes="36px" />
                            ) : (
                              <span className="text-sm font-bold text-brand-600">
                                {sub.profiles?.full_name?.charAt(0) || "م"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{sub.profiles?.full_name || "مستخدم"}</p>
                            <p className="text-xs text-slate-500">{sub.profiles?.email || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 rounded-lg text-[11px] font-bold">
                            <CreditCard className="h-3 w-3" />
                            {sub.plan_name}
                          </span>
                          {sub.subscription_plans?.target_role === "seeker" ? (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">موظف (أكاديمية)</span>
                          ) : (
                            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md w-fit">صاحب عمل</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900">
                        {sub.amount || sub.subscription_plans?.price ? `${(sub.amount || sub.subscription_plans?.price)?.toLocaleString()} ₪` : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.style}`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="space-y-0.5">
                          {sub.starts_at && <div>من: {new Date(sub.starts_at).toLocaleDateString("ar-EG")}</div>}
                          {sub.ends_at && <div>إلى: {new Date(sub.ends_at).toLocaleDateString("ar-EG")}</div>}
                          {!sub.starts_at && !sub.ends_at && <span>—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {sub.payment_receipt_url ? (
                          <a
                            href={sub.payment_receipt_url.startsWith('http') ? sub.payment_receipt_url : `/api/admin/receipt?path=${encodeURIComponent(sub.payment_receipt_url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            عرض
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
