"use client";
import Link from 'next/link';
import { ChefHat, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-8 md:py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12">
          
          {/* Brand & Description */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-brand-600 p-1.5 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-lg md:text-xl text-white">Hello <span className="text-xs md:text-sm font-normal text-slate-400">Staff</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
              المنصة المتخصصة الأولى لربط الكفاءات وأصحاب العمل في قطاع الضيافة والمطاعم بفعالية وسهولة، نوفر حلول توظيف ذكية تواكب تطلعاتك.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="min-w-[44px] min-h-[44px] w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="min-w-[44px] min-h-[44px] w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="min-w-[44px] min-h-[44px] w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="min-w-[44px] min-h-[44px] w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-600 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Group 1 */}
          <div>
            <h3 className="text-white font-bold mb-3 md:mb-4 text-sm md:text-base">الباحثين عن عمل</h3>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li><Link href="/jobs" className="hover:text-brand-400 transition-colors">تصفح الوظائف</Link></li>
              <li><Link href="/profile" className="hover:text-brand-400 transition-colors">أنشئ سيرتك الذاتية</Link></li>
              <li><Link href="/job-alerts" className="hover:text-brand-400 transition-colors">تنبيهات الوظائف</Link></li>
              <li><Link href="/interview-tips" className="hover:text-brand-400 transition-colors">نصائح المقابلات</Link></li>
            </ul>
          </div>

          {/* Links Group 2 */}
          <div>
            <h3 className="text-white font-bold mb-3 md:mb-4 text-sm md:text-base">أصحاب العمل</h3>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li><Link href="/post-job" className="hover:text-brand-400 transition-colors">انشر وظيفة</Link></li>
              <li><Link href="/search-resumes" className="hover:text-brand-400 transition-colors">ابحث في السير الذاتية</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-400 transition-colors">باقات الأسعار</Link></li>
              <li><Link href="/dashboard" className="hover:text-brand-400 transition-colors">لوحة التحكم</Link></li>
            </ul>
          </div>

          {/* Links Group 3 */}
          <div>
            <h3 className="text-white font-bold mb-3 md:mb-4 text-sm md:text-base">الشركة</h3>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li><Link href="/about" className="hover:text-brand-400 transition-colors">من نحن</Link></li>
              <li><Link href="/contact" className="hover:text-brand-400 transition-colors">اتصل بنا</Link></li>
              <li><Link href="/blog" className="hover:text-brand-400 transition-colors">المدونة</Link></li>
              <li><Link href="/help" className="hover:text-brand-400 transition-colors">مركز المساعدة</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-6 md:pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Hello Staff. جميع الحقوق محفوظة.</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <Link href="/terms" className="hover:text-white transition-colors">شروط الاستخدام</Link>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <Link href="/cookies" className="hover:text-white transition-colors">سياسة ملفات الارتباط</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
