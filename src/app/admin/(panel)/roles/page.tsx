"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function RolesManagement() {
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
          <h2 className="text-2xl font-black text-slate-900">الصلاحيات والأدوار</h2>
          <p className="text-slate-500">إدارة أدوار المشرفين والصلاحيات</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
        <ShieldCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">قريباً — إدارة الأدوار والصلاحيات</p>
        <p className="text-xs text-slate-400 mt-1">جاري تطوير هذه الصفحة</p>
      </div>
    </div>
  );
}
