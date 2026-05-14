"use client";

import Image from "next/image";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Star,
  Calendar,
  FileText,
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle,
  UserCircle,
} from "lucide-react";

interface Seeker {
  profile_id: string;
  job_title: string | null;
  experience_years: number | null;
  skills: string[] | null;
  bio: string | null;
  cv_url: string | null;
  is_available: boolean | null;
  current_employer: string | null;
  verification_status: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
}

interface Props {
  seeker: Seeker | null;
  onClose: () => void;
  onUpdateVerification: (id: string, status: string) => Promise<void>;
}

export default function SeekerDetailModal({ seeker, onClose, onUpdateVerification }: Props) {
  if (!seeker) return null;

  const profile = seeker.profiles;

  const getStatusBadge = () => {
    const status = seeker.verification_status || "pending";
    if (status === "verified") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-sm font-bold">
          <ShieldCheck className="h-4 w-4" /> موثق
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-bold">
          <XCircle className="h-4 w-4" /> مرفوض
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-sm font-bold">
        <Clock className="h-4 w-4" /> قيد التوثيق
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-brand-600" />
            بطاقة الموظف
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0 overflow-hidden border-2 border-brand-100">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <UserCircle className="h-10 w-10 text-brand-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900">{profile?.full_name || "بدون اسم"}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {getStatusBadge()}
                {seeker.is_available !== false ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                    <CheckCircle className="h-3 w-3" /> متاح للعمل
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">
                    غير متاح
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">المسمى الوظيفي</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Briefcase className="h-4 w-4 text-brand-600" />
                {seeker.job_title || "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">سنوات الخبرة</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Star className="h-4 w-4 text-amber-500" />
                {seeker.experience_years != null ? `${seeker.experience_years} سنوات` : "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">البريد الإلكتروني</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Mail className="h-4 w-4 text-slate-500" />
                {profile?.email || "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">رقم الهاتف</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Phone className="h-4 w-4 text-slate-500" />
                {profile?.phone || "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">الموقع</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <MapPin className="h-4 w-4 text-slate-500" />
                {profile?.location || "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">تاريخ التسجيل</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Calendar className="h-4 w-4 text-slate-500" />
                {new Date(profile?.created_at || 0).toLocaleDateString("ar-EG")}
              </div>
            </div>
          </div>

          {/* Skills */}
          {seeker.skills && seeker.skills.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">المهارات</p>
              <div className="flex flex-wrap gap-2">
                {seeker.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold border border-brand-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {seeker.bio && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">نبذة عن الموظف</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">{seeker.bio}</p>
            </div>
          )}

          {/* CV */}
          {seeker.cv_url && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">السيرة الذاتية</p>
              <a
                href={seeker.cv_url.startsWith('http') ? seeker.cv_url : `/api/cv?path=${encodeURIComponent(seeker.cv_url)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                عرض السيرة الذاتية (PDF)
              </a>
            </div>
          )}

          {/* Verification Actions */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">إجراءات التوثيق</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => onUpdateVerification(seeker.profile_id, "verified")}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                توثيق الحساب
              </button>
              <button
                onClick={() => onUpdateVerification(seeker.profile_id, "rejected")}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                رفض التوثيق
              </button>
              <button
                onClick={() => onUpdateVerification(seeker.profile_id, "pending")}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors"
              >
                <Clock className="h-4 w-4" />
                إعادة للمراجعة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
