"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { 
  Search, 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Trash2,
  RefreshCw,
  Timer,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function JobsManagement() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch('/api/admin/jobs');
      const json = await res.json();
      if (json.success && json.data) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteJob(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الوظيفة؟')) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setJobs(jobs.filter(j => j.id !== id));
      } else {
        alert(json.error || 'فشل الحذف');
      }
    } catch {
      alert('حدث خطأ أثناء الحذف');
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        setJobs(jobs.map(j => j.id === id ? { ...j, status: json.data.status } : j));
      } else {
        alert(json.error || 'فشل التحديث');
      }
    } catch {
      alert('حدث خطأ أثناء التحديث');
    }
  }

  async function handleRenewJob(id: string) {
    setRenewingId(id);
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'approved',
          renew: true 
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchJobs();
      } else {
        alert(json.error || 'فشل التجديد');
      }
    } catch {
      alert('حدث خطأ أثناء التجديد');
    } finally {
      setRenewingId(null);
    }
  }

  function getDaysLeft(expiresAt: string | null): number | null {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getExpiryBadge(job: any) {
    if (job.status === 'expired') {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100"><Timer className="h-3 w-3" />منتهية الصلاحية</span>;
    }
    const daysLeft = getDaysLeft(job.expires_at);
    if (daysLeft === null) return null;
    if (daysLeft <= 0) {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100"><Timer className="h-3 w-3" />منتهية</span>;
    }
    if (daysLeft <= 5) {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100"><AlertTriangle className="h-3 w-3" />تنتهي خلال {daysLeft} أيام</span>;
    }
    return <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3" />متبقي {daysLeft} يوم</span>;
  }

  const filteredJobs = jobs.filter(job => {
    const matchSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchSearch;
    if (statusFilter === 'expired') {
      return matchSearch && (job.status === 'expired' || (job.expires_at && new Date(job.expires_at) < new Date()));
    }
    return matchSearch && job.status === statusFilter;
  });

  const expiredCount = jobs.filter(j => j.status === 'expired' || (j.expires_at && new Date(j.expires_at) < new Date() && j.status === 'approved')).length;
  const approvedCount = jobs.filter(j => j.status === 'approved' && (!j.expires_at || new Date(j.expires_at) >= new Date())).length;
  const pendingCount = jobs.filter(j => j.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">إدارة الوظائف</h2>
          <p className="text-slate-500">مراقبة الوظائف المنشورة — تنتهي صلاحية كل وظيفة بعد 30 يوماً من نشرها</p>
        </div>
        <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
          <RefreshCw className="h-4 w-4" /> تحديث
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button onClick={() => setStatusFilter('all')} className={`p-4 rounded-2xl border text-right transition-all ${statusFilter === 'all' ? 'bg-brand-50 border-brand-200 ring-2 ring-brand-500/20' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
          <p className="text-2xl font-black text-slate-900">{jobs.length}</p>
          <p className="text-xs text-slate-500 font-medium">إجمالي الوظائف</p>
        </button>
        <button onClick={() => setStatusFilter('approved')} className={`p-4 rounded-2xl border text-right transition-all ${statusFilter === 'approved' ? 'bg-green-50 border-green-200 ring-2 ring-green-500/20' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
          <p className="text-2xl font-black text-green-600">{approvedCount}</p>
          <p className="text-xs text-slate-500 font-medium">نشطة</p>
        </button>
        <button onClick={() => setStatusFilter('pending')} className={`p-4 rounded-2xl border text-right transition-all ${statusFilter === 'pending' ? 'bg-yellow-50 border-yellow-200 ring-2 ring-yellow-500/20' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
          <p className="text-2xl font-black text-yellow-600">{pendingCount}</p>
          <p className="text-xs text-slate-500 font-medium">قيد المراجعة</p>
        </button>
        <button onClick={() => setStatusFilter('expired')} className={`p-4 rounded-2xl border text-right transition-all ${statusFilter === 'expired' ? 'bg-red-50 border-red-200 ring-2 ring-red-500/20' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
          <p className="text-2xl font-black text-red-600">{expiredCount}</p>
          <p className="text-xs text-slate-500 font-medium">منتهية الصلاحية</p>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث بمسمى الوظيفة أو الشركة..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-100">
            <Briefcase className="h-10 w-10 mx-auto mb-3 text-slate-200" />
            <p>لا توجد وظائف {statusFilter !== 'all' ? 'بهذا الفلتر' : 'منشورة حالياً'}</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isExpired = job.status === 'expired' || (job.expires_at && new Date(job.expires_at) < new Date());

            return (
              <div key={job.id} className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 ${isExpired ? 'border-red-100 bg-red-50/20' : 'border-slate-100'}`}>
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${isExpired ? 'bg-red-50 text-red-300' : 'bg-slate-50 text-slate-400'}`}>
                  <Building2 className="h-8 w-8" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className={`text-lg font-black truncate ${isExpired ? 'text-slate-500' : 'text-slate-900'}`}>{job.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      job.status === 'approved' && !isExpired ? 'bg-green-50 text-green-700' : 
                      job.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      job.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {job.status === 'approved' && !isExpired ? 'معتمدة' : 
                       job.status === 'pending' ? 'قيد المراجعة' :
                       job.status === 'rejected' ? 'مرفوضة' :
                       job.status === 'expired' || isExpired ? 'منتهية' : 'مغلقة'}
                    </span>
                    {getExpiryBadge(job)}
                  </div>
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company_name}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location || 'عن بعد'}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> {job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max}` : 'غير محدد'}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(job.created_at).toLocaleDateString('ar-EG')}</span>
                    {job.expires_at && (
                      <span className="flex items-center gap-1 text-xs"><Timer className="h-3.5 w-3.5" /> ينتهي: {new Date(job.expires_at).toLocaleDateString('ar-EG')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 flex-wrap">
                  <Link 
                    href={`/jobs/${job.id}`}
                    target="_blank"
                    className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    معاينة
                  </Link>
                  
                  {job.status === 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(job.id, 'approved')}
                      className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all" 
                      title="اعتماد"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  )}

                  {/* Renew Button */}
                  {isExpired && (
                    <button 
                      onClick={() => handleRenewJob(job.id)}
                      disabled={renewingId === job.id}
                      className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-100 transition-all flex items-center gap-2 border border-brand-200 disabled:opacity-50" 
                      title="تجديد لـ 30 يوم"
                    >
                      {renewingId === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      تجديد
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all" 
                    title="حذف"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
