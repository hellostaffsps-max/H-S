"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  MapPin,
  Award,
  Phone,
  Mail,
  FileText,
  Download,
  Calendar,
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare
} from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";

export default function ApplicantModal({
  applicant,
  onClose,
  onStatusChange,
}: {
  applicant: any;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: string,
    interviewDate?: string | null,
    interviewLocation?: string | null,
    interviewNotes?: string | null,
    rejectionReason?: string | null
  ) => void;
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
                  <a href={seeker.cv_url.startsWith('http') ? seeker.cv_url : `/api/cv?path=${encodeURIComponent(seeker.cv_url)}`} target="_blank" rel="noopener noreferrer"
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
