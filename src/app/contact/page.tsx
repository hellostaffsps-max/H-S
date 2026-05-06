"use client";
import { useState } from "react";
import { ShieldCheck, Mail, MapPin, Phone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitContactForm } from "@/app/actions/contact";

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);

    if (result.success) {
      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } else {
      setError(result.error || "حدث خطأ");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">نحن هنا لمساعدتك</h1>
        <p className="text-lg text-slate-600">هل لديك استفسار أو مشكلة؟ تواصل مع فريق الدعم الفني لدينا وسنقوم بالرد عليك في أقرب وقت ممكن.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">أرسل رسالة</h2>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-700 text-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p>تم إرسال رسالتك بنجاح! سنقوم بالرد عليك في أقرب وقت.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم الكامل</label>
                <input name="name" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="اسمك الكريم" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">البريد الإلكتروني</label>
                <input name="email" type="email" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-left" dir="ltr" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">الموضوع</label>
              <input name="subject" type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="كيف يمكننا مساعدتك؟" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">الرسالة</label>
              <textarea name="message" required rows={5} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" placeholder="تفاصيل رسالتك..."></textarea>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              إرسال الرسالة
            </button>
          </form>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">معلومات التواصل</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">البريد الإلكتروني</div>
                  <div className="text-slate-600 text-sm" dir="ltr">support@hellostaff.ps</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">رقم الهاتف</div>
                  <div className="text-slate-600 text-sm" dir="ltr">+970 599 000 000</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">العنوان</div>
                  <div className="text-slate-600 text-sm">رام الله، الماصيون، عمارة الأمل</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-3xl border border-brand-100 bg-brand-50 flex gap-4">
            <ShieldCheck className="w-10 h-10 text-brand-600 shrink-0" />
            <div>
              <h4 className="font-bold text-brand-900 mb-1">دعم فني موثوق</h4>
              <p className="text-sm text-brand-700/80 leading-relaxed">فريقنا متواجد للرد على استفساراتكم خلال أوقات العمل الرسمية من الأحد للخميس (9AM - 5PM).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
