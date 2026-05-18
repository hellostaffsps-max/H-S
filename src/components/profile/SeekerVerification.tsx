"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, CheckCircle2, ShieldCheck, Download, Banknote, Wallet, Building2, Smartphone, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { validateReceiptFile } from "@/lib/file-security";
import { useToast } from "@/hooks/useToast";

export default function SeekerVerification({ seekerData }: { seekerData: any }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPendingSubscription, setHasPendingSubscription] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch seeker plans
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("target_role", "seeker")
        .eq("is_active", true)
        .order("price");

      setPlans(plansData || []);

      // Fetch payment details
      const { data: settingsData } = await supabase
        .from("platform_settings")
        .select("bank_details, wallet_qr_url")
        .single();
      
      setSettings(settingsData);

      // Check for pending subscriptions
      const { data: subData } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (subData) {
        setHasPendingSubscription(true);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    if (!selectedPlan || !file || !user) return;

    // ── Security: re-validate before upload ──
    const validation = validateReceiptFile(file);
    if (!validation.valid) {
      setFileError(validation.error ?? 'ملف غير صالح.');
      return;
    }
    
    setUploading(true);
    try {
      // Upload receipt
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from('payment_receipts')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      // Create subscription request
      await supabase.from("user_subscriptions").insert({
        user_id: user.id,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        status: "pending",
        payment_receipt_url: signedData?.signedUrl || filePath,
      });

      setHasPendingSubscription(true);
      setSelectedPlan(null);
      setFile(null);
    } catch (err) {
      console.error("Error submitting subscription:", err);
      showToast("حدث خطأ أثناء تقديم الطلب. يرجى المحاولة مرة أخرى.", "error");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }

  // Already verified
  if (seekerData?.verification_status === "verified") {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        <ShieldCheck className="h-12 w-12 text-emerald-500 mb-4" />
        <h3 className="text-xl font-black text-emerald-900 mb-2">حسابك موثق ومميز</h3>
        <p className="text-emerald-700 text-sm max-w-md">
          أنت الآن تستمتع بجميع مميزات الحساب الموثق: الأكاديمية، بناء الـ CV، مراسلة الشركات، وغيرها.
        </p>
      </div>
    );
  }

  // Has pending request
  if (hasPendingSubscription) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center">
        <Loader2 className="h-10 w-10 text-amber-500 mb-4 animate-spin" />
        <h3 className="text-lg font-black text-amber-900 mb-2">طلبك قيد المراجعة</h3>
        <p className="text-amber-700 text-sm max-w-md">
          لقد استلمنا إيصال الدفع الخاص بك. فريقنا يقوم بمراجعته الآن وسيتم تفعيل حسابك كـ "موثق" قريباً.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div 
        className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 justify-between cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 text-right">
          <h2 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-brand-500" />
            وثق حسابك الآن
          </h2>
          <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
            احصل على شارة التوثيق، وكن في صدارة الباحثين عن عمل. تمتع بالوصول إلى <span className="font-bold text-slate-700">الأكاديمية</span> (كورسات ووصفات)، إنشاء الـ CV مجاناً، ومراسلة أصحاب العمل مباشرة.
          </p>
        </div>
        <div className="shrink-0">
          <button className={`w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all ${isExpanded ? 'rotate-180 bg-brand-50 text-brand-600' : ''}`}>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-8 mt-2 border-t border-slate-100">
              {!selectedPlan ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className="border-2 border-slate-100 rounded-2xl p-6 hover:border-brand-500 hover:shadow-md cursor-pointer transition-all bg-slate-50 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                      <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">{plan.name}</h3>
                      <div className="flex items-end gap-1 mb-6 relative z-10">
                        <span className="text-3xl font-black text-brand-600">{plan.price}</span>
                        <span className="text-slate-500 mb-1">شيكل</span>
                      </div>
                      <ul className="space-y-3 mb-6 relative z-10">
                        {(plan.features || []).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors relative z-10">
                        اختيار الباقة
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900">الباقة المختارة: {selectedPlan.name}</h3>
                      <p className="text-sm text-slate-500">المبلغ المطلوب: {selectedPlan.price} شيكل</p>
                    </div>
                    <button onClick={() => setSelectedPlan(null)} className="text-sm text-brand-600 hover:underline font-medium">
                      تغيير الباقة
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        طرق الدفع المتاحة
                      </h4>
                      
                      {settings?.bank_details && (
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                          <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-500" /> تحويل بنكي
                          </h5>
                          <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                            {settings.bank_details}
                          </pre>
                        </div>
                      )}

                      {settings?.wallet_qr_url && (
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                          <h5 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-slate-500" /> محفظة إلكترونية
                          </h5>
                          <div className="max-w-[200px] mx-auto bg-white p-2 rounded-xl shadow-sm">
                            <img src={settings.wallet_qr_url} alt="QR Code" className="w-full h-auto rounded-lg" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Upload className="h-5 w-5 text-brand-600" />
                        إرفاق إيصال الدفع
                      </h4>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 hover:border-brand-300 transition-all">
                        <input
                          type="file"
                          id="receipt-upload"
                          className="hidden"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(e) => {
                            const picked = e.target.files?.[0] || null;
                            if (picked) {
                              const result = validateReceiptFile(picked);
                              if (!result.valid) {
                                setFileError(result.error ?? 'ملف غير صالح.');
                                setFile(null);
                                e.target.value = '';
                                return;
                              }
                              setFileError(null);
                            }
                            setFile(picked);
                          }}
                        />
                        <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center">
                          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                            <Upload className="h-8 w-8 text-brand-600" />
                          </div>
                          <span className="font-bold text-slate-700 mb-1">
                            {file ? file.name : "اضغط لاختيار صورة الإيصال"}
                          </span>
                          <span className="text-xs text-slate-400">يدعم JPG, PNG, PDF</span>
                        </label>
                      </div>
                      {fileError && (
                        <p className="mt-2 text-xs text-red-600 font-bold text-center">{fileError}</p>
                      )}
                      <button
                        onClick={handleSubscribe}
                        disabled={!file || uploading}
                        className="w-full mt-6 bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                      >
                        {uploading ? (
                          <><Loader2 className="h-5 w-5 animate-spin" /> جاري الإرسال...</>
                        ) : (
                          <><CheckCircle2 className="h-5 w-5" /> إرسال طلب التوثيق</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
