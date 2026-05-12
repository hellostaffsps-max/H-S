"use client";

import Image from "next/image";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  Globe,
  Clock,
  Users,
  Store,
  ShieldCheck,
  XCircle,
  Clock3,
} from "lucide-react";

interface Employer {
  profile_id: string;
  company_name: string;
  business_type: string | null;
  city: string | null;
  area: string | null;
  whatsapp_number: string | null;
  business_email: string | null;
  number_of_branches: number | null;
  number_of_employees: string | null;
  opening_hours: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  verification_status: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
  } | null;
}

interface Props {
  employer: Employer | null;
  onClose: () => void;
  onUpdateVerification: (id: string, status: string) => Promise<void>;
}

export default function EmployerDetailModal({ employer, onClose, onUpdateVerification }: Props) {
  if (!employer) return null;

  const profile = employer.profiles;

  const getStatusBadge = () => {
    const status = employer.verification_status || "pending";
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
        <Clock3 className="h-4 w-4" /> قيد التوثيق
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-600" />
            بطاقة المنشأة
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Logo + Company Name */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 overflow-hidden border-2 border-emerald-100">
              {employer.logo_url ? (
                <Image src={employer.logo_url} alt="" fill className="object-cover" sizes="80px" />
              ) : (
                <Building2 className="h-10 w-10 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-slate-900">{employer.company_name || "بدون اسم"}</h4>
              <p className="text-sm text-slate-500">{profile?.full_name || "—"}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {getStatusBadge()}
                {employer.business_type && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">
                    <Store className="h-3 w-3" /> {employer.business_type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {employer.cover_image_url && (
            <div className="relative h-40 w-full rounded-2xl overflow-hidden">
              <Image src={employer.cover_image_url} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 600px" />
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <p className="text-xs font-bold text-slate-400 uppercase">واتساب</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Globe className="h-4 w-4 text-green-500" />
                {employer.whatsapp_number || "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">البريد التجاري</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Mail className="h-4 w-4 text-slate-500" />
                {employer.business_email || "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">الموقع</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <MapPin className="h-4 w-4 text-slate-500" />
                {employer.city || "غير محدد"}{employer.area ? ` - ${employer.area}` : ""}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">تاريخ التسجيل</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Calendar className="h-4 w-4 text-slate-500" />
                {new Date(profile?.created_at || 0).toLocaleDateString("ar-EG")}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">عدد الفروع</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Store className="h-4 w-4 text-slate-500" />
                {employer.number_of_branches ?? "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase">عدد الموظفين</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Users className="h-4 w-4 text-slate-500" />
                {employer.number_of_employees || "غير محدد"}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-1 sm:col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase">ساعات العمل</p>
              <div className="flex items-center gap-2 text-sm text-slate-800 font-semibold">
                <Clock className="h-4 w-4 text-slate-500" />
                {employer.opening_hours || "غير محدد"}
              </div>
            </div>
          </div>

          {/* Description */}
          {employer.description && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">وصف المنشأة</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">{employer.description}</p>
            </div>
          )}

          {/* Verification Actions */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-400 uppercase mb-3">إجراءات التوثيق</p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => onUpdateVerification(employer.profile_id, "verified")}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                توثيق المنشأة
              </button>
              <button
                onClick={() => onUpdateVerification(employer.profile_id, "rejected")}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                رفض التوثيق
              </button>
              <button
                onClick={() => onUpdateVerification(employer.profile_id, "pending")}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors"
              >
                <Clock3 className="h-4 w-4" />
                إعادة للمراجعة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
