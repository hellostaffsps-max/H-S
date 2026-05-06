"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Briefcase, UsersRound, Clock, Map } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getJobs } from '@/app/actions/jobs';

function JobsContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('cat') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');

  useEffect(() => {
    fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const result = await getJobs({
      search: searchTerm || undefined,
      category: category || undefined,
      type: type || undefined,
      location: location || undefined,
    });
    if (result.success) {
      setJobs(result.data);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchJobs();
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 tracking-tight">الوظائف المتاحة</h1>
        <p className="text-sm text-slate-500">اعثر على فرصتك في قطاع الضيافة</p>
      </div>

      {/* Search Filters */}
      <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-2xl p-1.5 flex flex-col md:flex-row gap-1.5 shadow-sm">
        <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-xl relative">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="ابحث عن وظيفة أو مطعم..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 px-3 py-3 sm:py-2.5 text-base sm:text-sm outline-none"
          />
        </div>
        <div className="grid grid-cols-2 md:flex md:w-auto gap-1.5">
          <div className="w-full md:w-40 bg-slate-50 md:border-r border-slate-200 rounded-xl relative">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-700 text-base sm:text-sm py-3 sm:py-2.5 px-3 appearance-none outline-none"
            >
              <option value="">جميع التخصصات</option>
              <option value="طاهي/ة">طاهي/ة</option>
              <option value="نادل/ة">نادل/ة</option>
              <option value="باريستا">باريستا</option>
              <option value="كاشير">كاشير</option>
              <option value="مدير">مدير</option>
              <option value="توصيل">توصيل</option>
              <option value="مضيف/ة">مضيف/ة</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <div className="w-full md:w-40 bg-slate-50 md:border-r border-slate-200 rounded-xl relative">
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-full bg-transparent border-none focus:ring-0 text-slate-700 text-base sm:text-sm py-3 sm:py-2.5 px-3 appearance-none outline-none"
            >
              <option value="">جميع الأنواع</option>
              <option value="دوام كامل">دوام كامل</option>
              <option value="دوام جزئي">دوام جزئي</option>
            </select>
          </div>
          <div className="w-full md:w-40 bg-slate-50 md:border-r border-slate-200 rounded-xl relative flex items-center px-3">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
            <input 
              type="text" 
              placeholder="المدينة..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 text-base sm:text-sm outline-none"
            />
          </div>
          <button type="submit" className="block col-span-2 md:col-auto md:w-auto bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 sm:py-2.5 rounded-xl text-base sm:text-sm font-medium transition-colors w-full shadow-sm">
             بحث
          </button>
        </div>
      </form>

      {/* View Toggle */}
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs font-semibold text-slate-500">{jobs.length} وظيفة متاحة</div>
        <div className="bg-white border border-slate-200 rounded-xl flex overflow-hidden shadow-sm">
          <button 
            onClick={() => setViewMode('list')}
            className={cn("px-4 py-1.5 flex items-center gap-1.5 text-xs font-semibold transition-colors", viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50')}
          >
            <Briefcase className="w-3.5 h-3.5" /> قائمة
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={cn("px-4 py-1.5 flex items-center gap-1.5 text-xs font-semibold transition-colors", viewMode === 'map' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-slate-50')}
          >
            <Map className="w-3.5 h-3.5" /> خريطة
          </button>
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 h-56 sm:h-64 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-slate-100 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-8"></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-brand-200 hover:shadow-md transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide",
                  job.type === 'دوام كامل' ? "bg-brand-50 text-brand-700" : "bg-blue-50 text-blue-700"
                )}>
                  {job.type}
                </span>
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg ml-1 shadow-sm">
                  {(job.company_name || '؟')[0]}
                </div>
              </div>
              
              <div className="mb-4 text-left flex-grow" dir="rtl">
                <h3 className="text-lg font-bold text-slate-900 mb-0.5 line-clamp-1">{job.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-1">{job.company_name}</p>
                
                <div className="mt-3.5 flex flex-col gap-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" /> <span className="truncate">{job.category} · {job.salary_min && job.salary_max ? `${job.currency} ${job.salary_min}-${job.salary_max}` : 'غير محدد'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-50 flex items-center justify-between w-full mt-auto">
                <Link href={`/jobs/${job.id}`} className="bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200">
                  التفاصيل
                </Link>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(job.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">لا توجد وظائف مطابقة لبحثك</p>
          <p className="text-sm mt-1">جرب تغيير كلمات البحث أو الفلاتر</p>
        </div>
      )}
    </div>
  );
}

export default function Jobs() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto w-full px-4 py-16 text-center">
        <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <JobsContent />
    </Suspense>
  );
}
