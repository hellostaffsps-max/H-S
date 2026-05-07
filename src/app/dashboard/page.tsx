"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
  Search,
  ChevronDown,
  TrendingUp,
  XCircle,
  Loader2,
  FileText,
  Settings,
  MessageSquare,
  Eye,
  PauseCircle,
  PlayCircle,
  X,
  MapPin,
  Award,
  Calendar,
  ArrowLeft,
  Star,
  Phone,
  Mail,
  Download,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getEmployerJobs, updateJobStatus } from "@/app/actions/jobs";
import {
  getApplications,
  getMyApplications,
  updateApplicationStatus,
} from "@/app/actions/applications";
import { supabase } from "@/lib/supabase";

/* ==================== STATUS CONFIG ==================== */

const APP_STATUS_OPTIONS = [
  { value: "قيد المراجعة", label: "قيد المراجعة", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "مراجعة", label: "تمت المراجعة", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "قائمة مختصرة", label: "قائمة مختصرة", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "مقابلة", label: "مقابلة", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "تجربة عمل", label: "تجربة عمل", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "مقبول", label: "مقبول", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "مرفوض", label: "مرفوض", color: "bg-red-50 text-red-700 border-red-200" },
];

const PIPELINE_STAGES = [
  { key: "قيد المراجعة", label: "طلبات جديدة", color: "bg-yellow-500", ring: "ring-yellow-200" },
  { key: "مراجعة", label: "تمت المراجعة", color: "bg-blue-500", ring: "ring-blue-200" },
  { key: "قائمة مختصرة", label: "القائمة المختصرة", color: "bg-indigo-500", ring: "ring-indigo-200" },
  { key: "مقابلة", label: "مقابلة", color: "bg-purple-500", ring: "ring-purple-200" },
  { key: "تجربة عمل", label: "تجربة عمل", color: "bg-orange-500", ring: "ring-orange-200" },
  { key: "مقبول", label: "تم التوظيف", color: "bg-green-500", ring: "ring-green-200" },
  { key: "مرفوض", label: "مرفوض", color: "bg-red-500", ring: "ring-red-200" },
];

function getAppStatusStyle(status: string) {
  return APP_STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-slate-50 text-slate-600 border-slate-200";
}

function getAppStatusLabel(status: string) {
  return APP_STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

/* ==================== MAIN DASHBOARD ==================== */

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [employerData, setEmployerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [seekerProfile, setSeekerProfile] = useState<any>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [interviewModalApp, setInterviewModalApp] = useState<any>(null);

  const isEmployer = profile?.role === "employer";
  const isAdmin = profile?.role === "admin";

  const jobsRef = useRef<HTMLDivElement>(null);
  const applicantsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && profile) {
      fetchData();
    }
  }, [user, profile]);

  useEffect(() => {
    if (isAdmin) {
      window.location.href = "/admin";
    }
  }, [isAdmin]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (isEmployer) {
        const [jobsResult, appsResult] = await Promise.all([
          getEmployerJobs(),
          getApplications(),
        ]);

        // Fetch employer data for business name
        const { data: empData } = await supabase
          .from("employers")
          .select("company_name, logo_url")
          .eq("profile_id", user?.id)
          .single();
        setEmployerData(empData);

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
          if (!error) setError(appsResult.error || "فشل تحميل المتقدمين");
        }
      } else {
        const [appsResult, seekerRes] = await Promise.all([
          getMyApplications(),
          supabase.from("seekers").select("*").eq("profile_id", user?.id).single(),
        ]);
        if (appsResult.success) setApplications(appsResult.data);
        if (seekerRes.data) {
          setSeekerProfile(seekerRes.data);
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

  async function handleApplicationStatusChange(
    appId: string,
    newStatus: string,
    interviewDate?: string | null,
    interviewLocation?: string | null,
    interviewNotes?: string | null
  ) {
    const result = await updateApplicationStatus(appId, newStatus, interviewDate, interviewLocation, interviewNotes);
    if (result.success) {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                status: newStatus,
                interview_date: interviewDate || a.interview_date,
                interview_location: interviewLocation || a.interview_location,
                interview_notes: interviewNotes || a.interview_notes,
              }
            : a
        )
      );
      setSuccess(`تم تحديث حالة المتقدم إلى: ${getAppStatusLabel(newStatus)}`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "فشل تحديث الحالة");
    }
  }

  async function handleJobAction(jobId: string, action: "pause" | "activate" | "close") {
    const newStatus = action === "activate" ? "approved" : "closed";
    const result = await updateJobStatus(jobId, newStatus);
    if (result.success) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
      const msg = action === "activate" ? "تم تفعيل الوظيفة" : action === "pause" ? "تم إيقاف الوظيفة مؤقتاً" : "تم إغلاق الوظيفة";
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "فشل تنفيذ الإجراء");
    }
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">يجب تسجيل الدخول</h2>
        <Link href="/auth/login" className="text-brand-600 font-bold hover:underline">تسجيل الدخول</Link>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Global Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="mr-auto text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <p className="text-sm font-bold text-green-700">{success}</p>
          <button onClick={() => setSuccess(null)} className="mr-auto text-green-400 hover:text-green-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {isEmployer ? (
            <EmployerDashboard
              jobs={jobs}
              applications={applications}
              employerData={employerData}
              onApplicationStatusChange={handleApplicationStatusChange}
              onJobAction={handleJobAction}
              jobsRef={jobsRef}
              applicantsRef={applicantsRef}
              onSelectApplicant={setSelectedApplicant}
              onOpenInterviewModal={setInterviewModalApp}
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

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <ApplicantModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={handleApplicationStatusChange}
          onOpenInterview={() => {
            setSelectedApplicant(null);
            setInterviewModalApp(selectedApplicant);
          }}
        />
      )}

      {/* Interview Schedule Modal */}
      {interviewModalApp && (
        <InterviewModal
          applicant={interviewModalApp}
          onClose={() => setInterviewModalApp(null)}
          onSchedule={(date, location, notes) => {
            handleApplicationStatusChange(interviewModalApp.id, "مقابلة", date, location, notes);
            setInterviewModalApp(null);
          }}
        />
      )}
    </div>
  );
}

function InterviewModal({
  applicant,
  onClose,
  onSchedule,
}: {
  applicant: any;
  onClose: () => void;
  onSchedule: (date: string, location: string, notes: string) => void;
}) {
  const seeker = applicant.seekers;
  const profile = seeker?.profiles;
  const fullName = profile?.full_name || "مستخدم";

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    const isoDate = new Date(`${date}T${time}`).toISOString();
    onSchedule(isoDate, location, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-md">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-lg font-black text-slate-900">جدولة مقابلة</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <p className="text-sm text-slate-500 mb-2">
            متقدم: <span className="font-bold text-slate-900">{fullName}</span> — وظيفة: <span className="font-bold text-slate-900">{applicant.jobs?.title}</span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">التاريخ</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">الوقت</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">عنوان المقابلة</label>
            <input
              type="text"
              placeholder="مثال: فرع رام الله - شارع الرشيد"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات</label>
            <textarea
              placeholder="تعليمات أو ملاحظات إضافية..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
          >
            تأكيد جدولة المقابلة
          </button>
        </form>
      </div>
    </div>
  );
}

function ApplicantModal({
  applicant,
  onClose,
  onStatusChange,
  onOpenInterview,
}: {
  applicant: any;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onOpenInterview: () => void;
}) {
  const seeker = applicant.seekers;
  const profile = seeker?.profiles;
  const fullName = profile?.full_name || "مستخدم";
  const initials = fullName.charAt(0) || "م";
  const seekerId = applicant.seeker_id;

  const handleStatus = (status: string) => {
    onStatusChange(applicant.id, status);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-lg font-black text-slate-900">بطاقة المتقدم</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-black shrink-0">
              {initials}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{fullName}</h3>
              <p className="text-sm text-slate-500">{seeker?.job_title || "—"}</p>
              <div className="flex items-center gap-3 mt-1">
                {profile?.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {profile.location}
                  </span>
                )}
                {seeker?.experience_years !== null && seeker?.experience_years !== undefined && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Award className="w-3 h-3" />
                    {seeker.experience_years} سنة خبرة
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile?.phone && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                <Phone className="w-4 h-4 text-brand-600" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">الهاتف</p>
                  <p className="text-sm font-bold text-slate-900" dir="ltr">{profile.phone}</p>
                </div>
              </div>
            )}
            {profile?.email && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                <Mail className="w-4 h-4 text-brand-600" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">البريد</p>
                  <p className="text-sm font-bold text-slate-900 truncate" dir="ltr">{profile.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Skills */}
          {seeker?.skills && seeker.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">المهارات</h4>
              <div className="flex flex-wrap gap-2">
                {seeker.skills.map((skill: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {seeker?.bio && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">نبذة</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3">{seeker.bio}</p>
            </div>
          )}

          {/* Application Message */}
          {applicant.message && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">رسالة التقديم</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-brand-50 rounded-xl p-3 border border-brand-100">{applicant.message}</p>
            </div>
          )}

          {/* Resume */}
          {(seeker?.cv_url || (seeker?.resume_data && Object.keys(seeker.resume_data).length > 0)) && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">السيرة الذاتية</h4>
              <div className="flex flex-wrap gap-2">
                {seeker?.resume_data && Object.keys(seeker.resume_data).length > 0 && (
                  <a
                    href={`/cv-builder?view=${seekerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    عرض السيرة الذاتية
                  </a>
                )}
                {seeker?.cv_url && (
                  <a
                    href={seeker.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    تحميل ملف CV
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Current Status */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
            <span className="text-xs font-bold text-slate-400 uppercase">الحالة الحالية</span>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getAppStatusStyle(applicant.status)}`}>
              {getAppStatusLabel(applicant.status)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleStatus("مقبول")}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-bold">قبول</span>
            </button>
            <button
              onClick={() => handleStatus("مرفوض")}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              <span className="text-xs font-bold">رفض</span>
            </button>
            <button
              onClick={onOpenInterview}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs font-bold">مقابلة</span>
            </button>
            <Link
              href={`/messages?with=${seekerId}`}
              onClick={onClose}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-bold">مراسلة</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== SKELETON ==================== */

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-20 bg-white rounded-2xl border border-slate-200" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200" />
        ))}
      </div>
      <div className="h-24 bg-white rounded-2xl border border-slate-200" />
      <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      <div className="h-64 bg-white rounded-2xl border border-slate-200" />
    </div>
  );
}

/* ==================== EMPLOYER DASHBOARD ==================== */

function EmployerDashboard({
  jobs,
  applications,
  employerData,
  onApplicationStatusChange,
  onJobAction,
  jobsRef,
  applicantsRef,
  onSelectApplicant,
  onOpenInterviewModal,
}: {
  jobs: any[];
  applications: any[];
  employerData: any;
  onApplicationStatusChange: (id: string, status: string) => void;
  onJobAction: (id: string, action: "pause" | "activate" | "close") => void;
  jobsRef: React.RefObject<HTMLDivElement | null>;
  applicantsRef: React.RefObject<HTMLDivElement | null>;
  onSelectApplicant: (applicant: any) => void;
  onOpenInterviewModal: (applicant: any) => void;
}) {
  const businessName = employerData?.company_name || "صاحب العمل";

  // Stats
  const activeJobs = jobs.filter((j) => j.status === "approved").length;
  const newApplicants = applications.filter((a) => a.status === "قيد المراجعة").length;
  const totalApplicants = applications.length;
  const upcomingInterviews = applications.filter((a) => a.status === "مقابلة").length;
  const pendingReview = applications.filter((a) => a.status === "مراجعة").length;
  const hired = applications.filter((a) => a.status === "مقبول").length;

  const stats = [
    { label: "الوظائف النشطة", value: activeJobs, icon: Briefcase, color: "brand", trend: null },
    { label: "المتقدمون الجدد", value: newApplicants, icon: Users, color: "yellow", trend: null },
    { label: "إجمالي المتقدمين", value: totalApplicants, icon: TrendingUp, color: "blue", trend: null },
    { label: "مقابلات قادمة", value: upcomingInterviews, icon: Clock, color: "purple", trend: null },
    { label: "بانتظار المراجعة", value: pendingReview, icon: FileText, color: "orange", trend: null },
    { label: "تم التوظيف", value: hired, icon: CheckCircle2, color: "green", trend: null },
  ];

  // Pipeline counts
  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: applications.filter((a) => a.status === stage.key).length,
  }));

  // Latest applicants (top 5 by date)
  const latestApplicants = [...applications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Quick actions
  const quickActions = [
    { icon: PlusCircle, title: "نشر وظيفة", desc: "أضف فرصة عمل جديدة", href: "/post-job", color: "bg-brand-50 text-brand-600" },
    { icon: Briefcase, title: "إدارة الوظائف", desc: "استعرض وعدّل وظائفك", href: "#jobs", color: "bg-sky-50 text-sky-600", scrollTo: jobsRef },
    { icon: Users, title: "عرض المتقدمين", desc: "راجع الطلبات الواردة", href: "#applicants", color: "bg-indigo-50 text-indigo-600", scrollTo: applicantsRef },
    { icon: Settings, title: "إعدادات المنشأة", desc: "حدّث بيانات عملك", href: "/profile", color: "bg-slate-50 text-slate-600" },
    { icon: MessageSquare, title: "الرسائل", desc: "تواصل مع المرشحين", href: "/messages", color: "bg-emerald-50 text-emerald-600" },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    if (action.scrollTo && action.scrollTo.current) {
      action.scrollTo.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            مرحباً، {businessName}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            تابع وظائفك، المتقدمين، والمقابلات من مكان واحد
          </p>
        </div>
        <Link
          href="/post-job"
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <PlusCircle className="w-5 h-5" /> نشر وظيفة جديدة
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Hiring Pipeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
          خط سير التوظيف
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {pipelineCounts.map((step) => (
            <div
              key={step.key}
              className={`${step.color} rounded-xl p-3 text-white text-center relative overflow-hidden`}
            >
              <div className="text-xl sm:text-2xl font-black relative z-10">{step.count}</div>
              <div className="text-[10px] sm:text-xs font-bold mt-1 opacity-90 relative z-10 leading-tight">{step.label}</div>
              {step.count > 0 && (
                <div className="absolute inset-0 bg-white/10 rounded-xl" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {quickActions.map((action, i) =>
          action.scrollTo ? (
            <button
              key={i}
              onClick={() => handleQuickAction(action)}
              className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-md transition-all group text-right"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{action.title}</h3>
                <p className="text-[11px] text-slate-500">{action.desc}</p>
              </div>
            </button>
          ) : (
            <Link
              key={i}
              href={action.href}
              className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{action.title}</h3>
                <p className="text-[11px] text-slate-500">{action.desc}</p>
              </div>
            </Link>
          )
        )}
      </div>

      {/* My Jobs */}
      <div ref={jobsRef}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900">وظائفي المنشورة</h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">{jobs.length} وظيفة</span>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="ابدأ بأول وظيفة"
            desc="انشر وظيفة واضحة لجذب المرشحين المناسبين لمطعمك أو مقهاك."
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
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">تاريخ النشر</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {jobs.map((job) => {
                    const appCount = applications.filter((a) => a.job_id === job.id).length;
                    const isClosed = job.status === "closed";
                    const isApproved = job.status === "approved";
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <p className="font-bold text-slate-900 text-sm">{job.title}</p>
                          <p className="text-xs text-slate-500">{job.company_name}</p>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <JobStatusBadge status={job.status} />
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {appCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(job.created_at).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          <div className="flex items-center gap-1">
                            {appCount > 0 && (
                              <button
                                onClick={() => applicantsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                                className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                title="عرض المتقدمين"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {isApproved && (
                              <button
                                onClick={() => onJobAction(job.id, "pause")}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="إيقاف مؤقت"
                              >
                                <PauseCircle className="w-4 h-4" />
                              </button>
                            )}
                            {isClosed && (
                              <button
                                onClick={() => onJobAction(job.id, "activate")}
                                className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="تفعيل"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}
                            {!isClosed && (
                              <button
                                onClick={() => onJobAction(job.id, "close")}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="إغلاق"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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

      {/* Latest Applicants */}
      <div ref={applicantsRef}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900">أحدث المتقدمين</h2>
          {applications.length > 0 && (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">{applications.length} متقدم</span>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-slate-600 mb-1">لا يوجد متقدمون بعد</p>
            <p className="text-xs text-slate-500">بعد نشر وظيفة، ستظهر الطلبات هنا.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">المتقدم</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الوظيفة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">المدينة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الخبرة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الحالة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">التاريخ</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {latestApplicants.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold shrink-0">
                            {app.seekers?.profiles?.full_name?.charAt(0) || "م"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{app.seekers?.profiles?.full_name || "مستخدم"}</p>
                            <p className="text-[11px] text-slate-500">{app.seekers?.job_title || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm font-bold text-slate-900">
                        {app.jobs?.title}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {app.seekers?.profiles?.location || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {app.seekers?.experience_years ? `${app.seekers.experience_years} سنة` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <StatusDropdown
                          currentStatus={app.status}
                          onChange={(status) => onApplicationStatusChange(app.id, status)}
                        />
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => onSelectApplicant(app)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                            title="عرض البطاقة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            البطاقة
                          </button>
                          <Link
                            href={`/jobs/${app.job_id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                            title="عرض الوظيفة"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => onApplicationStatusChange(app.id, "مقبول")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                            title="قبول"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onApplicationStatusChange(app.id, "مرفوض")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                            title="رفض"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenInterviewModal(app)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                            title="جدولة مقابلة"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            href={`/messages?with=${app.seeker_id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                            title="مراسلة"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Link>
                        </div>
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
          <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${completionPercent}%` }} />
        </div>
        {completionPercent < 100 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">أكمل بياناتك لزيادة فرصك في الحصول على وظيفة</p>
            <Link href="/profile" className="text-xs font-bold text-brand-600 hover:text-brand-700">أكمل ملفك →</Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickActionCard icon={Search} title="تصفح الوظائف" desc="اكتشف فرص جديدة في قطاع الضيافة" href="/jobs" color="bg-brand-50 text-brand-600" />
        <QuickActionCard icon={FileText} title="منشئ السيرة الذاتية" desc="أنشئ سيرة ذاتية احترافية" href="/cv-builder" color="bg-sky-50 text-sky-600" />
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
          <EmptyState icon={Briefcase} title="لم تقدم على أي وظائف بعد" desc="ابحث عن وظيفة تناسبك وقدّم الآن" cta="تصفح الوظائف" href="/jobs" />
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
                        <Link href={`/jobs/${app.job_id}`} className="hover:text-brand-600 transition-colors">{app.jobs?.title}</Link>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-slate-600">{app.jobs?.company_name}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${getAppStatusStyle(app.status)}`}>
                          {getAppStatusLabel(app.status)}
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

function StatCard({
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
    brand: "text-brand-600 bg-brand-50",
    blue: "text-blue-600 bg-blue-50",
    indigo: "text-indigo-600 bg-indigo-50",
    green: "text-green-600 bg-green-50",
    yellow: "text-yellow-600 bg-yellow-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
    slate: "text-slate-600 bg-slate-50",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-0.5">{value}</div>
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
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{title}</h3>
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
      {desc && <p className="text-sm text-slate-500 mb-4 max-w-sm text-center px-4">{desc}</p>}
      <Link href={href} className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors">
        {cta}
      </Link>
    </div>
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
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${getAppStatusStyle(currentStatus)}`}
      >
        {getAppStatusLabel(currentStatus)}
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[140px]">
            {APP_STATUS_OPTIONS.map((option) => (
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
