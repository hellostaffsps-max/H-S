"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Pencil, CheckCircle2, FileText, Save, Loader2 } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { updateProfile, updateSeekerProfile } from "@/app/actions/profile";
import Link from "next/link";

export default function Profile() {
  const { profile, user } = useAuth();
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
    } else {
      setError(profileResult.error || seekerResult.error || "حدث خطأ");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-8 shadow-sm">
        <div className="h-24 sm:h-32 bg-brand-100 w-full relative"></div>
        <div className="px-4 sm:px-6 pb-6 pt-4 relative flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
          <div className="flex items-center gap-4 absolute -top-12 sm:static w-full sm:w-auto">
            <AvatarUpload
              currentUrl={avatarUrl}
              onUpload={handleAvatarUpload}
              fallbackInitial={(profile?.full_name || "h")[0]}
            />
            <div className="pt-12 sm:pt-0 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{profile?.full_name || "hello staffs"}</h1>
              <p className="text-slate-500 text-sm">أضف مسماك الوظيفي</p>
            </div>
          </div>

          <div className="w-full sm:w-auto bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 mt-16 sm:mt-0">
            <CheckCircle2 className="w-4 h-4" /> متاح للعمل
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex gap-3 sm:gap-4">
          <Link href="/cv-builder" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 text-sm hover:bg-brand-100 transition-colors font-medium">
            <FileText className="w-4 h-4" /> السيرة الذاتية (CV)
          </Link>
        </div>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 w-full text-right">البيانات الشخصية</h2>
          {success && (
            <span className="text-green-600 text-sm font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> تم الحفظ
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 w-full text-right">الاسم الكامل</label>
            <input name="full_name" type="text" defaultValue={profile?.full_name || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 w-full text-right">رقم الهاتف</label>
            <input name="phone" type="tel" defaultValue={profile?.phone || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 w-full text-right">الموقع</label>
            <input name="location" type="text" defaultValue={profile?.location || ""} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="رام الله، نابلس..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 w-full text-right">المسمى الوظيفي</label>
            <input name="job_title" type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="نادل، طاهي، باريستا..." />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5 w-full text-right">سنوات الخبرة</label>
            <input name="experience_years" type="number" className="w-full sm:w-1/2 bg-white border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-right" placeholder="" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
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
    </div>
  );
}
