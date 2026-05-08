"use client";
import Image from "next/image";
import { Database, ExternalLink } from "lucide-react";

export default function SetupSupabase() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 lg:p-12">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="Hello Staff" width={64} height={64} />
        </div>
        
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-4">
          إعداد قاعدة البيانات (Supabase)
        </h1>
        
        <p className="text-center text-slate-600 mb-8 text-lg">
          التطبيق يحتاج إلى الاتصال بقاعدة بيانات Supabase ليعمل بشكل صحيح. يرجى اتباع الخطوات التالية لإعداد بيئة العمل.
        </p>

        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span className="bg-brand-100 text-brand-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              إنشاء مشروع على Supabase
            </h3>
            <p className="text-slate-600 mb-3">
              قم بزيارة Supabase وأنشئ مشروعاً جديداً ومجاناً.
            </p>
            <a 
              href="https://database.new" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium"
            >
              افتح Supabase <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span className="bg-brand-100 text-brand-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              تنفيذ كود SQL
            </h3>
            <p className="text-slate-600 mb-3">
              اذهب إلى SQL Editor في مشروعك ونفذ الأوامر الموجودة في ملف <code className="bg-white px-1.5 py-0.5 rounded text-brand-600 border border-slate-200">supabase/schema.sql</code>. أو انسخ ولصق الكود لتجهيز الجداول والصلاحيات اللازمة.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <span className="bg-brand-100 text-brand-700 w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
              إضافة مفاتيح الربط Variables
            </h3>
            <p className="text-slate-600 mb-3">
              عد إلى استوديو الذكاء الاصطناعي، وافتح لوحة الإعدادات (Settings &gt; Secrets) وأضف المتغيرات التالية:
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-1 font-mono text-sm bg-white p-4 rounded-lg border border-slate-200">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          * بمجرد إضافتك للمتغيرات، قم بإعادة تحميل الصفحة ليظهر التطبيق بشكله الكامل.
        </div>
      </div>
    </div>
  );
}
