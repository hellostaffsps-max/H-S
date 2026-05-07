"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  Search,
  Star,
  ArrowLeft,
  ChevronDown,
  TrendingUp,
  UserCheck,
  XCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getEmployerJobs } from "@/app/actions/jobs";
import {
  getApplications,
  getMyApplications,
  updateApplicationStatus,
} from "@/app/actions/applications";
import { supabase } from "@/lib/supabase";

const statusOptions = [
  { value: "قيد المراجعة", label: "قيد المراجعة", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "مراجعة", label: "تمت المراجعة", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "قائمة مختصرة", label: "قائمة مختصرة", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "مقابلة", label: "مقابلة", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "تجربة عمل", label: "تجربة عمل", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "مقبول", label: "مقبول", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "مرفوض", label: "مرفوض", color: "bg-red-50 text-red-700 border-red-200" },
];

function getStatusStyle(status: string) {
  const found = statusOptions.find((s) => s.value === status);
  return found?.color || "bg-slate-50 text-slate-600 border-slate-200";
}

function getStatusLabel(status: string) {
  const found = statusOptions.find((s) => s.value === status);
  return found?.label || status;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seekerProfile, setSeekerProfile] = useState<any>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);

  const isEmployer = profile?.role === "employer";

  useEffect(() => {
    if (user && profile) {
      fetchData();
    }
  }, [user, profile]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      if (profile?.role === "employer") {
        const [jobsResult, appsResult] = await Promise.all([
          getEmployerJobs(),
          getApplications(),
        ]);
        if (jobsResult.success) {
          setJobs(jobsResult.data);
        } else {
          console.error("getEmployerJobs failed:", jobsResult.error);
          setError(jobsResult.error || "فشل تحميل الوظائف");
        }
        if (appsResult.success) {
          setApplications(appsResult.data);
        } else {
          console.error("getApplications failed:", appsResult.error);
        }
      } else {
        const [appsResult, seekerRes] = await Promise.all([
          getMyApplications(),
          supabase.from("seekers").select("*").eq("profile_id", user?.id).single(),
        ]);
        if (appsResult.success) setApplications(appsResult.data);
        if (seekerRes.data) {
          setSeekerProfile(seekerRes.data);
          // Fetch recommended jobs
          const category = seekerRes.data.job_title;
          const { data: recJobs } = await supabase
            .from("jobs")
            .select("id, title, company_name, location, type, category, salary_min, salary_max, currency, created_at")
            .eq("status", "approved")
            .or(`category.ilike.%${category || ""}%`)
            .order("created_at", { ascending: false })
            .limit(4);
          setRecommendedJobs(recJobs || []);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(appId: string, newStatus: string) {
    const result = await updateApplicationStatus(appId, newStatus);
    if (result.success) {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    }
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          يجب تسجيل الدخول
        </h2>
        <Link
          href="/auth/login"
          className="text-brand-600 font-bold hover:underline"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            لوحة التحكم
          </h1>
          <p className="text-slate-500 text-sm">
            مرحباً {profile?.full_name || ""} 👋
          </p>
        </div>
        {isEmployer && (
          <Link
            href="/post-job"
            className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-5 h-5" /> نشر وظيفة جديدة
          </Link>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {isEmployer ? (
            <EmployerDashboard
              jobs={jobs}
              applications={applications}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <SeekerDashboard
              applications={applications}
              seekerProfile={seekerProfile}
              profile={profile}
              recommendedJobs={recommendedJobs}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ==================== EMPLOYER DASHBOARD ==================== */

function EmployerDashboard({
  jobs,
  applications,
  onStatusChange,
}: {
  jobs: any[];
  applications: any[];
  onStatusChange: (id: string, status: string) => void;
}) {
  const activeJobs = jobs.filter((j) => j.status === "approved").length;
  const totalApps = applications.length;
  const shortlisted = applications.filter((a) =>
    ["قائمة مختصرة", "مقابلة", "تجربة عمل"].includes(a.status)
  ).length;
  const hired = applications.filter((a) => a.status === "مقبول").length;

  const pipelineCounts = [
    { label: "جديد", count: applications.filter((a) => a.status === "قيد المراجعة").length, color: "bg-yellow-500" },
    { label: "تمت المراجعة", count: applications.filter((a) => a.status === "مراجعة").length, color: "bg-blue-500" },
    { label: "مختصر", count: applications.filter((a) => a.status === "قائمة مختصرة").length, color: "bg-indigo-500" },
    { label: "مقابلة", count: applications.filter((a) => a.status === "مقابلة").length, color: "bg-purple-500" },
    { label: "تجربة", count: applications.filter((a) => a.status === "تجربة عمل").length, color: "bg-orange-500" },
    { label: "تم التوظيف", count: hired, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <OverviewCard icon={Briefcase} label="وظائف نشطة" value={activeJobs} color="brand" />
        <OverviewCard icon={Users} label="إجمالي المتقدمين" value={totalApps} color="blue" />
        <OverviewCard icon={UserCheck} label="قائمة مختصرة" value={shortlisted} color="indigo" />
        <OverviewCard icon={CheckCircle2} label="تم التوظيف" value={hired} color="green" />
      </div>

      {/* Pipeline Visualization */}
      {applications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            خط سير التوظيف
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {pipelineCounts.map((step, i) => (
              <div
                key={i}
                className={`${step.color} rounded-xl p-3 text-white text-center`}
              >
                <div className="text-xl sm:text-2xl font-black">{step.count}</div>
                <div className="text-[10px] sm:text-xs font-bold mt-1 opacity-90">{step.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickActionCard
          icon={PlusCircle}
          title="نشر وظيفة"
          desc="أضف فرصة عمل جديدة"
          href="/post-job"
          color="bg-brand-50 text-brand-600"
        />
        <QuickActionCard
          icon={Search}
          title="البحث في السير الذاتية"
          desc="استعرض المرشحين المتاحين"
          href="/search-resumes"
          color="bg-sky-50 text-sky-600"
        />
        <QuickActionCard
          icon={FileText}
          title="إدارة المقالات"
          desc="انشر محتوى عن مطعمك"
          href="/dashboard/articles"
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* My Jobs */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4">وظائفي المنشورة</h2>
        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="لم تنشر أي وظائف بعد"
            cta="نشر أول وظيفة"
            href="/post-job"
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الوظيفة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الحالة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">المتقدمين</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {jobs.map((job) => {
                    const appCount = applications.filter(
                      (a) => a.job_id === job.id
                    ).length;
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <p className="font-bold text-slate-900 text-sm">{job.title}</p>
                          <p className="text-xs text-slate-500">{job.company_name}</p>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <span className="text-sm font-bold text-slate-700">{appCount}</span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-slate-500">
                          {new Date(job.created_at).toLocaleDateString("ar-EG")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Applications Table */}
      {applications.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-4">طلبات التقديم</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الوظيفة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">المتقدم</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الحالة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm font-bold text-slate-900">
                        {app.jobs?.title}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-slate-600">
                        {app.profiles?.full_name || "مستخدم"}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <StatusDropdown
                          currentStatus={app.status}
                          onChange={(status) => onStatusChange(app.id, status)}
                        />
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-slate-500">
                        {new Date(app.created_at).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== SEEKER DASHBOARD ==================== */

function SeekerDashboard({
  applications,
  seekerProfile,
  profile,
  recommendedJobs,
}: {
  applications: any[];
  seekerProfile: any;
  profile: any;
  recommendedJobs: any[];
}) {
  // Calculate profile completion
  const fields = [
    !!profile?.full_name,
    !!profile?.phone,
    !!profile?.location,
    !!seekerProfile?.job_title,
    !!(seekerProfile?.experience_years !== null && seekerProfile?.experience_years !== undefined),
    !!(seekerProfile?.skills && seekerProfile.skills.length > 0),
    !!seekerProfile?.bio,
  ];
  const completedFields = fields.filter(Boolean).length;
  const completionPercent = Math.round((completedFields / fields.length) * 100);

  return (
    <div className="space-y-8">
      {/* Profile Completion */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">اكتمال الملف الشخصي</h2>
          <span className="text-sm font-black text-brand-600">{completionPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        {completionPercent < 100 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              أكمل بياناتك لزيادة فرصك في الحصول على وظيفة
            </p>
            <Link
              href="/profile"
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              أكمل ملفك →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickActionCard
          icon={Search}
          title="تصفح الوظائف"
          desc="اكتشف فرص جديدة في قطاع الضيافة"
          href="/jobs"
          color="bg-brand-50 text-brand-600"
        />
        <QuickActionCard
          icon={FileText}
          title="منشئ السيرة الذاتية"
          desc="أنشئ سيرة ذاتية احترافية"
          href="/cv-builder"
          color="bg-sky-50 text-sky-600"
        />
      </div>

      {/* Recommended Jobs */}
      {recommendedJobs.length > 0 && (
        <div>
          <h2 className="text-lg font-black text-slate-900 mb-4">وظائف مقترحة لك</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{job.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${job.type === "دوام كامل" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"}`}>
                    {job.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{job.company_name} · {job.location}</p>
                {job.salary_min && job.salary_max && (
                  <p className="text-xs font-bold text-brand-600">
                    {job.currency || "₪"} {job.salary_min.toLocaleString("ar-EG")} - {job.salary_max.toLocaleString("ar-EG")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My Applications */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4">طلباتي</h2>
        {applications.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="لم تقدم على أي وظائف بعد"
            desc="ابحث عن وظيفة تناسبك وقدّم الآن"
            cta="تصفح الوظائف"
            href="/jobs"
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الوظيفة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الشركة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الحالة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm font-bold text-slate-900">
                        <Link href={`/jobs/${app.job_id}`} className="hover:text-brand-600 transition-colors">
                          {app.jobs?.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-slate-600">
                        {app.jobs?.company_name}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${getStatusStyle(app.status)}`}>
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-slate-500">
                        {new Date(app.created_at).toLocaleDateString("ar-EG")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== SHARED COMPONENTS ==================== */

function OverviewCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    brand: "text-brand-600",
    blue: "text-blue-500",
    indigo: "text-indigo-500",
    green: "text-green-500",
    yellow: "text-yellow-500",
    red: "text-red-500",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center ${colorMap[color] || "text-slate-500"}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-0.5">
        {value}
      </div>
      <div className="text-xs text-slate-500 font-medium">{label}</div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  desc,
  href,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-md transition-all group"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
  cta,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc?: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl py-14 sm:py-16 flex flex-col items-center justify-center text-slate-400">
      <Icon className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-base font-bold text-slate-700 mb-1">{title}</p>
      {desc && <p className="text-sm text-slate-500 mb-4">{desc}</p>}
      <Link
        href={href}
        className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
      >
        {cta}
      </Link>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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
    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

function StatusDropdown({
  currentStatus,
  onChange,
}: {
  currentStatus: string;
  onChange: (status: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${getStatusStyle(currentStatus)}`}
      >
        {getStatusLabel(currentStatus)}
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-right px-3 py-2 text-xs font-bold hover:bg-slate-50 transition-colors ${
                  option.value === currentStatus ? "bg-brand-50 text-brand-700" : "text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
