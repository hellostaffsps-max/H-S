"use client";
import type { FormEvent } from "react";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ImageLightbox from "@/components/ImageLightbox";
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
  Megaphone
} from "lucide-react";
import { calculateProfileCompletion } from "@/lib/profile-utils";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { getEmployerJobs, updateJobStatus } from "@/app/actions/jobs";
import {
  getApplications,
  getMyApplications,
  updateApplicationStatus,
} from "@/app/actions/applications";
import { supabase } from "@/lib/supabase";

/* ==================== STATUS CONFIG ==================== */

// Sequential order of statuses — 4 simple stages
const STATUS_ORDER = [
  "قيد المراجعة",
  "قائمة مختصرة",
  "مقابلة",
  "مقبول",
];

const APP_STATUS_OPTIONS = [
  { value: "قيد المراجعة", label: "قيد المراجعة", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "قائمة مختصرة", label: "قائمة مختصرة", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "مقابلة", label: "جدولة مقابلة", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "مقبول", label: "مقبول", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "لم يتم التوظيف", label: "لم يتم التوظيف", color: "bg-red-50 text-red-700 border-red-200" },
];

const PIPELINE_STAGES = [
  { key: "قيد المراجعة", label: "طلبات جديدة", color: "bg-amber-500", ring: "ring-amber-200", icon: Clock },
  { key: "قائمة مختصرة", label: "قائمة مختصرة", color: "bg-indigo-500", ring: "ring-indigo-200", icon: Star },
  { key: "مقابلة", label: "مقابلة", color: "bg-purple-500", ring: "ring-purple-200", icon: Calendar },
  { key: "مقبول", label: "تم التوظيف", color: "bg-emerald-500", ring: "ring-emerald-200", icon: CheckCircle2 },
  { key: "لم يتم التوظيف", label: "لم يتم التوظيف", color: "bg-rose-500", ring: "ring-rose-200", icon: XCircle },
];

/** Get valid next statuses for the given current status */
function getNextStatuses(currentStatus: string): string[] {
  // Terminal statuses — no further action
  if (currentStatus === "مقبول" || currentStatus === "لم يتم التوظيف") return [];

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  // Handle old statuses not in new system — treat as first stage
  const idx = currentIndex === -1 ? 0 : currentIndex;

  const options: string[] = [];
  const nextStep = STATUS_ORDER[idx + 1];
  if (nextStep) options.push(nextStep);
  options.push("لم يتم التوظيف");
  return options;
}

/** Rejection reason is always optional */
function requiresRejectionReason(_currentStatus: string): boolean {
  return false;
}

function getAppStatusStyle(status: string) {
  return APP_STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-slate-50 text-slate-600 border-slate-200";
}

function getAppStatusLabel(status: string) {
  return APP_STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

/* ==================== MAIN DASHBOARD ==================== */

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [employerData, setEmployerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [seekerProfile, setSeekerProfile] = useState<any>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

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
    interviewNotes?: string | null,
    rejectionReason?: string | null
  ) {
    const result = await updateApplicationStatus(appId, newStatus, interviewDate, interviewLocation, interviewNotes, rejectionReason);
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
                rejection_reason: rejectionReason || a.rejection_reason,
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {isEmployer ? (
            <EmployerDashboard
              jobs={jobs}
              applications={applications}
              employerData={employerData}
              subscription={subscription}
              onApplicationStatusChange={handleApplicationStatusChange}
              onJobAction={handleJobAction}
              jobsRef={jobsRef}
              applicantsRef={applicantsRef}
              onSelectApplicant={setSelectedApplicant}
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
}: {
  applicant: any;
  onClose: () => void;
  onStatusChange: (id: string, status: string, interviewDate?: string | null, interviewLocation?: string | null, interviewNotes?: string | null, rejectionReason?: string | null) => void;
}) {
  const seeker = applicant.seekers;
  const profile = seeker?.profiles;
  const fullName = profile?.full_name || "مستخدم";
  const initials = fullName.charAt(0) || "م";
  const seekerId = applicant.seeker_id;

  // Interview scheduling inline state
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [intDate, setIntDate] = useState("");
  const [intTime, setIntTime] = useState("");
  const [intLocation, setIntLocation] = useState("");
  const [intNotes, setIntNotes] = useState("");

  // Reject state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const isTerminal = applicant.status === "مقبول" || applicant.status === "لم يتم التوظيف";
  const isShortlisted = applicant.status === "قائمة مختصرة";
  const isInterview = applicant.status === "مقابلة";
  const isPending = applicant.status === "قيد المراجعة";

  const handleShortlist = () => {
    onStatusChange(applicant.id, "قائمة مختصرة");
    onClose();
  };

  const handleScheduleInterview = () => {
    if (!intDate || !intTime) return;
    const isoDate = new Date(`${intDate}T${intTime}`).toISOString();
    onStatusChange(applicant.id, "مقابلة", isoDate, intLocation || null, intNotes || null);
    onClose();
  };

  const handleAccept = () => {
    onStatusChange(applicant.id, "مقبول");
    onClose();
  };

  const handleReject = () => {
    onStatusChange(applicant.id, "لم يتم التوظيف", null, null, null, rejectionReason || null);
    setShowRejectForm(false);
    onClose();
  };

  // Pipeline step indicator
  const steps = ["قيد المراجعة", "قائمة مختصرة", "مقابلة", "مقبول"];
  const currentIdx = steps.indexOf(applicant.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-lg font-black text-slate-900">بطاقة المتقدم</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">

          {/* Pipeline Progress Bar */}
          {!isTerminal && (
            <div className="flex items-center gap-0">
              {steps.map((step, i) => {
                const done = i < currentIdx || (applicant.status === "مقبول" && i === steps.length - 1);
                const active = i === currentIdx;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 shrink-0 transition-all ${
                      done ? "bg-emerald-500 border-emerald-500 text-white"
                      : active ? "bg-brand-600 border-brand-600 text-white scale-110"
                      : "bg-white border-slate-200 text-slate-400"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`h-[2px] flex-1 transition-all ${i < currentIdx ? "bg-emerald-400" : "bg-slate-100"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!isTerminal && (
            <div className="flex justify-between px-0.5">
              {steps.map((step, i) => (
                <span key={step} className={`text-[9px] font-bold ${i === currentIdx ? "text-brand-600" : "text-slate-400"}`} style={{width: `${100/steps.length}%`, textAlign: i === 0 ? "right" : i === steps.length-1 ? "left" : "center"}}>
                  {step === "قيد المراجعة" ? "جديد" : step === "قائمة مختصرة" ? "مختصرة" : step === "مقابلة" ? "مقابلة" : "مقبول"}
                </span>
              ))}
            </div>
          )}

          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <ImageLightbox src={profile?.avatar_url} alt={fullName}>
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-xl font-black shrink-0 overflow-hidden relative">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={fullName} fill className="object-cover" sizes="64px" />
                ) : initials}
              </div>
            </ImageLightbox>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{fullName}</h3>
              <p className="text-sm text-slate-500">{seeker?.job_title || "—"}</p>
              <div className="flex items-center gap-3 mt-1">
                {profile?.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3" />{profile.location}
                  </span>
                )}
                {seeker?.experience_years != null && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Award className="w-3 h-3" />{seeker.experience_years} سنة خبرة
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
            seeker?.is_available !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${seeker?.is_available !== false ? "bg-emerald-500" : "bg-amber-500"}`} />
            {seeker?.is_available !== false ? "متاح للعمل" : seeker?.current_employer ? `يعمل حالياً في ${seeker.current_employer}` : "غير متاح حالياً"}
          </div>

          {/* Contact */}
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
                  <span key={i} className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-100">{skill}</span>
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
                  <a href={`/cv-builder?view=${seekerId}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors">
                    <FileText className="w-4 h-4" />عرض السيرة الذاتية
                  </a>
                )}
                {seeker?.cv_url && (
                  <a href={seeker.cv_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                    <Download className="w-4 h-4" />تحميل ملف CV
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Interview details (if already scheduled) */}
          {isInterview && applicant.interview_date && (
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-purple-700">
                <Calendar className="w-4 h-4" />
                <h5 className="font-black text-sm">موعد المقابلة المجدولة</h5>
              </div>
              <p className="text-sm font-bold text-purple-900">
                {new Date(applicant.interview_date).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
              </p>
              {applicant.interview_location && <p className="text-xs text-purple-700 mt-1">📍 {applicant.interview_location}</p>}
              {applicant.interview_notes && <p className="text-xs text-purple-600 mt-1 italic">{applicant.interview_notes}</p>}
            </div>
          )}

          {/* ───── ACTIONS ───── */}
          {!isTerminal && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase">الإجراءات</p>

              {/* Shortlist button — only from first stage */}
              {isPending && !showInterviewForm && !showRejectForm && (
                <button
                  onClick={handleShortlist}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  إضافة إلى القائمة المختصرة
                </button>
              )}

              {/* Schedule Interview — from shortlist stage */}
              {isShortlisted && !showInterviewForm && !showRejectForm && (
                <button
                  onClick={() => setShowInterviewForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  جدولة مقابلة عمل
                </button>
              )}

              {/* Accept — from interview stage */}
              {isInterview && !showRejectForm && (
                <button
                  onClick={handleAccept}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  قبول المتقدم للعمل
                </button>
              )}

              {/* Interview Scheduling Form (inline) */}
              {showInterviewForm && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 space-y-3">
                  <h4 className="text-sm font-black text-purple-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />جدولة موعد المقابلة
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-purple-700 mb-1">التاريخ *</label>
                      <input type="date" required value={intDate} onChange={(e) => setIntDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-purple-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-700 mb-1">الوقت *</label>
                      <input type="time" required value={intTime} onChange={(e) => setIntTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-purple-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-700 mb-1">مكان المقابلة (اختياري)</label>
                    <input type="text" placeholder="مثال: المكتب الرئيسي، شارع الرشيد" value={intLocation} onChange={(e) => setIntLocation(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-purple-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-700 mb-1">ملاحظات (اختياري)</label>
                    <textarea rows={2} placeholder="تعليمات إضافية للمتقدم..." value={intNotes} onChange={(e) => setIntNotes(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-purple-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowInterviewForm(false)}
                      className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      إلغاء
                    </button>
                    <button onClick={handleScheduleInterview} disabled={!intDate || !intTime}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-100">
                      تأكيد الجدولة
                    </button>
                  </div>
                </div>
              )}

              {/* Reject Form (inline) */}
              {showRejectForm && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-3">
                  <h4 className="text-sm font-black text-red-900">سبب الرفض (اختياري)</h4>
                  <textarea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-red-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    placeholder="مثال: الخبرة غير كافية لهذا المنصب..." />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRejectForm(false)}
                      className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      إلغاء
                    </button>
                    <button onClick={handleReject}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors">
                      تأكيد الرفض
                    </button>
                  </div>
                </div>
              )}

              {/* Reject trigger + Message — shown when no form is open */}
              {!showRejectForm && !showInterviewForm && (
                <div className="flex gap-2">
                  <button onClick={() => setShowRejectForm(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                    <XCircle className="w-4 h-4" />رفض
                  </button>
                  <Link href={`/messages?with=${seekerId}`} onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">
                    <MessageSquare className="w-4 h-4" />مراسلة
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Terminal state */}
          {isTerminal && (
            <div className={`pt-4 border-t border-slate-100 rounded-2xl p-4 text-center text-sm font-bold ${
              applicant.status === "مقبول" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}>
              {applicant.status === "مقبول" ? "✅ تم توظيف هذا المتقدم" : "❌ لم يتم توظيف هذا المتقدم"}
              {applicant.rejection_reason && (
                <p className="mt-1 text-slate-500 text-xs font-normal">السبب: {applicant.rejection_reason}</p>
              )}
              <Link href={`/messages?with=${seekerId}`} onClick={onClose}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />مراسلة
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployerDashboard({
  jobs,
  applications,
  employerData,
  onApplicationStatusChange,
  onJobAction,
  jobsRef,
  applicantsRef,
  onSelectApplicant,
  subscription,
}: {
  jobs: any[];
  applications: any[];
  employerData: any;
  subscription: any;
  onApplicationStatusChange: (id: string, status: string, interviewDate?: string | null, interviewLocation?: string | null, interviewNotes?: string | null, rejectionReason?: string | null) => void;
  onJobAction: (id: string, action: "pause" | "activate" | "close") => void;
  jobsRef: React.RefObject<HTMLDivElement | null>;
  applicantsRef: React.RefObject<HTMLDivElement | null>;
  onSelectApplicant: (applicant: any) => void;
}) {
  const businessName = employerData?.company_name || "صاحب العمل";
  const isLimitReached = subscription.current_job_count >= subscription.job_limit;

  // Stats
  const activeJobs = jobs.filter((j) => j.status === "approved").length;
  const newApplicants = applications.filter((a) => a.status === "قيد المراجعة").length;
  const totalApplicants = applications.length;
  const shortlisted = applications.filter((a) => a.status === "قائمة مختصرة").length;
  const upcomingInterviews = applications.filter((a) => a.status === "مقابلة").length;
  const hired = applications.filter((a) => a.status === "مقبول").length;

  const stats = [
    { label: "الوظائف النشطة", value: `${activeJobs} / ${subscription.job_limit}`, icon: Briefcase, color: "brand" },
    { label: "طلبات جديدة", value: newApplicants, icon: Users, color: "amber" },
    { label: "قائمة مختصرة", value: shortlisted, icon: Star, color: "indigo" },
    { label: "مقابلات قادمة", value: upcomingInterviews, icon: Clock, color: "purple" },
    { label: "إجمالي المتقدمين", value: totalApplicants, icon: TrendingUp, color: "blue" },
    { label: "تم التوظيف", value: hired, icon: CheckCircle2, color: "emerald" },
  ];

  // Pipeline counts
  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: applications.filter((a) => a.status === stage.key).length,
  }));

  // Latest applicants (top 6 by date)
  const latestApplicants = [...applications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const quickActions = [
    { icon: PlusCircle, title: "نشر وظيفة", desc: isLimitReached ? "وصلت للحد الأقصى" : "أضف فرصة عمل جديدة", href: isLimitReached ? "/pricing" : "/post-job", color: isLimitReached ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600 shadow-brand-100/50 shadow-lg" },
    { icon: UserCheck, title: "فريق العمل", desc: "إدارة الموظفين", href: "/dashboard/team", color: "bg-emerald-50 text-emerald-600 shadow-emerald-100/50 shadow-lg" },
    ...(subscription.allow_ads ? [{ icon: Megaphone, title: "إعلانات المنشأة", desc: "إدارة إعلاناتك المميزة", href: "/dashboard/ads", color: "bg-amber-50 text-amber-600 shadow-amber-100/50 shadow-lg" }] : []),
    { icon: MessageSquare, title: "الرسائل", desc: "تواصل مع المرشحين", href: "/messages", color: "bg-sky-50 text-sky-600 shadow-sky-100/50 shadow-lg" },
    { icon: Star, title: "باقتي الحالية", desc: subscription.plan_name, href: "/pricing", color: "bg-amber-50 text-amber-600 shadow-amber-100/50 shadow-lg" },
    { icon: Settings, title: "الإعدادات", desc: "بيانات المنشأة", href: "/profile", color: "bg-slate-50 text-slate-600 shadow-slate-100/50 shadow-lg" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[32px] p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 backdrop-blur-xl border border-brand-500/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                مرحباً بك، {businessName}
              </h1>
            </div>
            <p className="text-slate-400 text-sm sm:text-base font-medium max-w-lg">
              إليك نظرة شاملة على عمليات التوظيف في منشأتك. يمكنك متابعة المتقدمين وجدولة المقابلات بسهولة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {subscription.status === 'pending' && (
              <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/30 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-amber-400 text-xs font-bold">
                <Clock className="w-4 h-4 animate-pulse" />
                تتم مراجعة طلب الترقية لـ {subscription.plan_name}
              </div>
            )}
            <Link
              href="/post-job"
              className="group bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2 shadow-xl shadow-brand-900/20 hover:scale-[1.02] active:scale-95"
            >
              <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
              نشر وظيفة جديدة
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Professional Hiring Pipeline Visualizer */}
      <div className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              مسار التوظيف الذكي
            </h2>
            <p className="text-xs text-slate-500 font-medium">تتبع مراحل تقدم المتقدمين لكل وظيفة</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تحديث مباشر</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {pipelineCounts.map((step, idx) => (
            <div
              key={step.key}
              className="group relative flex flex-col items-center"
            >
              <div className={`w-full aspect-square rounded-[24px] p-4 flex flex-col items-center justify-center transition-all duration-300 border-2 ${
                step.count > 0 
                ? `${step.color} border-transparent shadow-lg ${step.ring}` 
                : 'bg-slate-50 border-slate-100 text-slate-300 grayscale opacity-60'
              }`}>
                <step.icon className={`w-6 h-6 mb-2 ${step.count > 0 ? 'text-white' : 'text-slate-300'}`} />
                <div className={`text-2xl font-black ${step.count > 0 ? 'text-white' : 'text-slate-400'}`}>{step.count}</div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-[11px] font-black text-slate-900 mb-0.5">{step.label}</div>
              </div>
              
              {/* Connector line for desktop */}
              {idx < pipelineCounts.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -translate-y-8 left-[-16px] w-8 h-[2px] bg-slate-100" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {quickActions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="flex flex-col items-center gap-3 p-6 bg-white border border-slate-100 rounded-3xl hover:border-brand-200 hover:shadow-xl transition-all group text-center"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${action.color}`}>
              <action.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{action.title}</h3>
              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Latest Applicants */}
        <div className="lg:col-span-8 space-y-6" ref={applicantsRef}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">أحدث المتقدمين</h2>
            </div>
            <Link href="/dashboard/applicants" className="text-xs font-black text-brand-600 hover:text-brand-700 bg-brand-50 px-4 py-2 rounded-xl transition-colors">عرض الكل</Link>
          </div>

          {applications.length === 0 ? (
            <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-600 mb-2">لا توجد طلبات توظيف حتى الآن</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">بمجرد نشر وظائفك، ستظهر طلبات المرشحين هنا للمراجعة والتوظيف.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestApplicants.map((app) => (
                <div 
                  key={app.id} 
                  className="bg-white border border-slate-100 rounded-3xl p-5 hover:border-brand-200 hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-brand-500 transition-colors" />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-700 text-lg font-black overflow-hidden border border-brand-100">
                          {app.seekers?.profiles?.avatar_url ? (
                            <Image src={app.seekers.profiles.avatar_url} alt="" fill className="object-cover" sizes="48px" />
                          ) : (
                            app.seekers?.profiles?.full_name?.charAt(0) || "م"
                          )}
                        </div>
                        {app.status === 'قيد المراجعة' && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors line-clamp-1">{app.seekers?.profiles?.full_name || "مستخدم"}</h3>
                        <p className="text-[11px] text-slate-500 font-bold">{app.seekers?.job_title || "باحث عن عمل"}</p>
                      </div>
                    </div>
                    <StatusDropdown
                      currentStatus={app.status}
                      onChange={(status, reason) => onApplicationStatusChange(app.id, status, undefined, undefined, undefined, reason)}
                    />
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      متقدم لوظيفة: <span className="text-slate-900 font-bold">{app.jobs?.title}</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {app.seekers?.profiles?.location || "نابلس"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        {app.seekers?.experience_years ? `${app.seekers.experience_years} سنة خبرة` : "بدون خبرة"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                    <button
                      onClick={() => onSelectApplicant(app)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> مراجعة الملف
                    </button>
                    <Link
                      href={`/messages?with=${app.seeker_id}`}
                      className="w-12 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center transition-all group/msg"
                    >
                      <MessageSquare className="w-4 h-4 group-hover/msg:scale-110 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Job Management & Stats */}
        <div className="lg:col-span-4 space-y-8" ref={jobsRef}>
          
          {/* Active Jobs Widget */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-900">وظائفي</h2>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{jobs.length} إجمالي</span>
            </div>

            {jobs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-400 font-bold mb-4">لم تنشر أي وظيفة بعد</p>
                <Link href="/post-job" className="text-xs font-black text-brand-600 hover:underline">انشر أول وظيفة الآن</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => {
                  const jobApps = applications.filter(a => a.job_id === job.id).length;
                  return (
                    <div key={job.id} className="group p-4 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 rounded-2xl transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">{job.title}</h3>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Users className="w-3 h-3" /> {jobApps} متقدم
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                            <Calendar className="w-3 h-3" /> {new Date(job.created_at).toLocaleDateString("ar-EG")}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onJobAction(job.id, job.status === 'approved' ? 'pause' : 'activate')} className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors">
                            {job.status === 'approved' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {jobs.length > 5 && (
              <Link href="/dashboard/jobs" className="block w-full text-center mt-6 py-3 border border-slate-100 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                عرض كافة الوظائف
              </Link>
            )}
          </div>

          {/* Hiring Success Tip */}
          <div className="bg-emerald-600 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl shadow-emerald-900/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-black mb-2">نصيحة للتوظيف السريع</h3>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed mb-4">
                الوظائف التي تظهر نطاق الراتب وموقع العمل الدقيق تحصل على متقدمين مؤهلين بنسبة 45% أكثر.
              </p>
              <button className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-200 px-4 py-2 rounded-lg hover:bg-white transition-colors">
                تحسين إعلاناتي
              </button>
            </div>
          </div>

        </div>
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
  const [selectedApp, setSelectedApp] = useState<any>(null);
  
  const { completionPercent, hasCV } = calculateProfileCompletion(profile, seekerProfile);

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
            <p className="text-xs text-slate-500">
              {hasCV 
                ? "أكمل بياناتك لزيادة فرصك في الحصول على وظيفة" 
                : "لقد أكملت ملفك الأساسي! قم برفع أو إنشاء السيرة الذاتية للحصول على 100%"}
            </p>
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
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">الحالة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-xs font-bold text-slate-500">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50 group">
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex flex-col">
                          <Link href={`/jobs/${app.job_id}`} className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors">{app.jobs?.title}</Link>
                          <span className="text-[11px] text-slate-500 font-medium">{app.jobs?.company_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${getAppStatusStyle(app.status)}`}>
                          {getAppStatusLabel(app.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-2 hover:bg-brand-50 rounded-lg text-brand-600 transition-colors group-hover:scale-110"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">تفاصيل الطلب</h3>
              <button onClick={() => setSelectedApp(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 text-right">
              <div className="flex items-center gap-4 bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-brand-100 shadow-sm font-black text-brand-600">
                  {selectedApp.jobs?.company_name?.[0]}
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{selectedApp.jobs?.title}</h4>
                  <p className="text-xs font-bold text-slate-500">{selectedApp.jobs?.company_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">حالة الطلب</p>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-black border ${getAppStatusStyle(selectedApp.status)}`}>
                    {getAppStatusLabel(selectedApp.status)}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">تاريخ التقديم</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(selectedApp.created_at).toLocaleDateString("ar-EG")}</p>
                </div>
              </div>

              {selectedApp.status === "مقابلة" && selectedApp.interview_date && (
                <div className="p-5 bg-purple-50 border border-purple-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 text-purple-700">
                    <Calendar className="w-5 h-5" />
                    <h5 className="font-black">موعد المقابلة</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-purple-600">التاريخ والوقت:</span>
                      <span className="font-black text-purple-900" dir="ltr">
                        {new Date(selectedApp.interview_date).toLocaleString("ar-EG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    {selectedApp.interview_location && (
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-purple-600 text-sm">المكان:</span>
                        <div className="bg-white/50 p-3 rounded-xl border border-purple-200 text-xs font-bold text-purple-900">
                          {selectedApp.interview_location}
                        </div>
                      </div>
                    )}
                    {selectedApp.interview_notes && (
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-purple-600 text-sm">ملاحظات إضافية:</span>
                        <p className="text-xs text-purple-800 leading-relaxed italic">"{selectedApp.interview_notes}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedApp.status === "لم يتم التوظيف" && selectedApp.rejection_reason && (
                <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2 text-rose-700">
                    <AlertCircle className="w-5 h-5" />
                    <h5 className="font-black">سبب عدم التوظيف</h5>
                  </div>
                  <p className="text-sm text-rose-800 leading-relaxed font-medium">
                    {selectedApp.rejection_reason}
                  </p>
                  <p className="text-[10px] text-rose-400 mt-4 italic font-bold">
                    * ملاحظة: هذا السبب تمت مشاركته معك لمساعدتك في تطوير مهاراتك لمقابلاتك القادمة.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <Link
                  href={`/jobs/${selectedApp.job_id}`}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-2xl text-sm font-black text-center hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                  عرض الإعلان
                </Link>
                <Link
                  href={`/messages?with=${selectedApp.jobs?.employer_id}`}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl text-sm font-black text-center hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                >
                  مراسلة الشركة
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
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
  value: number | string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    brand: "text-brand-600 bg-brand-50 border-brand-100 shadow-brand-100/50",
    blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/50",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100/50",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/50",
    amber: "text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100/50",
    purple: "text-purple-600 bg-purple-50 border-purple-100 shadow-purple-100/50",
    orange: "text-orange-600 bg-orange-50 border-orange-100 shadow-orange-100/50",
    rose: "text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/50",
    slate: "text-slate-600 bg-slate-50 border-slate-100 shadow-slate-100/50",
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border shadow-sm ${colorMap[color] || colorMap.slate}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-black text-slate-900 mb-0.5 tracking-tight">{value}</div>
      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
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
  onChange: (status: string, rejectionReason?: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const nextOptions = getNextStatuses(currentStatus);
  const isTerminal = currentStatus === "مقبول" || currentStatus === "لم يتم التوظيف";

  const handleOptionClick = (status: string) => {
    if (status === "لم يتم التوظيف" && requiresRejectionReason(currentStatus)) {
      setShowRejectModal(true);
      setIsOpen(false);
      return;
    }
    onChange(status);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => !isTerminal && setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${getAppStatusStyle(currentStatus)} ${isTerminal ? 'cursor-default' : ''}`}
      >
        {getAppStatusLabel(currentStatus)}
        {!isTerminal && <ChevronDown className="h-3 w-3" />}
      </button>

      {isOpen && nextOptions.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
            <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 border-b border-slate-100">الخطوة التالية</div>
            {nextOptions.map((status) => {
              const option = APP_STATUS_OPTIONS.find((o) => o.value === status);
              const isReject = status === "لم يتم التوظيف";
              return (
                <button
                  key={status}
                  onClick={() => handleOptionClick(status)}
                  className={`w-full text-right px-3 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                    isReject ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'
                  }`}
                >
                  {isReject ? <XCircle className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5 rotate-180" />}
                  {option?.label || status}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">سبب عدم التوظيف</h3>
              <p className="text-xs text-slate-500 mt-1">يرجى كتابة سبب عدم التوظيف لمساعدتنا في تطوير الموظف</p>
            </div>
            <div className="p-5">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-right resize-none"
                placeholder="مثال: يحتاج تحسين مهارات التواصل..."
                autoFocus
              />
            </div>
            <div className="p-5 border-t border-slate-100 flex gap-2 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">إلغاء</button>
              <button onClick={() => { onChange("لم يتم التوظيف", rejectionReason || null); setShowRejectModal(false); }} className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700">تأكيد عدم التوظيف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
