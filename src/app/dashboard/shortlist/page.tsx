"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getApplications, updateApplicationStatus } from "@/app/actions/applications";
import Link from "next/link";
import {
  Star,
  MapPin,
  Award,
  Calendar,
  MessageSquare,
  Search,
  Loader2,
  Briefcase,
  Sparkles,
  ArrowLeft,
  XCircle,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import ApplicantModal from "@/components/ApplicantModal";

export default function ShortlistPage() {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  useEffect(() => {
    if (user && profile?.role === "employer") {
      fetchShortlist();
    } else if (profile?.role === "seeker" || profile?.role === "admin") {
      window.location.href = "/dashboard";
    }
  }, [user, profile]);

  async function fetchShortlist() {
    setLoading(true);
    const result = await getApplications();
    if (result.success) {
      // Filter only active applications to this employer's jobs with status "قائمة مختصرة"
      const filtered = (result.data || []).filter(
        (app: any) => app.jobs && app.status === "قائمة مختصرة"
      );
      setApplications(filtered);
    } else {
      setError(result.error || "فشل تحميل قائمة المرشحين");
    }
    setLoading(false);
  }

  const handleStatusChange = async (
    applicationId: string,
    newStatus: string,
    interviewDate?: string | null,
    interviewLocation?: string | null,
    interviewNotes?: string | null,
    rejectionReason?: string | null
  ) => {
    try {
      const result = await updateApplicationStatus(
        applicationId,
        newStatus,
        interviewDate,
        interviewLocation,
        interviewNotes,
        rejectionReason
      );

      if (result.success) {
        let msg = "";
        if (newStatus === "مقابلة") {
          msg = "تمت جدولة المقابلة بنجاح وإرسال إشعار للمتقدم";
        } else if (newStatus === "مقبول") {
          msg = "تم قبول المتقدم بنجاح للوظيفة";
        } else if (newStatus === "لم يتم التوظيف") {
          msg = "تم رفض المتقدم وتحديث حالة الطلب";
        } else {
          msg = "تم تحديث حالة الطلب بنجاح";
        }

        setSuccess(msg);
        setTimeout(() => setSuccess(null), 4000);
        // Refresh shortlist
        await fetchShortlist();
      } else {
        setError(result.error || "فشل تحديث حالة الطلب");
        setTimeout(() => setError(null), 4000);
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع أثناء تحديث الحالة");
      setTimeout(() => setError(null), 4000);
    }
  };

  // Filter based on search query
  const filteredApplicants = applications.filter((app) => {
    const candidateName = app.seekers?.profiles?.full_name || "";
    const jobTitle = app.jobs?.title || "";
    const skills = app.seekers?.skills || [];
    const query = searchQuery.toLowerCase();

    return (
      candidateName.toLowerCase().includes(query) ||
      jobTitle.toLowerCase().includes(query) ||
      skills.some((skill: string) => skill.toLowerCase().includes(query))
    );
  });

  if (!user || profile?.role !== "employer") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8" dir="rtl">
      {/* Back to Dashboard and Header */}
      <div className="mb-8 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          العودة للوحة التحكم
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
              القائمة المختصرة
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              المرشحون المفضلون الذين قمت بإضافتهم للقائمة المختصرة لمتابعتهم وجدولة المقابلات معهم
            </p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl text-xs font-extrabold border border-indigo-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            إجمالي المختصرين: {applications.length}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-bold text-emerald-700">{success}</p>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="ابحث باسم المرشح، الوظيفة، أو المهارات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-[20px] text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all shadow-sm"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[32px] p-12 sm:p-16 text-center shadow-sm max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Star className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">قائمتك المختصرة فارغة حالياً</h3>
          <p className="text-slate-500 leading-relaxed mb-8 text-sm">
            يمكنك إضافة المتقدمين إلى قائمتك المختصرة مباشرة عند تصفح طلبات التوظيف الجديدة من لوحة التحكم، لمتابعتهم لاحقاً وجدولة مقابلات العمل.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-2xl text-sm font-black transition-all shadow-lg shadow-brand-100"
          >
            تصفح طلبات التوظيف
          </Link>
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-12 text-center max-w-lg mx-auto">
          <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h4 className="text-lg font-bold text-slate-900 mb-1">لا توجد نتائج مطابقة</h4>
          <p className="text-xs text-slate-500">جرب البحث بكلمات مختلفة أو امسح شريط البحث.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplicants.map((app) => {
            const seeker = app.seekers;
            const profileData = seeker?.profiles;
            const fullName = profileData?.full_name || "مستخدم";
            const initials = fullName.charAt(0) || "م";
            const location = profileData?.location || "";
            const experience = seeker?.experience_years != null ? `${seeker.experience_years} سنة خبرة` : "";
            const jobTitle = seeker?.job_title || "";
            const appliedJob = app.jobs?.title || "";

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 hover:border-brand-500/30 rounded-[24px] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Card Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 text-lg font-black relative overflow-hidden shrink-0">
                        {profileData?.avatar_url ? (
                          <Image
                            src={profileData.avatar_url}
                            alt={fullName}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1">
                          {fullName}
                        </h3>
                        <p className="text-xs text-slate-400 font-bold line-clamp-1">{jobTitle || "—"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedApplicant(app)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-50 transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Briefcase className="w-4 h-4 text-slate-400 hover:text-brand-600" />
                    </button>
                  </div>

                  {/* Middle Info */}
                  <div className="space-y-2 mb-4">
                    {appliedJob && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">متقدم لوظيفة:</span>
                        <span className="font-bold text-slate-700">{appliedJob}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-300" />
                          {location}
                        </span>
                      )}
                      {experience && (
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-slate-300" />
                          {experience}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills tags */}
                  {seeker?.skills && seeker.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {seeker.skills.slice(0, 3).map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 text-[10px] font-bold rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                      {seeker.skills.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-md">
                          +{seeker.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedApplicant(app)}
                    className="flex-1 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100/70 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    جدولة مقابلة
                  </button>
                  <Link
                    href={`/messages?with=${seeker?.seeker_id || seeker?.id}`}
                    className="flex-1 py-2.5 bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    مراسلة
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <ApplicantModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
