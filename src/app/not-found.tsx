import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-emerald-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">الصفحة غير موجودة</h1>
        <p className="text-gray-500 mb-6">
          عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            الصفحة الرئيسية
          </Link>
          <Link
            href="/jobs"
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            تصفح الوظائف
          </Link>
        </div>
      </div>
    </div>
  );
}
