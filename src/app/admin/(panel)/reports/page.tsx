"use client";

import { useEffect, useState } from "react";
import {
  BarChart3, Users, Briefcase, FileText, CreditCard, Flag,
  TrendingUp, TrendingDown, Loader2, RefreshCw, Building2,
  UserSearch, Eye, Send, Clock, CheckCircle, XCircle, ArrowUpRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Stats {
  totalUsers: number;
  totalEmployers: number;
  totalSeekers: number;
  totalJobs: number;
  totalApplications: number;
  totalArticles: number;
  publishedArticles: number;
  pendingArticles: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalTickets: number;
  openTickets: number;
  totalMessages: number;
  // Recent trends (last 7 days)
  newUsersLast7: number;
  newJobsLast7: number;
  newAppsLast7: number;
  newTicketsLast7: number;
  // Role breakdown
  adminCount: number;
}

interface RecentItem {
  id: string;
  label: string;
  sub: string;
  date: string;
  type: "user" | "job" | "app" | "article" | "ticket";
}

export default function ReportsManagement() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    fetchAllStats();
  }, []);

  async function fetchAllStats() {
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const [
        profilesRes,
        employersRes,
        seekersRes,
        jobsRes,
        appsRes,
        articlesRes,
        subsRes,
        ticketsRes,
        messagesRes,
        newUsersRes,
        newJobsRes,
        newAppsRes,
        newTicketsRes,
        recentUsersRes,
        recentJobsRes,
        recentTicketsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id, role", { count: "exact", head: true }),
        supabase.from("employers").select("id", { count: "exact", head: true }),
        supabase.from("seekers").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id, status", { count: "exact" }),
        supabase.from("user_subscriptions").select("id, status", { count: "exact" }),
        supabase.from("support_tickets").select("id, status", { count: "exact" }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        // Last 7 days
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("applications").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        // Recent items
        supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("jobs").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("support_tickets").select("id, subject, name, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      // Count articles by status
      const allArticles = articlesRes.data || [];
      const publishedArticles = allArticles.filter((a: any) => a.status === "published").length;
      const pendingArticles = allArticles.filter((a: any) => a.status === "pending_approval").length;

      // Count subscriptions by status
      const allSubs = subsRes.data || [];
      const activeSubs = allSubs.filter((s: any) => s.status === "active").length;

      // Count tickets by status
      const allTickets = ticketsRes.data || [];
      const openTickets = allTickets.filter((t: any) => t.status === "open").length;

      // Admin count
      const profilesData = await supabase.from("profiles").select("role").eq("role", "admin");
      const adminCount = profilesData.data?.length || 0;

      setStats({
        totalUsers: profilesRes.count || 0,
        totalEmployers: employersRes.count || 0,
        totalSeekers: seekersRes.count || 0,
        totalJobs: jobsRes.count || 0,
        totalApplications: appsRes.count || 0,
        totalArticles: articlesRes.count || allArticles.length,
        publishedArticles,
        pendingArticles,
        totalSubscriptions: subsRes.count || allSubs.length,
        activeSubscriptions: activeSubs,
        totalTickets: ticketsRes.count || allTickets.length,
        openTickets,
        totalMessages: messagesRes.count || 0,
        newUsersLast7: newUsersRes.count || 0,
        newJobsLast7: newJobsRes.count || 0,
        newAppsLast7: newAppsRes.count || 0,
        newTicketsLast7: newTicketsRes.count || 0,
        adminCount,
      });

      // Build recent items
      const items: RecentItem[] = [];
      (recentUsersRes.data || []).forEach((u: any) =>
        items.push({ id: u.id, label: u.full_name || "مستخدم جديد", sub: u.role === "employer" ? "صاحب عمل" : u.role === "seeker" ? "باحث عن عمل" : "مدير", date: u.created_at, type: "user" })
      );
      (recentJobsRes.data || []).forEach((j: any) =>
        items.push({ id: j.id, label: j.title, sub: "وظيفة", date: j.created_at, type: "job" })
      );
      (recentTicketsRes.data || []).forEach((t: any) =>
        items.push({ id: t.id, label: t.subject, sub: t.name, date: t.created_at, type: "ticket" })
      );
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentItems(items.slice(0, 10));
    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const statCards = [
    { label: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, color: "brand", trend: stats.newUsersLast7, trendLabel: "هذا الأسبوع" },
    { label: "أصحاب العمل", value: stats.totalEmployers, icon: Building2, color: "blue" },
    { label: "الباحثون عن عمل", value: stats.totalSeekers, icon: UserSearch, color: "emerald" },
    { label: "الوظائف المنشورة", value: stats.totalJobs, icon: Briefcase, color: "violet", trend: stats.newJobsLast7, trendLabel: "هذا الأسبوع" },
    { label: "طلبات التوظيف", value: stats.totalApplications, icon: Send, color: "amber", trend: stats.newAppsLast7, trendLabel: "هذا الأسبوع" },
    { label: "المقالات المنشورة", value: stats.publishedArticles, icon: FileText, color: "orange", extra: stats.pendingArticles > 0 ? `${stats.pendingArticles} بانتظار المراجعة` : undefined },
    { label: "الاشتراكات النشطة", value: stats.activeSubscriptions, icon: CreditCard, color: "green", extra: `${stats.totalSubscriptions} إجمالي` },
    { label: "تذاكر الدعم المفتوحة", value: stats.openTickets, icon: Flag, color: "red", extra: `${stats.totalTickets} إجمالي`, trend: stats.newTicketsLast7, trendLabel: "هذا الأسبوع" },
  ];

  const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
    brand: { bg: "bg-brand-50", icon: "text-brand-600", ring: "ring-brand-500/10" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-500/10" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-500/10" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600", ring: "ring-violet-500/10" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-500/10" },
    orange: { bg: "bg-orange-50", icon: "text-orange-600", ring: "ring-orange-500/10" },
    green: { bg: "bg-green-50", icon: "text-green-600", ring: "ring-green-500/10" },
    red: { bg: "bg-red-50", icon: "text-red-600", ring: "ring-red-500/10" },
  };

  const typeIcons: Record<string, { icon: typeof Users; color: string }> = {
    user: { icon: Users, color: "text-brand-600 bg-brand-50" },
    job: { icon: Briefcase, color: "text-violet-600 bg-violet-50" },
    app: { icon: Send, color: "text-amber-600 bg-amber-50" },
    article: { icon: FileText, color: "text-orange-600 bg-orange-50" },
    ticket: { icon: Flag, color: "text-red-600 bg-red-50" },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">التقارير والإحصائيات</h2>
          <p className="text-slate-500">نظرة شاملة على أداء المنصة</p>
        </div>
        <button
          onClick={fetchAllStats}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث البيانات
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const cm = colorMap[card.color] || colorMap.brand;
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all ring-1 ${cm.ring}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${cm.bg}`}>
                  <Icon className={`h-5 w-5 ${cm.icon}`} />
                </div>
                {card.trend !== undefined && card.trend > 0 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="h-3 w-3" />
                    +{card.trend}
                  </div>
                )}
              </div>
              <p className="text-3xl font-black text-slate-900 mb-1">{card.value.toLocaleString("ar-EG")}</p>
              <p className="text-sm text-slate-500 font-medium">{card.label}</p>
              {card.extra && (
                <p className="text-xs text-slate-400 mt-1">{card.extra}</p>
              )}
              {card.trendLabel && card.trend !== undefined && card.trend > 0 && (
                <p className="text-[10px] text-green-600 mt-0.5">{card.trendLabel}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              آخر النشاطات
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              آخر 10
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {recentItems.map((item) => {
              const ti = typeIcons[item.type] || typeIcons.user;
              const ItemIcon = ti.icon;
              return (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className={`p-2 rounded-xl shrink-0 ${ti.color}`}>
                    <ItemIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.sub}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                  </span>
                </div>
              );
            })}
            {recentItems.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">لا توجد نشاطات حديثة</div>
            )}
          </div>
        </div>

        {/* Quick Summary */}
        <div className="space-y-4">
          {/* Platform Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              ملخص المنصة
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">المدراء</span>
                <span className="text-sm font-bold text-slate-900">{stats.adminCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">الرسائل</span>
                <span className="text-sm font-bold text-slate-900">{stats.totalMessages.toLocaleString("ar-EG")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">المقالات الكلية</span>
                <span className="text-sm font-bold text-slate-900">{stats.totalArticles}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">بانتظار المراجعة</span>
                <span className={`text-sm font-bold ${stats.pendingArticles > 0 ? "text-amber-600" : "text-slate-900"}`}>
                  {stats.pendingArticles}
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 opacity-80" />
              نشاط آخر 7 أيام
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">مستخدمون جدد</span>
                <span className="text-sm font-black">{stats.newUsersLast7}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">وظائف جديدة</span>
                <span className="text-sm font-black">{stats.newJobsLast7}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">طلبات توظيف</span>
                <span className="text-sm font-black">{stats.newAppsLast7}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/70">تذاكر دعم</span>
                <span className="text-sm font-black">{stats.newTicketsLast7}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
