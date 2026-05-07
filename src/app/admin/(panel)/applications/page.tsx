"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search, Loader2 } from "lucide-react";

export default function ApplicationsManagement() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">طلبات التوظيف</h2>
          <p className="text-slate-500">إدارة جميع طلبات التقديم على الوظائف</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث بالمتقدم أو الوظيفة..."
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
        <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">قريباً — إدارة طلبات التوظيف</p>
        <p className="text-xs text-slate-400 mt-1">جاري تطوير هذه الصفحة</p>
      </div>
    </div>
  );
}
