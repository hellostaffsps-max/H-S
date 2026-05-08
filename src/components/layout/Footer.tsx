"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-8 md:py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 lg:gap-10 mb-8 md:mb-12">
          
          {/* Brand & Description */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Hello Staff" width={36} height={36} />
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

          {/* Contact Info */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-1">
            <h3 className="text-white font-bold mb-3 md:mb-4 text-sm md:text-base">تواصل معنا</h3>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li>
                <a href="mailto:support@staffps.com" className="hover:text-brand-400 transition-colors flex items-center gap-2" dir="ltr">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  support@staffps.com
                </a>
              </li>
              <li>
                <a href="tel:+970569069686" className="hover:text-brand-400 transition-colors flex items-center gap-2" dir="ltr">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  +970 56 906 9686
                </a>
              </li>
              <li>
                <a href="https://wa.me/970569069686" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors flex items-center gap-2" dir="ltr">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  واتساب
                </a>
              </li>
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
