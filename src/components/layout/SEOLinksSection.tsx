import Link from 'next/link';
import { BookOpen, HelpCircle, Briefcase, ArrowLeft } from 'lucide-react';

const blogLinks = [
  { href: '/blog', label: 'كيف تكتب سيرة ذاتية احترافية في قطاع الضيافة؟', tag: 'نصائح' },
  { href: '/blog', label: 'أفضل المهارات المطلوبة في مجال المطاعم والفنادق', tag: 'مهارات' },
  { href: '/blog', label: 'كيف تتفوق في مقابلة العمل مع أصحاب العمل؟', tag: 'مقابلات' },
  { href: '/blog', label: 'دليل التوظيف الشامل في قطاع الضيافة بالشرق الأوسط', tag: 'دليل' },
];

const faqItems = [
  { q: 'كيف أسجل في منصة Hello Staff؟', href: '/help' },
  { q: 'هل التسجيل مجاني للباحثين عن عمل؟', href: '/help' },
  { q: 'كيف أنشر وظيفة كصاحب عمل؟', href: '/pricing' },
  { q: 'كيف أفعّل تنبيهات الوظائف الجديدة؟', href: '/job-alerts' },
  { q: 'ما هي التخصصات الوظيفية المتاحة على المنصة؟', href: '/jobs' },
  { q: 'كيف أتواصل مع صاحب العمل بعد التقديم؟', href: '/help' },
];

const jobCategories = [
  { label: 'وظائف الطهاة والطبخ', href: '/jobs?category=cooking' },
  { label: 'وظائف خدمة العملاء', href: '/jobs?category=customer-service' },
  { label: 'وظائف الاستقبال والفندقة', href: '/jobs?category=reception' },
  { label: 'وظائف إدارة المطاعم', href: '/jobs?category=management' },
  { label: 'وظائف الحلويات والمخبوزات', href: '/jobs?category=pastry' },
  { label: 'وظائف بارتيندر وبار', href: '/jobs?category=bartender' },
];

export default function SEOLinksSection() {
  return (
    <section
      aria-label="مركز المعرفة والروابط المفيدة"
      className="bg-slate-50 border-t border-slate-200 py-10 md:py-14"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* ── Blog Articles ── */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-brand-600" />
              </span>
              <h2 className="text-base font-bold text-slate-800">مقالات المدونة</h2>
            </div>
            <ul className="space-y-3" role="list">
              {blogLinks.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="group flex items-start gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    <span className="leading-snug">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 mt-5 text-xs font-bold text-brand-600 hover:underline"
            >
              عرض جميع المقالات
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>

          {/* ── FAQ ── */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-amber-600" />
              </span>
              <h2 className="text-base font-bold text-slate-800">أسئلة شائعة</h2>
            </div>
            <ul className="space-y-3" role="list">
              {faqItems.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="group flex items-start gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    <span className="leading-snug">{item.q}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/help"
              className="inline-flex items-center gap-1 mt-5 text-xs font-bold text-brand-600 hover:underline"
            >
              مركز المساعدة الكامل
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>

          {/* ── Job Categories ── */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-green-600" />
              </span>
              <h2 className="text-base font-bold text-slate-800">تصفح حسب التخصص</h2>
            </div>
            <ul className="space-y-3" role="list">
              {jobCategories.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="group flex items-start gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400 group-hover:text-brand-500 transition-colors" />
                    <span className="leading-snug">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1 mt-5 text-xs font-bold text-brand-600 hover:underline"
            >
              عرض جميع الوظائف
              <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
