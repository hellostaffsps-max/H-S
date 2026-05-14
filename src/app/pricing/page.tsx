"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Upload,
  CreditCard,
  Building,
  Loader2,
  AlertCircle,
  Sparkles,
  Briefcase,
  Users,
  ArrowLeft,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";

const fallbackPlans = [
  {
    id: "free",
    name: "باقة الانطلاق المجانية",
    price: 0,
    features: [
      "نشر وظيفة واحدة نشطة",
      "استقبال طلبات التقديم",
      "ملف المنشأة الأساسي",
      "دعم فني عبر البريد",
    ],
    recommended: false,
  },
  {
    id: "pro",
    name: "باقة صاحب العمل المحترف",
    price: 99,
    features: [
      "نشر حتى 5 وظائف نشطة",
      "البحث في السير الذاتية",
      "إدارة المتقدمين (Pipeline)",
      "أولوية الظهور في النتائج",
      "دعم فني مباشر",
    ],
    recommended: true,
  },
  {
    id: "business",
    name: "باقة الأعمال",
    price: 249,
    features: [
      "نشر وظائف غير محدودة",
      "إدارة فريق عمل متعدد",
      "أدوات توظيف متقدمة",
      "إحصائيات وتقارير أداء",
      "مدير حساب مخصص",
    ],
    recommended: false,
  },
];

function PricingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <div className="h-10 sm:h-12 lg:h-14 bg-slate-100 rounded-lg w-3/4 mx-auto mb-4 animate-pulse"></div>
        <div className="h-5 sm:h-6 bg-slate-100 rounded w-2/3 mx-auto animate-pulse"></div>
      </div>

      {/* Plans skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 max-w-5xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-slate-100 shadow-sm flex flex-col">
            <div className="h-6 bg-slate-100 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-10 bg-slate-100 rounded w-24 mb-6 animate-pulse"></div>
            <div className="space-y-4 mb-8 flex-grow">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-start gap-3">
                  <div className="h-5 w-5 bg-slate-100 rounded-full shrink-0 mt-0.5 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const { subscription, loading: subLoading } = useSubscription();

  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receiptPath, setReceiptPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [plansRes, settingsRes] = await Promise.all([
        supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("price", { ascending: true }),
        supabase
          .from("platform_settings")
          .select("wallet_qr_url, bank_details")
          .limit(1)
          .single(),
      ]);

      if (plansRes.data && plansRes.data.length > 0) {
        setPlans(plansRes.data);
      } else {
        setPlans(fallbackPlans);
      }
      if (settingsRes.data) {
        setSettings(settingsRes.data);
      }
    } catch {
      setPlans(fallbackPlans);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!profile) {
      alert("يرجى تسجيل الدخول أولاً");
      router.push("/login");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment_receipts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // payment_receipts is private — use signed URL (1 hour) for UI preview only
      const { data: signedData, error: signedError } = await supabase.storage
        .from("payment_receipts")
        .createSignedUrl(fileName, 3600);

      if (signedError || !signedData) throw signedError ?? new Error("فشل إنشاء رابط الإيصال");

      setReceiptPath(fileName); // Store relative path in state to save to DB
      setReceiptUrl(signedData.signedUrl); // Use temporary signed URL for UI preview
    } catch (error: any) {
      console.error("Upload error:", error.message);
      alert("حدث خطأ أثناء رفع الوصل. المرجو المحاولة مرة أخرى.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (planToSubmit?: any) => {
    const plan = planToSubmit || selectedPlan;
    if (!profile) {
      router.push("/login");
      return;
    }
    if (!plan) return;
    
    const isFree = plan.price === 0;
    if (!isFree && !receiptUrl) return;

    console.log("Submitting plan:", plan); // For debugging

    setSubmitting(true);
    try {
      // Prepare subscription data with robust fallbacks
      const subData: any = {
        user_id: profile.id,
        plan_name: plan.name || plan.plan_name || "باقة مخصصة",
        payment_receipt_url: isFree ? null : receiptPath,
        status: isFree ? "free" : "pending",
      };

      // Only include plan_id if it's a valid UUID (not a fallback string like 'pro')
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (plan.id && uuidRegex.test(plan.id)) {
        subData.plan_id = plan.id;
      }

      // starts_at is NOT NULL in the database, so we must provide a value or omit it for default
      // If it's free, we set it now. If pending, we can set it now too as the "request date" 
      // or let it default to now().
      subData.starts_at = new Date().toISOString();

      if (isFree) {
        subData.ends_at = new Date(Date.now() + (plan.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase.from("user_subscriptions").insert(subData);

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      console.error("Submission error:", error);
      alert(`حدث خطأ أثناء تقديم الطلب: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PricingSkeleton />;
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
            {selectedPlan?.price === 0 ? "تم تفعيل باقتك بنجاح!" : "تم استلام طلب الترقية!"}
          </h2>
          <p className="text-slate-500 mb-8">
            {selectedPlan?.price === 0 
              ? `باقة "${selectedPlan?.name}" نشطة الآن. يمكنك البدء بنشر وظائفك وإدارة المتقدمين.`
              : `بانتظار مراجعة الدفع لتفعيل "${selectedPlan?.name}". يمكنك الاستمرار في استخدام ميزات الباقة المجانية حالياً حتى يتم التفعيل.`
            }
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                router.refresh();
                router.push("/dashboard");
              }}
              className="w-full py-4 bg-brand-600 text-white font-black rounded-2xl hover:bg-brand-500 shadow-xl shadow-brand-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              الذهاب إلى لوحة التحكم
              <ArrowLeft className="w-4 h-4" />
            </button>
            {selectedPlan?.price > 0 && (
              <p className="text-[10px] text-slate-400 font-medium">
                * يتم تفعيل الباقات المدفوعة عادةً في أقل من ساعتين عمل.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3 sm:mb-4">
          اختر الخطة المناسبة لشركتك
        </h1>
        <p className="text-base sm:text-lg text-slate-500">
          خطط مرنة تناسب جميع أحجام المطاعم والمقاهي. ادفع محلياً بكل سهولة.
        </p>
      </div>

      {!selectedPlan ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 max-w-5xl mx-auto">
          {plans.map((plan: any, idx: number) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group flex flex-col"
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-brand-400 to-brand-600"></div>
              )}
              {plan.recommended && (
                <div className="absolute top-3 left-3 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  الأكثر طلباً
                </div>
              )}
              {subscription?.plan_id === plan.id && (
                <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200">
                  باقتك الحالية
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  ₪{plan.price}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  /شهرياً
                </span>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {(plan.features || []).map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (plan.price === 0) {
                    setSelectedPlan(plan);
                    handleSubmit(plan);
                  } else {
                    setSelectedPlan(plan);
                  }
                }}
                disabled={submitting || subscription?.plan_id === plan.id}
                className={`w-full py-3.5 rounded-xl font-bold transition-colors ${
                  subscription?.plan_id === plan.id
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed"
                    : plan.recommended
                    ? "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200"
                    : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                }`}
              >
                {submitting && selectedPlan?.id === plan.id ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : subscription?.plan_id === plan.id ? (
                  "أنت مشترك في هذه الباقة"
                ) : plan.price === 0 ? (
                  "تفعيل الباقة المجانية"
                ) : (
                  "اختر هذه الخطة"
                )}
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto bg-white rounded-2xl sm:rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Payment Details Side */}
            <div className="p-5 sm:p-8 lg:p-10 bg-slate-50">
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-sm font-bold text-brand-600 hover:text-brand-700 mb-8 inline-block"
              >
                &rarr; العودة للخطط
              </button>

              <h2 className="text-2xl font-black text-slate-900 mb-2">
                الدفع وتأكيد الاشتراك
              </h2>
              <p className="text-slate-500 mb-8">
                أنت تقوم بالاشتراك في <strong>{selectedPlan.name}</strong> بقيمة{" "}
                <strong>₪{selectedPlan.price}</strong>.
              </p>

              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="h-5 w-5 text-brand-600" />
                    <h3 className="font-bold text-slate-900">
                      التحويل البنكي
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {settings?.bank_details ||
                      "لم يتم تحديد تفاصيل البنك بعد. تواصل مع الدعم للحصول على البيانات."}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-bold text-slate-900">
                        الدفع عبر المحفظة
                      </h3>
                    </div>
                  </div>
                  {settings?.wallet_qr_url ? (
                    <div className="flex justify-center relative w-40 h-40 sm:w-48 sm:h-48 mx-auto">
                      <Image
                        src={settings.wallet_qr_url}
                        alt="Wallet QR"
                        fill
                        className="object-contain rounded-xl border border-slate-100"
                        sizes="200px"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center">
                      لم يتم توفير رمز QR للمحفظة.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Side */}
            <div className="p-5 sm:p-8 lg:p-10 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                رفع إيصال الدفع
              </h3>

              {!receiptUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    uploading
                      ? "border-brand-300 bg-brand-50"
                      : "border-slate-300 hover:border-brand-500 hover:bg-slate-50"
                  }`}
                >
                  {uploading ? (
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-brand-600 animate-spin mb-4" />
                  ) : (
                    <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 mb-4" />
                  )}
                  <h4 className="font-bold text-slate-900 mb-1">
                    {uploading
                      ? "جاري الرفع..."
                      : "اضغط لرفع صورة الإيصال"}
                  </h4>
                  <p className="text-xs text-slate-500">
                    JPG, PNG أقصى حجم 5MB
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-40 sm:h-48 bg-slate-50">
                    <img
                      src={receiptUrl}
                      alt="Receipt"
                      className="w-full h-full object-contain p-2"
                    />
                    <button
                      onClick={() => {
                        setReceiptUrl("");
                        setReceiptPath("");
                      }}
                      className="absolute top-2 left-2 bg-white/90 text-red-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-50"
                    >
                      تغيير
                    </button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3.5 sm:py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all flex justify-center items-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    تأكيد وإرسال الطلب
                  </button>
                </div>
              )}

              {!profile && (
                <div className="mt-6 p-4 bg-amber-50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">
                    يجب عليك تسجيل الدخول بحساب "صاحب عمل" لكي تتمكن من إرسال
                    طلب الاشتراك.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
