"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { 
  Search, 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Trash2
} from 'lucide-react';

export default function JobsManagement() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">إدارة الوظائف</h2>
          <p className="text-slate-500">مراقبة وحذف الوظائف المنشورة على المنصة</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث مسمى الوظيفة أو الشركة..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-100">جاري التحميل...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 rounded-3xl border border-slate-100">لا توجد وظائف منشورة حالياً</div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                <Building2 className="h-8 w-8" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-slate-900 truncate">{job.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    job.status === 'approved' ? 'bg-green-50 text-green-700' : 
                    job.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                    job.status === 'rejected' ? 'bg-red-50 text-red-700' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {job.status === 'approved' ? 'معتمدة' : 
                     job.status === 'pending' ? 'قيد المراجعة' :
                     job.status === 'rejected' ? 'مرفوضة' : 'مغلقة'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company_name}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location || 'عن بعد'}</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> {job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max}` : 'غير محدد'}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {new Date(job.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
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
                
                <button 
                  onClick={() => handleDeleteJob(job.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all" 
                  title="حذف"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
