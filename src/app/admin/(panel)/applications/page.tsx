"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ClipboardList, Search, Loader2, Calendar, Filter } from "lucide-react";
import Pagination from "@/components/Pagination";
import { supabase } from "@/lib/supabase";

interface Application {
  id: string;
  status: string;
  cover_letter: string | null;
  created_at: string;
  jobs: {
    title: string;
    company_name: string;
  } | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const statusStyles: Record<string, string> = {
  "قيد المراجعة": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "مراجعة": "bg-blue-50 text-blue-700 border-blue-200",
  "قائمة مختصرة": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "مقابلة": "bg-purple-50 text-purple-700 border-purple-200",
  "تجربة عمل": "bg-orange-50 text-orange-700 border-orange-200",
  "مقبول": "bg-green-50 text-green-700 border-green-200",
  "مرفوض": "bg-red-50 text-red-700 border-red-200",
};

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, cover_letter, created_at, jobs(title, company_name), profiles(full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      // Supabase may return joined data as arrays; normalize to single objects
      const normalized = (data || []).map((row: any) => ({
        ...row,
        jobs: Array.isArray(row.jobs) ? row.jobs[0] || null : row.jobs,
        profiles: Array.isArray(row.profiles) ? row.profiles[0] || null : row.profiles,
      }));
      setApplications(normalized);
    } catch (e: any) {
      console.error("Error fetching applications:", e.message);
    } finally {
      setLoading(false);
    }
  }

  const statuses = ["all", ...Object.keys(statusStyles)];

  const filtered = applications.filter((app) => {
    const matchSearch =
      app.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobs?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobs?.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || app.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">طلبات التوظيف</h2>
          <p className="text-slate-500">إدارة جميع طلبات التقديم على الوظائف</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100">
          <ClipboardList className="h-4 w-4 text-brand-600" />
          <span className="font-bold">{applications.length}</span> طلب توظيف
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="البحث بالمتقدم أو الوظيفة أو الشركة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 w-full md:w-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === s
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 bg-slate-50"
              }`}
            >
              {s === "all" ? "الكل" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">المتقدم</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الوظيفة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الشركة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">الحالة</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    {searchTerm || statusFilter !== "all" ? "لا توجد نتائج مطابقة" : "لا توجد طلبات توظيف بعد"}
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {app.profiles?.avatar_url ? (
                            <Image src={app.profiles.avatar_url} alt="" fill className="object-cover rounded-full" sizes="36px" />
                          ) : (
                            <span className="text-sm font-bold text-indigo-600">
                              {app.profiles?.full_name?.charAt(0) || "م"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900">{app.profiles?.full_name || "مستخدم"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                      {app.jobs?.title || "وظيفة محذوفة"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {app.jobs?.company_name || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyles[app.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(app.created_at).toLocaleDateString("ar-EG")}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
