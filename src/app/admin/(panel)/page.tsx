"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  ArrowUpRight,
  UserCheck,
  Building2,
  FileText,
  ShieldCheck,
  MessageSquare,
  Activity,
  Loader2,
  AlertCircle,
  ChevronLeft,
  MapPin,
  Calendar,
} from "lucide-react";
import { motion } from "motion/react";

interface Stats {
  totalUsers: number;
  totalEmployers: number;
  totalSeekers: number;
  activeJobs: number;
  pendingJobs: number;
  totalApplications: number;
  activeSubscriptions: number;
  pendingArticles: number;
}

interface RecentData {
  users: any[];
  jobs: any[];
  applications: any[];
  subscriptions: any[];
}

type ActivityTab = "users" | "jobs" | "applications" | "subscriptions" | "articles";

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalEmployers: 0,
    totalSeekers: 0,
    activeJobs: 0,
    pendingJobs: 0,
    totalApplications: 0,
    activeSubscriptions: 0,
    pendingArticles: 0,
  });
  const [recent, setRecent] = useState<RecentData>({
    users: [],
    jobs: [],
    applications: [],
    subscriptions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActivityTab>("users");
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStats() {
    setRefreshing(true);
    setError(null);
    try {
      const [
        usersRes,
        employersRes,
        seekersRes,
        activeJobsRes,
        pendingJobsRes,
        appsRes,
        subsRes,
        articlesRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "employer"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "seeker"),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalEmployers: employersRes.count || 0,
        totalSeekers: seekersRes.count || 0,
        activeJobs: activeJobsRes.count || 0,
        pendingJobs: pendingJobsRes.count || 0,
        totalApplications: appsRes.count || 0,
        activeSubscriptions: subsRes.count || 0,
        pendingArticles: articlesRes.count || 0,
      });

      // Fetch recent activity data
      const [
        recentUsers,
        recentJobs,
        recentApps,
        recentSubs,
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, location, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("jobs").select("id, title, company_name, status, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("applications").select("id, status, created_at, jobs(title), profiles(full_name)").order("created_at", { ascending: false }).limit(8),
        supabase.from("user_subscriptions").select("id, status, plan_name, created_at, profiles(full_name, email)").order("created_at", { ascending: false }).limit(8),
      ]);

      setRecent({
        users: recentUsers.data || [],
        jobs: recentJobs.data || [],
        applications: recentApps.data || [],
        subscriptions: recentSubs.data || [],
      });
    } catch (e: any) {
      setError(e.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    { name: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, color: "from-blue-500 to-blue-600", text: "text-blue-50" },
    { name: "أصحاب العمل", value: stats.totalEmployers, icon: Building2, color: "from-emerald-500 to-teal-600", text: "text-emerald-50" },
    { name: "الوظائف النشطة", value: stats.activeJobs, icon: Briefcase, color: "from-brand-500 to-brand-700", text: "text-brand-50" },
    { name: "وظائف بانتظار الموافقة", value: stats.pendingJobs, icon: Clock, color: "from-amber-500 to-orange-600", text: "text-amber-50" },
    { name: "طلبات التوظيف", value: stats.totalApplications, icon: FileText, color: "from-indigo-500 to-violet-600", text: "text-indigo-50" },
    { name: "اشتراكات فعالة", value: stats.activeSubscriptions, icon: ShieldCheck, color: "from-rose-500 to-pink-600", text: "text-rose-50" },
    { name: "مرشحون", value: stats.totalSeekers, icon: UserCheck, color: "from-cyan-500 to-sky-600", text: "text-cyan-50" },
    { name: "مقالات للمراجعة", value: stats.pendingArticles, icon: FileText, color: "from-orange-500 to-red-500", text: "text-orange-50" },
  ];

  const tabs: { key: ActivityTab; label: string; count: number }[] = [
    { key: "users", label: "المستخدمين", count: recent.users.length },
    { key: "jobs", label: "الوظائف", count: recent.jobs.length },
    { key: "applications", label: "طلبات التوظيف", count: recent.applications.length },
    { key: "subscriptions", label: "الاشتراكات", count: recent.subscriptions.length },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gradient-to-l from-slate-900 to-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black mb-2">نظرة عامة على المنصة</h2>
          <p className="text-slate-300 text-sm">مرحباً بك في لوحة الإدارة العليا. إليك ملخص الأداء والنشاط.</p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-2xl text-sm font-bold hover:bg-brand-600 shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            <Activity className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            تحديث البيانات
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => (
          <motion.div
            key={stat.name}
            variants={item}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.color} p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all group cursor-default transform hover:-translate-y-1`}
          >
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <stat.icon className="h-32 w-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <p className={`text-sm font-bold mb-1 ${stat.text}`}>{stat.name}</p>
              <h3 className="text-4xl font-black text-white tracking-tight">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              آخر النشاطات
            </h3>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-0">
            {activeTab === "users" && (
              <RecentList
                items={recent.users}
                emptyText="لا يوجد مستخدمين مسجلين بعد"
                renderItem={(u) => (
                  <div className="flex items-center justify-between py-3 px-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                        {u.full_name?.charAt(0) || "م"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.full_name || "مستخدم"}</p>
                        <p className="text-[11px] text-slate-500">
                          {u.role === "admin" ? "مدير" : u.role === "employer" ? "صاحب عمل" : "باحث عن عمل"}
                          {u.location && ` · ${u.location}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                )}
              />
            )}
            {activeTab === "jobs" && (
              <RecentList
                items={recent.jobs}
                emptyText="لا توجد وظائف منشورة بعد"
                renderItem={(j) => (
                  <div className="flex items-center justify-between py-3 px-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{j.title}</p>
                        <p className="text-[11px] text-slate-500">{j.company_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <JobStatusBadge status={j.status} />
                      <span className="text-xs text-slate-400">{new Date(j.created_at).toLocaleDateString("ar-EG")}</span>
                    </div>
                  </div>
                )}
              />
            )}
            {activeTab === "applications" && (
              <RecentList
                items={recent.applications}
                emptyText="لا توجد طلبات توظيف بعد"
                renderItem={(a) => (
                  <div className="flex items-center justify-between py-3 px-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
                        {a.profiles?.full_name?.charAt(0) || "م"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{a.profiles?.full_name || "مستخدم"}</p>
                        <p className="text-[11px] text-slate-500">{a.jobs?.title || "وظيفة"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <AppStatusBadge status={a.status} />
                      <span className="text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString("ar-EG")}</span>
                    </div>
                  </div>
                )}
              />
            )}
            {activeTab === "subscriptions" && (
              <RecentList
                items={recent.subscriptions}
                emptyText="لا توجد اشتراكات بعد"
                renderItem={(s) => (
                  <div className="flex items-center justify-between py-3 px-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{s.profiles?.full_name || "مستخدم"}</p>
                        <p className="text-[11px] text-slate-500">{s.plan_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SubStatusBadge status={s.status} />
                      <span className="text-xs text-slate-400">{new Date(s.created_at).toLocaleDateString("ar-EG")}</span>
                    </div>
                  </div>
                )}
              />
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden text-white"
        >
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-brand-400" />
              إجراءات سريعة
            </h3>
          </div>
          <div className="p-5 space-y-3">
            <QuickActionLink
              href="/admin/messages"
              icon={MessageSquare}
              title="إرسال تعميم"
              desc="إرسال رسالة لجميع المستخدمين"
              color="bg-brand-500"
            />
            <QuickActionLink
              href="/admin/articles"
              icon={FileText}
              title="نشر مقال جديد"
              desc="إضافة محتوى لمدونة المنصة"
              color="bg-amber-500"
            />
            <QuickActionLink
              href="/admin/jobs"
              icon={Briefcase}
              title="مراجعة الوظائف"
              desc="اعتماد أو رفض الوظائف المعلقة"
              color="bg-emerald-500"
            />
            <QuickActionLink
              href="/admin/users"
              icon={Users}
              title="إدارة المستخدمين"
              desc="تعديل أدوار وحذف حسابات"
              color="bg-blue-500"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

function RecentList({
  items,
  emptyText,
  renderItem,
}: {
  items: any[];
  emptyText: string;
  renderItem: (item: any) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p className="text-sm font-medium">{emptyText}</p>
      </div>
    );
  }
  return <div className="divide-y divide-slate-50">{items.map((item, i) => <div key={i}>{renderItem(item)}</div>)}</div>;
}

function QuickActionLink({
  href,
  icon: Icon,
  title,
  desc,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
    >
      <div className={`p-2 ${color} rounded-xl group-hover:scale-110 transition-transform`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-right flex-1">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <ChevronLeft className="w-4 h-4 text-slate-500" />
    </Link>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    closed: "bg-slate-50 text-slate-600 border-slate-200",
  };
  const labels: Record<string, string> = {
    approved: "معتمدة",
    pending: "قيد المراجعة",
    rejected: "مرفوضة",
    closed: "مغلقة",
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

function AppStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "قيد المراجعة": "bg-yellow-50 text-yellow-700 border-yellow-200",
    مراجعة: "bg-blue-50 text-blue-700 border-blue-200",
    "قائمة مختصرة": "bg-indigo-50 text-indigo-700 border-indigo-200",
    مقابلة: "bg-purple-50 text-purple-700 border-purple-200",
    "تجربة عمل": "bg-orange-50 text-orange-700 border-orange-200",
    مقبول: "bg-green-50 text-green-700 border-green-200",
    مرفوض: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold border ${styles[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {status}
    </span>
  );
}

function SubStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    expired: "bg-red-50 text-red-700 border-red-200",
    canceled: "bg-slate-50 text-slate-600 border-slate-200",
  };
  const labels: Record<string, string> = {
    active: "فعال",
    pending: "معلق",
    expired: "منتهي",
    canceled: "ملغى",
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
