export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-lg">جارٍ تحميل لوحة الإدارة...</p>
      </div>
    </div>
  );
}
