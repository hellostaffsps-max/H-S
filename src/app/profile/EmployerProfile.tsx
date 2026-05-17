"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  Save,
  Loader2,
  MapPin,
  Phone,
  Building2,
  Briefcase,
  Users,
  MessageSquare,
  ShieldCheck,
  Clock,
  Mail,
  Smartphone,
  Store,
  Pencil,
  Globe,
  Eye,
  CreditCard,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";
import { cn } from "@/lib/utils";

interface EmployerProfileProps {
  profile: any;
  user: any;
  employerData: any;
  onEmployerDataUpdate: (data: any) => void;
  onProfileUpdate?: () => Promise<void>;
}

const businessTypes = [
  { value: "", label: "اختر نوع النشاط" },
  { value: "مطعم", label: "مطعم" },
  { value: "مقهى", label: "مقهى" },
  { value: "فندق", label: "فندق" },
  { value: "مخبز", label: "مخبز / حلويات" },
  { value: "كفتيريا", label: "كفتيريا" },
  { value: "صالة مناسبات", label: "صالة مناسبات" },
  { value: "أخرى", label: "أخرى" },
];

const employeeRanges = [
  { value: "", label: "اختر نطاق" },
  { value: "1-5", label: "1 - 5 موظفين" },
  { value: "6-20", label: "6 - 20 موظف" },
  { value: "21-50", label: "21 - 50 موظف" },
  { value: "51-100", label: "51 - 100 موظف" },
  { value: "100+", label: "أكثر من 100 موظف" },
];

const applicationPrefs = [
  { value: "platform_only", label: "عبر المنصة فقط", desc: "استقبل الطلبات داخل Hello Staff" },
  { value: "whatsapp_only", label: "عبر واتساب فقط", desc: "استقبل الطلبات على رقم الواتساب" },
  { value: "both", label: "الطريقتين", desc: "استقبل الطلبات عبر المنصة والواتساب" },
];

export default function EmployerProfile({ profile, user, employerData, onEmployerDataUpdate, onProfileUpdate }: EmployerProfileProps) {
  const [logoUrl, setLogoUrl] = useState(employerData?.logo_url || null);
  const [coverUrl, setCoverUrl] = useState(employerData?.cover_image_url || null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Sync local image states when employerData changes from parent
  useEffect(() => {
    setLogoUrl(employerData?.logo_url || null);
    setCoverUrl(employerData?.cover_image_url || null);
  }, [employerData?.logo_url, employerData?.cover_image_url]);

  const handleLogoUpload = async (url: string) => {
    setLogoUrl(url);
    if (isSupabaseConfigured && user) {
      const { error: upsertErr } = await supabase
        .from("employers")
        .upsert({ profile_id: user.id, logo_url: url });
      if (upsertErr) {
        console.error("Logo upsert error:", upsertErr);
        setError("فشل حفظ الشعار — تأكد من حفظ بيانات المنشأة أولاً");
        return;
      }
      // Refresh employer data in parent so other pages see the change
      const { data } = await supabase
        .from("employers")
        .select("*")
        .eq("profile_id", user.id)
        .single();
      if (data) onEmployerDataUpdate(data);
    }
  };

  const handleCoverUpload = async (url: string) => {
    setCoverUrl(url);
    if (isSupabaseConfigured && user) {
      const { error: upsertErr } = await supabase
        .from("employers")
        .upsert({ profile_id: user.id, cover_image_url: url });
      if (upsertErr) {
        console.error("Cover upsert error:", upsertErr);
        setError("فشل حفظ صورة الغلاف — تأكد من حفظ بيانات المنشأة أولاً");
        return;
      }
      const { data } = await supabase
        .from("employers")
        .select("*")
        .eq("profile_id", user.id)
        .single();
      if (data) onEmployerDataUpdate(data);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const fd = new FormData(e.currentTarget);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.");
      }

      // 1. Update profiles table
      const profileUpdates: Record<string, any> = {};
      ["full_name", "phone", "location"].forEach((f) => {
        const v = fd.get(f);
        if (v !== null && v !== "") profileUpdates[f] = v;
      });

      if (Object.keys(profileUpdates).length > 0 && user) {
        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", user.id)
          .select();
        if (profileErr) throw profileErr;
        if (!profileData || profileData.length === 0) {
          throw new Error("لم يتم تحديث بيانات الملف الشخصي — تأكد من صلاحياتك");
        }
      }

      // 2. Update employers table
      const employerUpdates: Record<string, any> = {};
      const employerFields = [
        "company_name", "description", "business_type", "city", "area",
        "whatsapp_number", "business_email", "number_of_branches", "number_of_employees",
        "opening_hours", "application_preference", "show_whatsapp_to_candidates",
      ];
      employerFields.forEach((f) => {
        const v = fd.get(f);
        if (v !== null) {
          if (f === "number_of_branches") {
            const n = parseInt(v as string);
            employerUpdates[f] = isNaN(n) ? 0 : n;
          } else if (f === "show_whatsapp_to_candidates") {
            employerUpdates[f] = v === "true";
          } else {
            employerUpdates[f] = v;
          }
        }
      });
      // Preserve logo and cover from local state (they are not in form inputs)
      if (logoUrl) employerUpdates.logo_url = logoUrl;
      if (coverUrl) employerUpdates.cover_image_url = coverUrl;

      if (user) {
        const { data: empData, error: empErr } = await supabase
          .from("employers")
          .upsert({ profile_id: user.id, ...employerUpdates })
          .select();
        if (empErr) throw empErr;
        if (!empData || empData.length === 0) {
          throw new Error("لم يتم حفظ بيانات المنشأة — تأكد من صلاحياتك");
        }
      }

      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 4000);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

      if (user) {
        const { data } = await supabase
          .from("employers")
          .select("*")
          .eq("profile_id", user.id)
          .single();
        if (data) onEmployerDataUpdate(data);
      }
      // Refresh profile data (phone, location) in parent
      if (onProfileUpdate) {
        await onProfileUpdate();
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err?.message || err?.error_description || "حدث خطأ غير متوقع. جرّب مرة أخرى.");
    }

    setLoading(false);
  }

  const isVerified = employerData?.verification_status === "verified";
  const isPending = employerData?.verification_status === "pending";
  const prefLabel = applicationPrefs.find(p => p.value === employerData?.application_preference)?.label || "عبر المنصة فقط";

  return (
    <div ref={topRef} className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <div className="h-32 sm:h-48 w-full relative bg-slate-100">
          {coverUrl ? (
            <Image src={coverUrl} alt="Cover" fill className="object-cover" sizes="(max-width: 640px) 100vw, 800px" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-50 to-slate-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-md border-4 border-white overflow-hidden flex items-center justify-center relative">
                {logoUrl ? (
                  <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="96px" />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-300" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-2 sm:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {employerData?.company_name || profile?.full_name || "اسم المنشأة"}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    موثق
                  </span>
                )}
                {isPending && !isVerified && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    قيد التوثيق
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-500">
                {employerData?.business_type && (
                  <span className="flex items-center gap-1">
                    <Store className="w-3.5 h-3.5" />
                    {employerData.business_type}
                  </span>
                )}
                {(employerData?.city || profile?.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {employerData?.city || profile?.location}
                    {employerData?.area && ` — ${employerData.area}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Link href="/post-job" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm">
              <Briefcase className="w-4 h-4" />
              نشر وظيفة
            </Link>
            <Link href="/dashboard/jobs" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm font-bold hover:bg-brand-100 transition-colors">
              <Building2 className="w-4 h-4" />
              إدارة الوظائف
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors">
              <Users className="w-4 h-4" />
              المتقدمين
            </Link>
            <Link href="/messages" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors">
              <MessageSquare className="w-4 h-4" />
              الرسائل
            </Link>
            <Link href="/pricing" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors">
              <CreditCard className="w-4 h-4" />
              الباقات
            </Link>
            <button
              type="button"
              onClick={() => { setIsEditing(true); setError(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              تعديل الملف
            </button>
          </div>
        </div>
      </div>

      {/* Success toast */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">تم حفظ التغييرات بنجاح!</p>
          </div>
        </div>
      )}

      {/* Read-Only Profile Details Card */}
      {!isEditing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">بيانات المنشأة</h2>
            <button
              type="button"
              onClick={() => { setIsEditing(true); setError(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              تعديل
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">اسم المنشأة</span>
              <span className="text-slate-800 font-medium">{employerData?.company_name || profile?.full_name || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">نوع النشاط</span>
              <span className="text-slate-800 font-medium">{employerData?.business_type || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">المدينة</span>
              <span className="text-slate-800 font-medium">{employerData?.city || profile?.location || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">المنطقة / فرع</span>
              <span className="text-slate-800 font-medium">{employerData?.area || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">رقم الهاتف</span>
              <span className="text-slate-800 font-medium">{profile?.phone || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">رقم واتساب</span>
              <span className="text-slate-800 font-medium">{employerData?.whatsapp_number || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">البريد الإلكتروني</span>
              <span className="text-slate-800 font-medium">{employerData?.business_email || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">عدد الفروع</span>
              <span className="text-slate-800 font-medium">{employerData?.number_of_branches ?? "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">عدد الموظفين</span>
              <span className="text-slate-800 font-medium">{employerData?.number_of_employees || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">ساعات العمل</span>
              <span className="text-slate-800 font-medium">{employerData?.opening_hours || "—"}</span>
            </div>
          </div>

          {employerData?.description && (
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-1">نبذة عن المنشأة</span>
              <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 rounded-xl p-4">{employerData.description}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">طريقة استقبال الطلبات</span>
              <span className="text-slate-800 font-medium">{prefLabel}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">إظهار الواتساب للمرشحين</span>
              <span className="text-slate-800 font-medium">{employerData?.show_whatsapp_to_candidates ? "نعم" : "لا"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-slate-900">صور المنشأة</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                إلغاء
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <ImageUpload
                  currentUrl={logoUrl}
                  onUpload={handleLogoUpload}
                  bucket="avatars"
                  aspectRatio="square"
                  label="شعار المنشأة"
                  placeholder="اضغط لرفع الشعار"
                  maxSizeMB={0.5}
                  maxWidthOrHeight={500}
                />
              </div>
              <div>
                <ImageUpload
                  currentUrl={coverUrl}
                  onUpload={handleCoverUpload}
                  bucket="avatars"
                  aspectRatio="landscape"
                  label="صورة الغلاف"
                  placeholder="اضغط لرفع صورة الغلاف"
                  maxSizeMB={1}
                  maxWidthOrHeight={1200}
                />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم المنشأة</label>
                <input name="company_name" type="text" defaultValue={employerData?.company_name || profile?.full_name || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="مثال: مطعم زيتونة" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">نوع النشاط</label>
                <select name="business_type" defaultValue={employerData?.business_type || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none text-right">
                  {businessTypes.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">المدينة</label>
                <div className="relative">
                  <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input name="city" type="text" defaultValue={employerData?.city || profile?.location || ""} className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="رام الله، نابلس، بيت لحم..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">المنطقة / فرع</label>
                <input name="area" type="text" defaultValue={employerData?.area || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="المركز، الجنوب، فرع رئيسي..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input name="phone" type="tel" defaultValue={profile?.phone || ""} className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="+970 2xx xxx xxx" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم واتساب</label>
                <div className="relative">
                  <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input name="whatsapp_number" type="tel" defaultValue={employerData?.whatsapp_number || ""} className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="+970 5xx xxx xxx" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">البريد الإلكتروني للمنشأة</label>
                <div className="relative">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input name="business_email" type="email" defaultValue={employerData?.business_email || ""} className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="info@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">عدد الفروع</label>
                <input name="number_of_branches" type="number" min={0} defaultValue={employerData?.number_of_branches ?? ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="1" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">عدد الموظفين</label>
                <select name="number_of_employees" defaultValue={employerData?.number_of_employees || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none text-right">
                  {employeeRanges.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ساعات العمل</label>
                <div className="relative">
                  <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input name="opening_hours" type="text" defaultValue={employerData?.opening_hours || ""} className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="9:00 ص - 11:00 م" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">نبذة عن المنشأة</label>
                <textarea name="description" rows={4} defaultValue={employerData?.description || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right resize-none" placeholder="اكتب نبذة قصيرة عن منشأتك وطبيعة العمل والفروع إن وجدت..." />
              </div>
            </div>
          </div>

          {/* Application Preferences */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-4">إعدادات استقبال الطلبات</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">طريقة استقبال طلبات التوظيف</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {applicationPrefs.map((pref) => (
                    <label key={pref.value} className={cn("relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-colors", (employerData?.application_preference || "platform_only") === pref.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300")}>
                      <input type="radio" name="application_preference" value={pref.value} defaultChecked={(employerData?.application_preference || "platform_only") === pref.value} className="sr-only" />
                      <span className="font-bold text-sm text-slate-900">{pref.label}</span>
                      <span className="text-xs text-slate-500 mt-1">{pref.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="hidden" name="show_whatsapp_to_candidates" value="false" />
                  <input type="checkbox" name="show_whatsapp_to_candidates" value="true" defaultChecked={employerData?.show_whatsapp_to_candidates === true} className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <div>
                    <span className="text-sm font-bold text-slate-700">إظهار رقم الواتساب للمرشحين</span>
                    <p className="text-xs text-slate-500">سماح للباحثين عن عمل برؤية رقم الواتساب الخاص بالمنشأة</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ التغييرات
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
