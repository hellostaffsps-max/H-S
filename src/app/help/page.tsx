"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  HelpCircle,
  ChevronDown,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  UserPlus,
  Briefcase,
  Search,
  ShieldCheck,
} from "lucide-react";

const faqs = [
  {
    q: "كيف يمكنني إنشاء حساب جديد؟",
    a: "اضغط على زر 'إنشاء حساب' في أعلى الصفحة، اختر نوع الحساب (باحث عن عمل / صاحب عمل)، وأكمل البيانات المطلوبة. التسجيل مجاني بالكامل.",
  },
  {
    q: "هل نشر الوظائف مجاني؟",
    a: "نعم، يمكنك نشر وظيفة واحدة مجاناً. للوصول لمزايا إضافية مثل الوظائف غير المحدودة والظهور المميز، يمكنك الاشتراك في إحدى باقاتنا.",
  },
  {
    q: "كيف أتقدم لوظيفة؟",
    a: "ابحث عن الوظيفة المناسبة، اضغط على 'التفاصيل'، ثم 'قدم الآن'. تأكد من أن ملفك الشخصي مكتمل لزيادة فرص قبولك.",
  },
  {
    q: "ما هي أنواع الوظائف المتاحة؟",
    a: "نغطي جميع تخصصات الضيافة: طهاة، نادلين، باريستا، كاشير، مديري مطاعم، موصلين، مضيفين، وأدوار أخرى.",
  },
  {
    q: "كيف أتواصل مع صاحب العمل؟",
    a: "بعد التقدم على الوظيفة، يمكنك التواصل عبر رقم الواتساب المرفق في إعلان الوظيفة، أو عبر نظام الرسائل داخل المنصة.",
  },
  {
    q: "هل بياناتي الشخصية آمنة؟",
    a: "نعم، نستخدم أحدث تقنيات الأمان وحماية البيانات. معلوماتك مشفرة ولا نشاركها مع أي طرف ثالث دون إذنك.",
  },
  {
    q: "كيف أحصل على إشعارات بالوظائف الجديدة؟",
    a: "فعّل تنبيهات الوظائف من إعدادات حسابك، وستصلك إشعارات فورية بالوظائف المطابقة لتخصصك وموقعك.",
  },
  {
    q: "ما هي شروط نشر وظيفة؟",
    a: "يجب أن يكون الحساب مرتبط بصاحب عمل، وأن تكون تفاصيل الوظيفة دقيقة وواضحة. نحتفظ بحق رفض أي إعلان لا يتوافق مع معايير الجودة.",
  },
];

const guides = [
  {
    icon: UserPlus,
    title: "إنشاء حساب",
    desc: "خطوات بسيطة للتسجيل وإعداد ملفك الشخصي",
  },
  {
    icon: FileText,
    title: "بناء السيرة الذاتية",
    desc: "نصائح لإنشاء CV احترافي يجذب أصحاب العمل",
  },
  {
    icon: Briefcase,
    title: "نشر وظيفة",
    desc: "كيفية كتابة إعلان وظيفي فعال يجذب المرشحين",
  },
  {
    icon: Search,
    title: "البحث المتقدم",
    desc: "استخدم الفلاتر للعثور على الوظيفة المثالية",
  },
  {
    icon: ShieldCheck,
    title: "الأمان والخصوصية",
    desc: "كيف نحمي بياناتك ونضمن تجربة آمنة",
  },
  {
    icon: MessageCircle,
    title: "نظام التواصل",
    desc: "التعرف على كيفية التواصل مع المرشحين وأصحاب العمل",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-right min-h-[52px] hover:bg-slate-50 transition-colors"
      >
        <span className="font-bold text-slate-900 text-sm sm:text-base">{q}</span>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 shrink-0 mr-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-4 sm:px-5 pb-4 sm:pb-5 text-slate-600 leading-relaxed text-sm sm:text-base"
        >
          {a}
        </motion.div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div className="flex flex-col" dir="rtl">
      {/* Hero */}
      <section className="bg-brand-600 text-white py-12 sm:py-16 lg:py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <HelpCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 opacity-80" />
          <h1 className="text-3xl sm:text-4xl font-black mb-3 sm:mb-4">مركز المساعدة</h1>
          <p className="text-brand-50 text-base sm:text-lg">
            كل ما تحتاج لمعرفته عن استخدام Hello Staff بفعالية
          </p>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="max-w-6xl mx-auto w-full px-4 py-10 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-6 sm:mb-10">أدلة الاستخدام</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {guides.map((guide, i) => (
            <motion.div
              key={guide.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 hover:border-brand-200 hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-4">
                <guide.icon className="h-5 w-5 text-brand-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{guide.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{guide.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto w-full px-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-6 sm:mb-10">
            الأسئلة الشائعة
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-4xl mx-auto w-full px-4 py-10 sm:py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 sm:mb-4">لم تجد ما تبحث عنه؟</h2>
        <p className="text-slate-500 mb-8">فريق الدعم جاهز لمساعدتك في أي وقت</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:support@staffps.com"
            className="flex items-center gap-2 bg-brand-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
          >
            <Mail className="h-5 w-5" />
            support@staffps.com
          </a>
          <a
            href="https://wa.me/970569069686"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold hover:bg-green-100 transition-colors"
          >
            <Phone className="h-5 w-5" />
            تواصل عبر واتساب
          </a>
          <a
            href="tel:+970569069686"
            className="flex items-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-bold hover:bg-slate-100 transition-colors"
          >
            <Phone className="h-5 w-5" />
            +970 56 906 9686
          </a>
        </div>
      </section>
    </div>
  );
}
