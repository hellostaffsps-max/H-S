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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getJobs } from "@/app/actions/jobs";
import { getSearchFilters } from "@/app/actions/search-filters";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-1 tracking-tight">
          الوظائف المتاحة
        </h1>
        <p className="text-sm text-slate-500">
          فرص عمل حصرية في قطاع الضيافة
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center px-4 bg-slate-50 rounded-xl h-12">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="ابحث عن وظيفة، تخصص، أو شركة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 px-3 text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 h-12 rounded-xl text-sm font-bold transition-colors border",
                showFilters || activeFiltersCount > 0
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              الفلاتر
              {activeFiltersCount > 0 && (
                <span className="bg-brand-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white px-6 h-12 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              بحث
            </button>
          </div>
        </div>

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
                  className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" /> إعادة ضبط الفلاتر
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">{error}</p>
            <button
              onClick={fetchJobs}
              className="text-xs text-red-600 font-bold mt-1 hover:underline"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      {!error && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-500">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                جاري التحميل...
              </span>
            ) : (
              <>
                <span className="font-bold text-slate-900">{jobs.length}</span>{" "}
                وظيفة متاحة
              </>
            )}
          </div>
          <div className="text-xs text-slate-400">مرتبة حسب: الأحدث</div>
        </div>
      )}

      {/* Jobs Grid */}
      {!error && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 h-60 animate-pulse">
                  <div className="flex justify-between mb-4">
                    <div className="h-5 bg-slate-100 rounded w-20"></div>
                    <div className="h-5 bg-slate-100 rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-slate-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
                  <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  return (
    <div className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-brand-200 hover:shadow-lg transition-all flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide",
          job.type === "دوام كامل" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"
        )}>
          {job.type}
        </span>
        {job.status === "approved" && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" /> معتمدة
          </span>
        )}
      </div>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg shrink-0">
          {(job.company_name || "؟")[0]}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-brand-700 transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-1 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {job.company_name}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{job.category}</span>
        </div>
        {job.experience_level && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.experience_level}</span>
          </div>
        )}
        {job.salary_min && job.salary_max && (
          <div className="flex items-center gap-1.5">
            <span className="text-brand-600 font-bold text-xs">
              {job.currency || "₪"} {job.salary_min.toLocaleString("ar-EG")} - {job.salary_max.toLocaleString("ar-EG")}
            </span>
          </div>
        )}
      </div>

      <div className="pt-3.5 border-t border-slate-50 flex items-center justify-between w-full mt-auto">
        <Link
          href={`/jobs/${job.id}`}
          className="text-brand-600 hover:text-brand-700 text-xs font-bold flex items-center gap-1 transition-colors"
        >
          عرض التفاصيل →
        </Link>
        <span className="text-[11px] text-slate-400 font-medium">
          {timeAgo(job.created_at)}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-10 sm:p-16 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Search className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        لا توجد وظائف مطابقة حالياً
      </h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
        جرّب تعديل الفلاتر أو فعّل تنبيهات الوظائف لتصلك الفرص الجديدة فور نشرها.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onClear}
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
        >
          إعادة ضبط الفلاتر
        </button>
        <Link
          href="/job-alerts"
          className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          فعّل تنبيهات الوظائف
        </Link>
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
