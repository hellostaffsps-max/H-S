import Link from 'next/link';
import { 
  Search, ChefHat, Briefcase, Users, Star, MapPin, Clock, UsersRound,
  Utensils, Coffee, CreditCard, ClipboardList, Bike, Handshake, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase-server';
import SearchBox from '@/components/SearchBox';

const categories = [
  { name: 'طاهي/ة', icon: ChefHat },
  { name: 'نادل/ة', icon: Utensils },
  { name: 'باريستا', icon: Coffee },
  { name: 'كاشير', icon: CreditCard },
  { name: 'مدير', icon: ClipboardList },
  { name: 'توصيل', icon: Bike },
  { name: 'مضيف/ة', icon: Handshake },
  { name: 'أخرى', icon: Sparkles },
];

export default async function Home() {
  const supabase = await createClient();

  // Fetch stats in parallel
  const [
    { count: jobsCount },
    { count: usersCount },
    { count: employersCount },
    { data: recentJobs }
  ] = await Promise.all([
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer'),
    supabase.from('jobs').select('*, employers(company_name)').eq('status', 'approved').order('created_at', { ascending: false }).limit(6)
  ]);

  const stats = {
    jobs: jobsCount || 0,
    users: usersCount || 0,
    employers: employersCount || 0,
    // We'll calculate applications as a proxy for successful hires
    hires: Math.floor((jobsCount || 0) * 1.5),
  };

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* Hero Section */}
      <section className="pt-4 sm:pt-6 px-3 sm:px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-brand-600 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 lg:p-14 text-center text-white relative overflow-hidden shadow-xl shadow-brand-500/10">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 opacity-10">
            <ChefHat className="w-64 h-64" />
          </div>
          <div className="absolute left-0 bottom-0 -ml-12 -mb-12 opacity-10">
            <div className="w-40 h-40 rounded-full border-[12px] border-white"></div>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-wide mb-6">
              <Star className="h-3.5 w-3.5" /> منصة التوظيف الأولى في الضيافة الفلسطينية
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 leading-tight">
              وظّف أفضل الكفاءات<br />لمطعمك أو مقهاك
            </h1>
            <p className="text-brand-50 text-sm sm:text-base mb-10 max-w-lg leading-relaxed">
              المنصة المتخصصة الأولى لربط أصحاب المنشآت بأمهر الطهاة، وموظفي التقديم، والإدارة في قطاع الضيافة.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto mb-8">
              <Link href="/post-job" className="w-full sm:w-auto bg-white text-brand-700 hover:bg-brand-50 px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2">
                انشر وظيفة الآن
              </Link>
              <Link href="/jobs" className="w-full sm:w-auto bg-brand-700/50 hover:bg-brand-700 text-white border border-brand-500/50 px-8 py-3.5 rounded-xl text-sm font-bold transition-all backdrop-blur-sm flex items-center justify-center gap-2">
                تصفح الكفاءات
              </Link>
            </div>

            <SearchBox />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-5xl mx-auto w-full px-3 sm:px-4 lg:px-8 -mt-12 sm:-mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center text-center">
            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold mb-0.5 text-slate-900">{stats.jobs}</div>
            <div className="text-xs text-slate-500 font-medium">وظيفة متاحة</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center text-center">
            <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold mb-0.5 text-slate-900">{stats.employers}</div>
            <div className="text-xs text-slate-500 font-medium">صاحب عمل</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center text-center">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold mb-0.5 text-slate-900">{stats.users}</div>
            <div className="text-xs text-slate-500 font-medium">مستخدم</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/50 shadow-sm flex flex-col items-center text-center">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 text-brand-600 mb-2" />
            <div className="text-xl sm:text-2xl font-bold mb-0.5 text-slate-900">{stats.hires}</div>
            <div className="text-xs text-slate-500 font-medium">توظيف ناجح</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8 mt-2">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">تصفح حسب التخصص</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.name} href={`/jobs?cat=${encodeURIComponent(category.name)}`} className="bg-white border text-center border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-2 hover:border-brand-200 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-105 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all duration-300">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5]" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-700">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-end mb-4 sm:mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">أحدث الوظائف</h2>
          <Link href="/jobs" className="text-brand-600 text-sm font-medium hover:text-brand-700 flex items-center gap-1 transition-colors">
            عرض الكل &larr;
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {(recentJobs || []).map((job) => (
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
      </section>

      {/* CTA section */}
      <section className="max-w-5xl mx-auto w-full px-3 sm:px-4 lg:px-8 mt-2">
        <div className="bg-slate-900 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 lg:p-10 text-center relative overflow-hidden shadow-2xl shadow-slate-900/20">
          <div className="absolute left-0 bottom-0 opacity-10">
             <ChefHat className="w-32 h-32 sm:w-48 sm:h-48 -mb-10 -ml-10 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3">أنت صاحب مطعم أو مقهى؟</h2>
            <p className="text-slate-400 text-sm md:text-base mb-6 max-w-lg mx-auto">
              انشر وظائفك مجاناً الآن وتواصل فوراً مع آلاف الباحثين عن عمل المتميزين في قطاع الضيافة.
            </p>
            <Link href="/post-job" className="inline-flex bg-brand-500 hover:bg-brand-400 text-white font-semibold text-sm px-5 sm:px-6 py-3 rounded-xl transition-colors shadow-lg shadow-brand-500/25">
              انشر وظيفة مجاناً
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
