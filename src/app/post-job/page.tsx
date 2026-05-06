"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Rocket,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building2,
  UserPlus,
  LogIn,
  Clock,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { createJob } from "@/app/actions/jobs";
import { useAuth } from "@/hooks/useAuth";

export default function PostJob() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isEmployer = profile?.role === "employer";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await createJob(formData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } else {
      setError(result.error || "حدث خطأ أثناء نشر الوظيفة");
    }

    setLoading(false);
  }

  // Not logged in — professional employer onboarding
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-12 sm:py-20">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-brand-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
            أنشئ حساب صاحب عمل
          </h1>
          <p className="text-slate-500 text-base max-w-md mx-auto mb-2">
            وانشر أول وظيفة خلال أقل من دقيقة. وظّف كفاءات الضيافة بسرعة
            وبملفات واضحة.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 mb-8">
            <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
              <Clock className="h-3 w-3" /> أقل من دقيقة
            </span>
            <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
              <ShieldCheck className="h-3 w-3" /> مجاني
            </span>
            <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
              <Briefcase className="h-3 w-3" /> وصول مباشر للمرشحين
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/signup?role=employer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
            >
              <UserPlus className="h-5 w-5" />
              إنشاء حساب صاحب عمل
            </Link>
            <Link
              href="/auth/login?redirect=/post-job"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              تسجيل الدخول
            </Link>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            بتسجيلك، أنت توافق على{" "}
            <Link href="/terms" className="text-brand-600 hover:underline">
              شروط الاستخدام
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="text-brand-600 hover:underline">
              سياسة الخصوصية
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (!isEmployer) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">غير مصرح</h2>
        <p className="text-slate-500 mb-6">
          فقط أصحاب العمل يمكنهم نشر الوظائف. هل أنت صاحب عمل؟ تواصل مع الدعم.
        </p>
        <Link
          href="/contact"
          className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors"
        >
          تواصل معنا
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
          نشر وظيفة جديدة{" "}
          <span className="bg-brand-50 text-brand-600 p-1.5 rounded-full">
            <Rocket className="h-5 w-5" />
          </span>
        </h1>
        <p className="text-sm text-slate-500">
          أضف تفاصيل الوظيفة لتجذب أفضل المرشحين
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p>تم نشر الوظيفة بنجاح! جاري التوجيه...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Basic Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            معلومات الوظيفة الأساسية
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                عنوان الوظيفة *
              </label>
              <input
                name="title"
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="مثال: نادل/ة خبرة، باريستا، طاهي"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                التخصص *
              </label>
              <select
                name="category"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="">اختر التخصص</option>
                <option value="طاهي/ة">طاهي/ة</option>
                <option value="نادل/ة">نادل/ة</option>
                <option value="باريستا">باريستا</option>
                <option value="كاشير">كاشير</option>
                <option value="مدير">مدير</option>
                <option value="توصيل">توصيل</option>
                <option value="مضيف/ة">مضيف/ة</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                نوع الدوام *
              </label>
              <select
                name="type"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="">اختر النوع</option>
                <option value="دوام كامل">دوام كامل</option>
                <option value="دوام جزئي">دوام جزئي</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                اسم المطعم/المقهى *
              </label>
              <input
                name="company_name"
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="اسم المنشأة"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                الموقع *
              </label>
              <input
                name="location"
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="رام الله، نابلس..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                الخبرة المطلوبة
              </label>
              <select
                name="experience_level"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="">بدون خبرة</option>
                <option value="1-3 سنوات">1-3 سنوات</option>
                <option value="3+ سنوات">3+ سنوات</option>
                <option value="5+ سنوات">5+ سنوات</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">
            وصف الوظيفة
          </h2>
          <textarea
            name="description"
            required
            rows={5}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            placeholder="اكتب وصفاً تفصيلياً للوظيفة، المهام، والمتطلبات..."
          ></textarea>
        </div>

        {/* Salary and Contact */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">
            الراتب والتواصل
          </h2>

          <div className="grid sm:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                الراتب من
              </label>
              <input
                name="salary_min"
                type="number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                الراتب إلى
              </label>
              <input
                name="salary_max"
                type="number"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
                العملة
              </label>
              <select
                name="currency"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="ILS">شيكل ₪</option>
                <option value="USD">دولار $</option>
                <option value="JOD">دينار JD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-right w-full">
              رقم واتساب للتواصل
            </label>
            <input
              name="whatsapp_number"
              type="tel"
              dir="ltr"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 sm:py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-left"
              placeholder="+970599..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-base sm:text-sm py-3.5 sm:py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "نشر الوظيفة 🚀"
          )}
        </button>
      </form>
    </div>
  );
}
