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
              <a href="mailto:support@staffps.com" className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100 group-hover:bg-brand-50 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">البريد الإلكتروني</div>
                  <div className="text-slate-600 text-sm" dir="ltr">support@staffps.com</div>
                </div>
              </a>
              <a href="tel:+970569069686" className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100 group-hover:bg-brand-50 transition-colors">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">رقم الهاتف</div>
                  <div className="text-slate-600 text-sm" dir="ltr">+970 56 906 9686</div>
                </div>
              </a>
              <a href="https://wa.me/970569069686" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-600 shrink-0 shadow-sm border border-slate-100 group-hover:bg-green-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">واتساب</div>
                  <div className="text-slate-600 text-sm" dir="ltr">+970 56 906 9686</div>
                </div>
              </a>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-600 shrink-0 shadow-sm border border-slate-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 mb-1">العنوان</div>
                  <div className="text-slate-600 text-sm">فلسطين</div>
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
