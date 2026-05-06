"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Clock, Users, CheckCircle, PlusCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getEmployerJobs } from '@/app/actions/jobs';
import { getApplications } from '@/app/actions/applications';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEmployer = profile?.role === 'employer';

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      if (isEmployer) {
        const [jobsResult, appsResult] = await Promise.all([
          getEmployerJobs(),
          getApplications(),
        ]);

        if (jobsResult.success) setJobs(jobsResult.data);
        if (appsResult.success) setApplications(appsResult.data);
      } else {
        const result = await getApplications();
        if (result.success) setApplications(result.data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const pendingApps = applications.filter((a) => a.status === 'قيد المراجعة').length;
  const acceptedApps = applications.filter((a) => a.status === 'مقبول').length;

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">يجب تسجيل الدخول</h2>
        <Link href="/auth/login" className="text-brand-600 font-bold hover:underline">تسجيل الدخول</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">لوحة التحكم</h1>
          <p className="text-slate-500">مرحباً {profile?.full_name || 'User'}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
          {isEmployer && (
            <Link href="/post-job" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <PlusCircle className="w-5 h-5" /> نشر وظيفة جديدة
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {isEmployer && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col items-center">
            <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600 mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{jobs.length}</div>
            <div className="text-xs sm:text-sm text-slate-500">وظائفي</div>
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col items-center">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mb-2" />
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{applications.length}</div>
          <div className="text-xs sm:text-sm text-slate-500">إجمالي الطلبات</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col items-center">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mb-2" />
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{pendingApps}</div>
          <div className="text-xs sm:text-sm text-slate-500">قيد المراجعة</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 flex flex-col items-center">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-brand-600 mb-2" />
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{acceptedApps}</div>
          <div className="text-xs sm:text-sm text-slate-500">مقبولون</div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          جاري التحميل...
        </div>
      ) : isEmployer ? (
        <EmployerDashboard jobs={jobs} applications={applications} />
      ) : (
        <SeekerDashboard applications={applications} />
      )}
    </div>
  );
}

function EmployerDashboard({ jobs, applications }: { jobs: any[]; applications: any[] }) {
  return (
    <div className="space-y-8">
      {/* My Jobs */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">وظائفي المنشورة</h2>
        {jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 flex flex-col items-center justify-center text-slate-400">
            <Briefcase className="w-12 h-12 mb-4 opacity-50" />
            <p className="mb-4">لم تنشر أي وظائف بعد</p>
            <Link href="/post-job" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
              نشر أول وظيفة
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">الوظيفة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">الحالة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">الموقع</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <p className="font-bold text-slate-900 text-sm sm:text-base">{job.title}</p>
                        <p className="text-xs text-slate-500">{job.company_name}</p>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold ${
                          job.status === 'approved' ? 'bg-green-50 text-green-700' :
                          job.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {job.status === 'approved' ? 'معتمدة' : job.status === 'pending' ? 'قيد المراجعة' : job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-slate-600">{job.location}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-slate-500">
                        {new Date(job.created_at).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Applications */}
      {applications.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">طلبات التقديم</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">الوظيفة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">المتقدم</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">الحالة</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-medium text-slate-900">{app.jobs?.title}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-slate-600">{app.profiles?.full_name || 'مستخدم'}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold ${
                          app.status === 'مقبول' ? 'bg-green-50 text-green-700' :
                          app.status === 'مرفوض' ? 'bg-red-50 text-red-700' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-slate-500">
                        {new Date(app.created_at).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeekerDashboard({ applications }: { applications: any[] }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-4">طلباتي</h2>
      {applications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 flex flex-col items-center justify-center text-slate-400">
          <Briefcase className="w-12 h-12 mb-4 opacity-50" />
          <p className="mb-4">لم تقدم على أي وظائف بعد</p>
          <Link href="/jobs" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            تصفح الوظائف
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">الوظيفة</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">الشركة</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">الحالة</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-[11px] sm:text-xs font-bold text-slate-500">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm font-medium text-slate-900">{app.jobs?.title}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-slate-600">{app.jobs?.company_name}</td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-bold ${
                        app.status === 'مقبول' ? 'bg-green-50 text-green-700' :
                        app.status === 'مرفوض' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-slate-500">
                      {new Date(app.created_at).toLocaleDateString('ar-EG')}
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
