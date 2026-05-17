"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEmployerJobs, deleteJob, updateJobStatus } from "@/app/actions/jobs";
import Link from "next/link";
import { Briefcase, AlertCircle, Loader2, PlusCircle, Pencil, Trash2, CheckCircle, PauseCircle, PlayCircle, Eye, Archive } from "lucide-react";

export default function EmployerJobsPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile?.role === "employer") {
      fetchJobs();
    } else if (profile?.role === "seeker" || profile?.role === "admin") {
      window.location.href = "/dashboard";
    }
  }, [user, profile]);

  async function fetchJobs() {
    setLoading(true);
    const result = await getEmployerJobs();
    if (result.success) {
      setJobs(result.data || []);
    } else {
      setError(result.error || "فشل تحميل الوظائف");
    }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الوظيفة نهائياً؟")) return;
    setDeletingId(id);
    const result = await deleteJob(id);
    if (result.success) {
      setJobs(jobs.filter((j) => j.id !== id));
      setSuccess("تم حذف الوظيفة بنجاح");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "فشل حذف الوظيفة");
    }
    setDeletingId(null);
  }

  const handleStatusChange = async (id: string, currentStatus: string) => {
    let newStatus = currentStatus === 'approved' ? 'closed' : 'approved';
    const result = await updateJobStatus(id, newStatus);
    if (result.success) {
      setJobs(jobs.map((j) => (j.id === id ? { ...j, status: newStatus } : j)));
      setSuccess(`تم ${newStatus === 'approved' ? 'تفعيل' : 'إيقاف'} الوظيفة بنجاح`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "فشل تغيير حالة الوظيفة");
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">نشط</span>;
      case "pending":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">قيد المراجعة</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">مرفوض</span>;
      case "closed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">مغلق</span>;
      case "filled":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">تم التوظيف</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  if (!user || profile?.role !== "employer") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-brand-600" />
            إدارة الوظائف
          </h1>
          <p className="text-sm text-slate-500 mt-1">عرض وتعديل الوظائف التي قمت بنشرها</p>
        </div>
        <Link
          href="/post-job"
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-200"
        >
          <PlusCircle className="w-4 h-4" />
          نشر وظيفة جديدة
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-bold text-emerald-700">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[24px] p-12 text-center shadow-sm">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">لا توجد وظائف منشورة</h3>
          <p className="text-slate-500 mb-6">لم تقم بنشر أي وظيفة بعد. انطلق الآن وابحث عن أفضل المواهب!</p>
          <Link href="/post-job" className="inline-flex bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold transition-all">
            انشر وظيفتك الأولى
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 w-2/5">المسمى الوظيفي</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">الحالة</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500">تاريخ النشر</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link href={`/jobs/${job.id}`} className="text-sm font-bold text-slate-900 hover:text-brand-600 mb-1">
                          {job.title}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">{job.category}</span>
                          <span>•</span>
                          <span>{job.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700" dir="ltr">
                        {new Date(job.published_at || job.created_at).toLocaleDateString("ar-EG")}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="عرض الوظيفة"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {job.status !== "filled" && (
                          <Link
                            href={`/post-job?edit=${job.id}`}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="تعديل الوظيفة"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                        )}
                        {(job.status === "approved" || job.status === "closed") && (
                          <button
                            onClick={() => handleStatusChange(job.id, job.status)}
                            className={`p-2 rounded-lg transition-colors ${job.status === 'approved' ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            title={job.status === 'approved' ? 'إيقاف الوظيفة مؤقتاً' : 'تفعيل الوظيفة'}
                          >
                            {job.status === 'approved' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(job.id)}
                          disabled={deletingId === job.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="حذف نهائي"
                        >
                          {deletingId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
