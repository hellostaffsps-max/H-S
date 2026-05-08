"use client";
import { useState } from "react";
import { Pencil, CheckCircle2, FileText, Save, Loader2, MapPin, Phone } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { updateProfile, updateSeekerProfile } from "@/app/actions/profile";
import Link from "next/link";

interface SeekerProfileProps {
  profile: any;
  user: any;
  seekerData: any;
  onSeekerDataUpdate: (data: any) => void;
}

export default function SeekerProfile({ profile, user, seekerData, onSeekerDataUpdate }: SeekerProfileProps) {
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarUpload = async (url: string) => {
    setAvatarUrl(url);
    if (isSupabaseConfigured && user) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const [profileResult, seekerResult] = await Promise.all([
      updateProfile(formData),
      updateSeekerProfile(formData),
    ]);

    if (profileResult.success || seekerResult.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      if (user) {
        const { data } = await supabase
          .from("seekers")
          .select("*")
          .eq("profile_id", user.id)
          .single();
        onSeekerDataUpdate(data);
      }
    } else {
      setError(profileResult.error || seekerResult.error || "حدث خطأ");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <div className="h-24 sm:h-32 bg-brand-100 w-full relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-600 to-transparent" />
        </div>
        <div className="px-4 sm:px-6 pb-6 pt-4 relative flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
          <div className="flex items-center gap-4 absolute -top-12 sm:static w-full sm:w-auto">
            <AvatarUpload
              currentUrl={avatarUrl}
              onUpload={handleAvatarUpload}
              fallbackInitial={(profile?.full_name || "h")[0]}
            />
            <div className="pt-12 sm:pt-0 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {profile?.full_name || "مرحباً"}
              </h1>
              <p className="text-slate-500 text-sm">
                {seekerData?.job_title || "أضف مسماك الوظيفي"}
              </p>
            </div>
          </div>

          <div className={`w-full sm:w-auto ${seekerData?.is_available !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'} border px-3 py-1.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 mt-16 sm:mt-0`}>
            <CheckCircle2 className="w-4 h-4" />
            {seekerData?.is_available !== false
              ? "متاح للعمل"
              : seekerData?.current_employer
                ? `يعمل حالياً في ${seekerData.current_employer}`
                : "غير متاح حالياً"
            }
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-wrap gap-3">
          <Link
            href="/cv-builder"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-sm hover:bg-brand-100 transition-colors font-bold"
          >
            <FileText className="w-4 h-4" /> السيرة الذاتية (CV)
          </Link>
          <Link
            href="/messages"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm hover:bg-slate-100 transition-colors font-bold"
          >
            <MessageIcon /> الرسائل
          </Link>
        </div>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-slate-900 w-full text-right">
            البيانات الشخصية
          </h2>
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
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
              الاسم الكامل
            </label>
            <input
              name="full_name"
              type="text"
              defaultValue={profile?.full_name || ""}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
              رقم الهاتف
            </label>
            <div className="relative">
              <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                name="phone"
                type="tel"
                defaultValue={profile?.phone || ""}
                className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                placeholder="+970 5xx xxx xxx"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
              الموقع
            </label>
            <div className="relative">
              <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                name="location"
                type="text"
                defaultValue={profile?.location || ""}
                className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
                placeholder="رام الله، نابلس..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
              المسمى الوظيفي
            </label>
            <input
              name="job_title"
              type="text"
              defaultValue={seekerData?.job_title || ""}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
              placeholder="نادل، طاهي، باريستا..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
              سنوات الخبرة
            </label>
            <input
              name="experience_years"
              type="number"
              min={0}
              defaultValue={seekerData?.experience_years ?? ""}
              className="w-full sm:w-1/2 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right"
              placeholder="0"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5 w-full text-right">
              نبذة عنك
            </label>
            <textarea
              name="bio"
              rows={3}
              defaultValue={seekerData?.bio || ""}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right resize-none"
              placeholder="اكتب نبذة قصيرة عن خبراتك ومهاراتك..."
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
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

function MessageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}
