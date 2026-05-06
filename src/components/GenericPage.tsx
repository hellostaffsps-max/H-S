"use client";

export default function GenericPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
      <p className="text-gray-500 text-lg">هذه الصفحة قيد الإنشاء، يرجى المراجعة لاحقاً.</p>
    </div>
  );
}
