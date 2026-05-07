"use client";
import { useState } from "react";
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
  Globe,
  Upload,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { updateProfile, updateEmployerProfile } from "@/app/actions/profile";
import Link from "next/link";
import ImageUpload from "@/components/ImageUpload";
import { cn } from "@/lib/utils";

interface EmployerProfileProps {
  profile: any;
  user: any;
  employerData: any;
  onEmployerDataUpdate: (data: any) => void;
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

export default function EmployerProfile({ profile, user, employerData, onEmployerDataUpdate }: EmployerProfileProps) {
  const [logoUrl, setLogoUrl] = useState(employerData?.logo_url || null);
  const [coverUrl, setCoverUrl] = useState(employerData?.cover_image_url || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = async (url: string) => {
    setLogoUrl(url);
    if (isSupabaseConfigured && user) {
      await supabase.from("employers").update({ logo_url: url }).eq("profile_id", user.id);
    }
  };

  const handleCoverUpload = async (url: string) => {
    setCoverUrl(url);
    if (isSupabaseConfigured && user) {
      await supabase.from("employers").update({ cover_image_url: url }).eq("profile_id", user.id);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const [profileResult, employerResult] = await Promise.all([
      updateProfile(formData),
      updateEmployerProfile(formData),
    ]);

    if (profileResult.success || employerResult.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      if (user) {
        const { data } = await supabase
          .from("employers")
          .select("*")
          .eq("profile_id", user.id)
          .single();
        onEmployerDataUpdate(data);
      }
    } else {
      setError(profileResult.error || employerResult.error || "حدث خطأ");
    }

    setLoading(false);
  }

  const isVerified = employerData?.verification_status === "verified";
  const isPending = employerData?.verification_status === "pending";

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
        {/* Cover Image */}
        <div className="h-32 sm:h-48 w-full relative bg-slate-100">
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-50 to-slate-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 sm:-mt-14 mb-4">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-md border-4 border-white overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-300" />
                )}
              </div>
            </div>

            {/* Name & Meta */}
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-2">
            <Link
              href="/post-job"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm"
            >
              <Briefcase className="w-4 h-4" />
              نشر وظيفة
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm font-bold hover:bg-brand-100 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              إدارة الوظائف
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              <Users className="w-4 h-4" />
              المتقدمين
            </Link>
            <Link
              href="/messages"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              الرسائل
            </Link>
          </div>
        </div>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-6">صور المنشأة</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <ImageUpload
                currentUrl={logoUrl}
                onUpload={handleLogoUpload}
                bucket="company-logos"
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
                bucket="company-covers"
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900">بيانات المنشأة</h2>
            {success && (
              <span className="text-green-600 text-sm font-bold flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-4 h-4" /> تم الحفظ
              </span>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                اسم المنشأة
              </label>
              <input
                name="company_name"
                type="text"
                defaultValue={employerData?.company_name || profile?.full_name || ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                placeholder="مثال: مطعم زيتونة"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                نوع النشاط
              </label>
              <select
                name="business_type"
                defaultValue={employerData?.business_type || ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none text-right"
              >
                {businessTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                المدينة
              </label>
              <div className="relative">
                <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="city"
                  type="text"
                  defaultValue={employerData?.city || profile?.location || ""}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                  placeholder="رام الله، نابلس، بيت لحم..."
                />
              </div>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                المنطقة / فرع
              </label>
              <input
                name="area"
                type="text"
                defaultValue={employerData?.area || ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                placeholder="المركز، الجنوب، فرع رئيسي..."
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="phone"
                  type="tel"
                  defaultValue={profile?.phone || ""}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                  placeholder="+970 2xx xxx xxx"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                رقم واتساب
              </label>
              <div className="relative">
                <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="whatsapp_number"
                  type="tel"
                  defaultValue={employerData?.whatsapp_number || ""}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                  placeholder="+970 5xx xxx xxx"
                />
              </div>
            </div>

            {/* Business Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                البريد الإلكتروني للمنشأة
              </label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="business_email"
                  type="email"
                  defaultValue={employerData?.business_email || ""}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                  placeholder="info@company.com"
                />
              </div>
            </div>

            {/* Number of Branches */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                عدد الفروع
              </label>
              <input
                name="number_of_branches"
                type="number"
                min={0}
                defaultValue={employerData?.number_of_branches ?? ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                placeholder="1"
              />
            </div>

            {/* Number of Employees */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                عدد الموظفين
              </label>
              <select
                name="number_of_employees"
                defaultValue={employerData?.number_of_employees || ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none text-right"
              >
                {employeeRanges.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Opening Hours */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                ساعات العمل
              </label>
              <div className="relative">
                <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  name="opening_hours"
                  type="text"
                  defaultValue={employerData?.opening_hours || ""}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                  placeholder="9:00 ص - 11:00 م"
                />
              </div>
            </div>

            {/* Business Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                نبذة عن المنشأة
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={employerData?.description || ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right resize-none"
                placeholder="اكتب نبذة قصيرة عن منشأتك وطبيعة العمل والفروع إن وجدت..."
              />
            </div>
          </div>
        </div>

        {/* Application Preferences */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-4">إعدادات استقبال الطلبات</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                طريقة استقبال طلبات التوظيف
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {applicationPrefs.map((pref) => (
                  <label
                    key={pref.value}
                    className={cn(
                      "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-colors",
                      (employerData?.application_preference || "platform_only") === pref.value
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="application_preference"
                      value={pref.value}
                      defaultChecked={(employerData?.application_preference || "platform_only") === pref.value}
                      className="sr-only"
                    />
                    <span className="font-bold text-sm text-slate-900">{pref.label}</span>
                    <span className="text-xs text-slate-500 mt-1">{pref.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="show_whatsapp_to_candidates"
                  value="true"
                  defaultChecked={employerData?.show_whatsapp_to_candidates === true}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-700">إظهار رقم الواتساب للمرشحين</span>
                  <p className="text-xs text-slate-500">سماح للباحثين عن عمل برؤية رقم الواتساب الخاص بالمنشأة</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ التغييرات
          </button>
        </div>
      </form>
    </div>
  );
}
