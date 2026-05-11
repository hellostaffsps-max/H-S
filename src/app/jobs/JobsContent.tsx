"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  ShieldCheck,
  SlidersHorizontal,
  X,
  Bell,
  Building2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getJobs } from "@/app/actions/jobs";
import { getSearchFilters } from "@/app/actions/search-filters";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { calculateProfileCompletion } from "@/lib/profile-utils";

interface JobsContentProps {
  initialSearch?: string;
  initialCategory?: string;
  initialType?: string;
  initialLocation?: string;
}

export default function JobsContent({
  initialSearch = "",
  initialCategory = "",
  initialType = "",
  initialLocation = "",
}: JobsContentProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { profile, user } = useAuth();
  const [seekerData, setSeekerData] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState(initialType);
  const [location, setLocation] = useState(initialLocation);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [hasSalary, setHasSalary] = useState(false);

  // Dynamic filter options from DB
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbLocations, setDbLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchJobs();
    getSearchFilters().then((filters) => {
      setDbCategories(filters.categories);
      setDbLocations(filters.locations);
    });
    
    if (user && profile?.role === 'seeker') {
      supabase.from('seekers').select('*').eq('profile_id', user.id).single()
        .then(({ data }) => {
          if (data) setSeekerData(data);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  async function fetchJobs() {
    setLoading(true);
    setError(null);
    try {
      const result = await getJobs({
        search: searchTerm || undefined,
        category: category || undefined,
        type: type || undefined,
        location: location || undefined,
        experience_level: experienceLevel || undefined,
        has_salary: hasSalary || undefined,
      });
      if (result.success) {
        setJobs(result.data);
      } else {
        setError(result.error || "فشل تحميل الوظائف");
        setJobs([]);
      }
    } catch (e: any) {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
      setJobs([]);
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchJobs();
  }

  function clearFilters() {
    setSearchTerm("");
    setCategory("");
    setType("");
    setLocation("");
    setExperienceLevel("");
    setHasSalary(false);
    setTimeout(() => fetchJobs(), 0);
  }

  const activeFiltersCount = [
    category,
    type,
    location,
    experienceLevel,
    hasSalary,
  ].filter(Boolean).length;

  // Default categories - always shown + any new from DB
  const defaultCats = ["طاهي/ة", "نادل/ة", "باريستا", "كاشير", "مدير", "توصيل", "مضيف/ة", "أخرى"];
  const extraCats = dbCategories.filter(c => !defaultCats.includes(c));
  const categoryOptions = [...defaultCats, ...extraCats].map(c => ({ value: c, label: c }));

  // Default locations - always shown + any new from DB
  const defaultLocs = ["رام الله", "نابلس", "الخليل", "بيت لحم", "جنين", "طولكرم", "قلقيلية", "أريحا", "سلفيت", "طوباس", "القدس"];
  const extraLocs = dbLocations.filter(l => !defaultLocs.includes(l));
  const locationOptions = [...defaultLocs, ...extraLocs].map(l => ({ value: l, label: l }));

  const experienceLevels = [
    { value: "بدون خبرة", label: "بدون خبرة" },
    { value: "سنة واحدة", label: "سنة واحدة" },
    { value: "سنتان", label: "سنتان" },
    { value: "3+ سنوات", label: "3+ سنوات" },
    { value: "5+ سنوات", label: "5+ سنوات" },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      {/* Premium Hero Section */}
      <div className="mb-12 relative text-right">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-100 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
          اكتشف <span className="text-brand-600">وظيفتك المثالية</span>
        </h1>
        <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
          فرص عمل حصرية وموثوقة في أفضل الفنادق والمطاعم في فلسطين. انضم إلينا اليوم وابدأ مسيرتك المهنية.
        </p>
      </div>

      {/* Advanced Search Bar */}
      <div className="bg-white p-3 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 mb-12 relative z-20">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <input
              type="text"
              placeholder="المسمى الوظيفي، الكلمات المفتاحية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 text-slate-900 font-bold placeholder:font-normal"
            />
          </div>
          <div className="md:w-64 relative group">
            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-600 transition-colors" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 text-slate-900 font-bold appearance-none cursor-pointer"
            >
              <option value="">جميع المواقع</option>
              {dbLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-center gap-2",
                showFilters || activeFiltersCount > 0
                  ? "bg-brand-50 border-brand-200 text-brand-700 shadow-inner"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="hidden sm:inline font-bold">الفلاتر</span>
              {activeFiltersCount > 0 && (
                <span className="bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              type="submit"
              className="flex-1 md:flex-none px-10 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-brand-200 active:scale-95 flex items-center justify-center gap-2"
            >
              بحث
            </button>
          </div>
        </form>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">التخصص</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="">الكل</option>
                {categoryOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">نوع الدوام</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="">الكل</option>
                <option value="دوام كامل">دوام كامل</option>
                <option value="دوام جزئي">دوام جزئي</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">الخبرة المطلوبة</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
                <option value="">الكل</option>
                {experienceLevels.map((e) => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">الموقع</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none"
              >
              <option value="">الكل</option>
                {locationOptions.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSalary}
                  onChange={(e) => setHasSalary(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-600">فقط وظائف بها راتب محدد</span>
              </label>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11px] font-black text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-all"
                >
                  إعادة ضبط
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 mb-8">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-[32px] p-6 animate-pulse h-[360px]">
              <div className="flex justify-between items-start mb-6">
                <div className="h-6 bg-slate-100 rounded-full w-20" />
                <div className="h-6 bg-slate-100 rounded-full w-12" />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-10 bg-slate-100 rounded-2xl w-full" />
                <div className="h-8 bg-slate-100 rounded-xl w-2/3" />
              </div>
              <div className="h-12 bg-slate-100 rounded-2xl w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState 
          onClear={clearFilters} 
          role={profile?.role} 
          showCompleteProfileBtn={seekerData && profile ? calculateProfileCompletion(profile, seekerData).completionPercent < 90 : true}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  return (
    <div className="group bg-white border border-slate-100 rounded-[32px] p-6 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500 flex flex-col h-full relative overflow-hidden">
      {/* Hover Background Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start mb-5 relative z-10">
        <span className={cn(
          "px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight uppercase",
          job.type === "دوام كامل" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"
        )}>
          {job.type}
        </span>
        {job.status === "approved" && (
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-xl border border-emerald-100" title="موثق من قبل فريق Hello Staff">
            <ShieldCheck className="h-3.5 w-3.5" />
            موثق
          </div>
        )}
      </div>

      <div className="flex items-start gap-4 mb-6 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm">
          {job.company_name ? job.company_name[0] : "؟"}
        </div>
        <div className="min-w-0 pt-1 text-right">
          <h3 className="text-base font-black text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors mb-1">
            {job.title}
          </h3>
          <p className="text-xs font-bold text-slate-500 line-clamp-1 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-brand-600/50" />
            {job.company_name}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-6 flex-1 relative z-10">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100/50">
          <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/50 rounded-xl border border-slate-100/50 text-[11px] font-bold text-slate-500">
            <Briefcase className="h-3.5 w-3.5 text-brand-400" />
            {job.category}
          </div>
          {job.experience_level && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/50 rounded-xl border border-slate-100/50 text-[11px] font-bold text-slate-500">
              <Clock className="h-3.5 w-3.5 text-brand-400" />
              {job.experience_level}
            </div>
          )}
        </div>

        {job.salary_min && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-black text-emerald-700">
              {job.salary_min.toLocaleString("ar-EG")} - {job.salary_max?.toLocaleString("ar-EG") || "..." } {job.currency || "₪"}
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 pt-4 border-t border-slate-50 flex items-center justify-between mt-auto">
        <Link
          href={`/jobs/${job.id}`}
          className="bg-slate-900 group-hover:bg-brand-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all duration-500 shadow-xl shadow-slate-900/10 group-hover:shadow-brand-600/20"
        >
          عرض التفاصيل
          <ArrowRight className="h-3.5 w-3.5 -rotate-180" />
        </Link>
        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">
          {timeAgo(job.created_at)}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ onClear, role, showCompleteProfileBtn = true }: { onClear: () => void; role?: string, showCompleteProfileBtn?: boolean }) {
  const isEmployer = role === 'employer';
  return (
    <div className="bg-white border border-slate-100 rounded-[48px] p-12 sm:p-24 text-center relative overflow-hidden shadow-2xl shadow-slate-200/50">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 opacity-40 blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-50 rounded-full -ml-32 -mb-32 opacity-40 blur-3xl animate-pulse" />
      
      <div className="relative z-10">
        <div className="w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-700 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-brand-500/40 rotate-3 transition-transform">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
        <h3 className="text-2xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">
          {isEmployer ? 'كن السبّاق وانشر أول وظيفة!' : 'لا توجد وظائف حالياً'}
        </h3>
        <p className="text-slate-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed font-medium">
          {isEmployer
            ? 'نحن في مرحلة الإطلاق التجريبي الحصرية. كن أول من ينشر فرصة عمل للحصول على ميزات خاصة للمبكرين.'
            : 'نحن في مرحلة الإطلاق التجريبي. سيتم إضافة وظائف جديدة قريباً، أكمل ملفك الشخصي لتكون جاهزاً للتقديم فور توفرها.'
          }
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {(isEmployer || showCompleteProfileBtn) && (
            <Link
              href={isEmployer ? '/post-job' : '/dashboard'}
              className="w-full sm:w-auto px-10 py-4 bg-brand-600 text-white rounded-3xl text-base font-black hover:bg-brand-700 transition-all shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-3 active:scale-95"
            >
              <Briefcase className="h-5 w-5" />
              {isEmployer ? 'انشر وظيفة مجاناً' : 'أكمل ملفك الشخصي'}
            </Link>
          )}
          <button
            onClick={onClear}
            className="w-full sm:w-auto px-10 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-3xl text-base font-black hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-2"
          >
            إعادة ضبط البحث
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  return date.toLocaleDateString("ar-EG");
}
