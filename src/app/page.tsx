import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ChefHat,
  Briefcase,
  Users,
  Star,
  MapPin,
  Clock,
  Coffee,
  Utensils,
  CreditCard,
  ClipboardList,
  Bike,
  Handshake,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Zap,
  MessageCircle,
  ArrowLeft,
  UserPlus,
  Building2,
  ListChecks,
  Eye,
  HeartHandshake,
  Calendar,
  Newspaper,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase-server";
import SearchBox from "@/components/SearchBox";
import AdsCarousel from "@/components/AdsCarousel";
import TrustedEmployersCarousel from "@/components/TrustedEmployersCarousel";

const HOSPITALITY_CATEGORIES = [
  "طاهي/ة",
  "نادل/ة",
  "باريستا",
  "كاشير",
  "مدير",
  "توصيل",
  "مضيف/ة",
  "أخرى",
];

const categories = [
  { name: "باريستا", icon: Coffee, slug: "باريستا" },
  { name: "طاهي/ة", icon: ChefHat, slug: "طاهي/ة" },
  { name: "نادل/ة", icon: Utensils, slug: "نادل/ة" },
  { name: "كاشير", icon: CreditCard, slug: "كاشير" },
  { name: "مضيف/ة", icon: Handshake, slug: "مضيف/ة" },
  { name: "مساعد مطبخ", icon: Sparkles, slug: "مساعد مطبخ" },
  { name: "مدير مطعم", icon: ClipboardList, slug: "مدير" },
  { name: "توصيل", icon: Bike, slug: "توصيل" },
];

const employerSteps = [
  { icon: UserPlus, title: "أنشئ ملف عملك", desc: "سجّل حساب صاحب عمل وأضف بيانات مطعمك أو مقهاك" },
  { icon: Building2, title: "انشر الوظيفة", desc: "اكتب تفاصيل الوظيفة والمتطلبات بنقرة واحدة" },
  { icon: Eye, title: "راجح المرشحين", desc: "شاهد ملفات الباحثين عن عمل وخبراتهم قبل التواصل" },
  { icon: HeartHandshake, title: "وظّف بسرعة", desc: "تواصل مباشر عبر المنصة أو واتساب واختصر وقت التوظيف" },
];

const candidateSteps = [
  { icon: UserPlus, title: "أنشئ ملفك", desc: "سجّل كباحث عن عمل وأضف مهاراتك وخبراتك" },
  { icon: ListChecks, title: "أضف مهاراتك", desc: "حدد تخصصك في الضيافة وسنوات خبرتك" },
  { icon: Search, title: "قدّم على الوظائف", desc: "ابحث بوظائف قطاع الضيافة وقدّم بملفك الواضح" },
  { icon: MessageCircle, title: "تواصل مع أصحاب العمل", desc: "استلم ردوداً وتواصل مباشرة مع أصحاب المطاعم" },
];

const trustSignals = [
  { icon: ShieldCheck, title: "مصمم خصيصاً لسوق الضيافة الفلسطيني", desc: "نركز فقط على المقاهي، المطاعم، الفنادق، وخدمات الطعام" },
  { icon: FileCheck, title: "ملفات مرشحين واضحة", desc: "شاهد الخبرات والمهارات قبل حتى ما تتواصل مع المرشح" },
  { icon: Zap, title: "تواصل أسرع بدون واسطات", desc: "راسل صاحب العمل أو المرشح مباشرة عبر المنصة أو واتساب" },
  { icon: Star, title: "تخصصات ضيافة فقط", desc: "ما فيش وظائف برّة القطاع — كل إعلان موجه لأهل الضيافة" },
];

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const profilePromise = user
    ? supabase.from("profiles").select("role").eq("id", user.id).single()
    : Promise.resolve({ data: null });

  // Only count and fetch HOSPITALITY jobs
  const [{ count: jobsCount }, { data: recentJobs }, { data: recentArticles }, { data: profileData }, { count: employersCount }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .in("category", HOSPITALITY_CATEGORIES),
    supabase
      .from("jobs")
      .select("*, employers(company_name, logo_url)")
      .eq("status", "approved")
      .in("category", HOSPITALITY_CATEGORIES)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("articles")
      .select("id, title, slug, excerpt, cover_image, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(3),
    profilePromise,
    supabase
      .from("employers")
      .select("*", { count: "exact", head: true }),
  ]);

  const userRole = profileData?.role;
  const isEmployer = userRole === "employer";
  const isSeeker = userRole === "seeker";

  let plans = [];
  let hasActiveSubscription = false;

  if (isEmployer && user) {
    const { data: activeSubs } = await supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "pending", "free"])
      .limit(1);

    if (activeSubs && activeSubs.length > 0) {
      hasActiveSubscription = true;
    }

    if (!hasActiveSubscription) {
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      plans = plansData || [];
    }
  }

  return (
    <div className="flex flex-col">
      {/* ===== HERO ===== */}
      <section className="relative bg-brand-700 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
          <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-white" />
        </div>

        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-20 sm:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-brand-100 mb-6 border border-white/10">
              <ShieldCheck className="h-3.5 w-3.5" />
              منصة التوظيف المتخصصة في الضيافة الفلسطينية
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.15] tracking-tight">
              وظّف كفاءات الضيافة أسرع
              <br />
              <span className="text-brand-200">— بدون دوخة الجروبات والواسطات</span>
            </h1>

            <p className="text-brand-100/90 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Hello Staff تربط أصحاب المقاهي والمطاعم بكفاءات جاهزة للعمل في
              فلسطين، مع ملفات واضحة وخبرات قابلة للمراجعة قبل التواصل.
            </p>

            {/* Dual CTAs */}
            {!user && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
                <Link
                  href="/auth/signup?role=employer"
                  className="w-full sm:w-auto group bg-white text-brand-700 hover:bg-brand-50 px-8 py-4 rounded-2xl text-sm font-bold transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2.5"
                >
                  <Building2 className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                  أنا صاحب مطعم / مقهى
                </Link>
                <Link
                  href="/auth/signup?role=seeker"
                  className="w-full sm:w-auto group bg-brand-800/60 hover:bg-brand-800/80 text-white border border-white/20 px-8 py-4 rounded-2xl text-sm font-bold transition-all backdrop-blur-sm flex items-center justify-center gap-2.5"
                >
                  <Briefcase className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
                  أنا بدور على شغل
                </Link>
              </div>
            )}

            <SearchBox />
          </div>
        </div>
      </section>

      {/* ===== SOFT TRUST BAR ===== */}
      <section className={`max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10 ${user ? 'mt-8' : '-mt-10'}`}>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6 sm:p-8 text-center">
          <p className="text-sm sm:text-base text-slate-600 font-medium">
            نبدأ حالياً مع مجموعة مختارة من المقاهي والمطاعم في فلسطين
          </p>
          <p className="text-xs text-slate-400 mt-2 mb-4">
            انضم إلينا وكن من أوائل المستفيدين من المنصة
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(!isEmployer || (isEmployer && employersCount && employersCount > 0)) && employersCount !== null && employersCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-xl text-sm font-bold">
                <Building2 className="h-4 w-4" />
                {employersCount} منشأة مسجلة في المنصة
              </div>
            )}
            {!isEmployer && jobsCount !== null && jobsCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 px-4 py-2 rounded-xl text-sm font-bold">
                <Briefcase className="h-4 w-4" />
                {jobsCount} وظيفة متاحة حالياً
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== TRUSTED EMPLOYERS CAROUSEL ===== */}
      <div className="mt-4"><TrustedEmployersCarousel /></div>

      {/* ===== ARTICLES (Guest and Seekers) ===== */}
      {(!user || isSeeker) && recentArticles && recentArticles.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-brand-600" />
                أحدث المقالات
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                نصائح وأخبار من عالم الضيافة والتوظيف
              </p>
            </div>
            <Link
              href="/blog"
              className="text-brand-600 text-sm font-bold hover:text-brand-700 flex items-center gap-1 transition-colors shrink-0"
            >
              عرض الكل <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentArticles.map((article: any) => (
              <Link
                key={article.id}
                href={`/blog/${article.slug}`}
                className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-brand-200 hover:shadow-lg transition-all"
              >
                <div className="h-40 sm:h-44 bg-slate-100 relative overflow-hidden">
                  {article.cover_image ? (
                    <Image
                      src={article.cover_image}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Newspaper className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-xs sm:text-sm text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(article.created_at).toLocaleDateString("ar-EG")}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}



      {/* ===== ADS CAROUSEL ===== */}
      <AdsCarousel />

      {/* ===== CATEGORIES ===== */}
      {!isEmployer && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
            وظائف الضيافة بالتخصص
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
            اختر تخصصك وابحث عن الفرصة اللي تناسبك
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                href={`/jobs?cat=${encodeURIComponent(category.slug)}`}
                className="group bg-white border border-slate-100 rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 text-slate-500 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-105 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all duration-300">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-700 text-center">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      )}

      {/* ===== HOW IT WORKS ===== */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
            كيف يعمل Hello Staff؟
          </h2>
          <p className="text-slate-500 text-sm sm:text-base">
            خطوات بسيطة توصلك لهدفك سواء كنت صاحب عمل أو باحث عن شغل
          </p>
        </div>

        <div className={`grid gap-6 sm:gap-8 ${(isEmployer || isSeeker) ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2'}`}>
          {/* Employer side */}
          {!isSeeker && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">لأصحاب العمل</h3>
              </div>
              <div className="space-y-5">
                {employerSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      {i < employerSteps.length - 1 && (
                        <div className="w-px h-full bg-brand-100 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5">{step.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidate side */}
          {!isEmployer && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">للباحثين عن عمل</h3>
              </div>
              <div className="space-y-5">
                {candidateSteps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      {i < candidateSteps.length - 1 && (
                        <div className="w-px h-full bg-sky-100 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <h4 className="text-sm font-bold text-slate-900 mb-0.5">{step.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== TRUST SIGNALS (Guest and Employers) ===== */}
      {!isSeeker && (
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24">
        <div className="bg-slate-50 rounded-3xl p-6 sm:p-10 lg:p-14 border border-slate-100">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight">
              ليش تختار Hello Staff؟
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
              بناءً على تحديات فعلية واجهناها مع أصحاب المطاعم والمقاهي
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {trustSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">
                    {signal.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {signal.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ===== PRICING PLANS (Employers only) ===== */}
      {isEmployer && plans.length > 0 && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-2 tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-brand-600" />
              باقات الاشتراك
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
              اختر الخطة المناسبة لشركتك ووظّف بكفاءة أكبر
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {plans.map((plan: any) => (
              <div
                key={plan.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 hover:border-brand-200 hover:shadow-lg transition-all relative overflow-hidden flex flex-col"
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-600" />
                )}
                {plan.recommended && (
                  <div className="absolute top-3 left-3 bg-brand-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    الأكثر طلباً
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    ₪{plan.price}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    /شهرياً
                  </span>
                </div>

                <ul className="space-y-3 mb-6 flex-grow">
                  {(plan.features || []).map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pricing"
                  className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-colors ${
                    plan.recommended
                      ? "bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-200"
                      : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  اختر هذه الخطة
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== RECENT JOBS (Guest and Seekers) ===== */}
      {!isEmployer && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-1 tracking-tight">
              أحدث الوظائف
            </h2>
            <p className="text-slate-500 text-sm">فرص جديدة في قطاع الضيافة</p>
          </div>
          <Link
            href="/jobs"
            className="text-brand-600 text-sm font-bold hover:text-brand-700 flex items-center gap-1 transition-colors"
          >
            عرض الكل <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        {(recentJobs || []).length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              لا توجد وظائف منشورة حالياً
            </p>
            <p className="text-slate-400 text-sm mt-1">
              كن أول من ينشر وظيفة على المنصة
            </p>
            <Link
              href="/post-job"
              className="inline-flex items-center gap-2 mt-4 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
            >
              <PlusIcon /> انشر وظيفة
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(recentJobs || []).map((job: any) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
      )}

      {/* ===== FINAL CTA ===== */}
      {!user && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-20">
          <div className="bg-brand-700 rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                جاهز توظّف كفاءات لمطعمك؟
              </h2>
              <p className="text-brand-100 text-sm sm:text-base mb-8 max-w-lg mx-auto">
                أنشئ حسابك كصاحب عمل مجاناً وانشر أول وظيفة في دقائق. لا رسوم
                خفية، ولا تعقيدات.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/auth/signup?role=employer"
                  className="w-full sm:w-auto bg-white text-brand-700 hover:bg-brand-50 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Building2 className="h-5 w-5" />
                  أنشئ حساب صاحب عمل
                </Link>
                <Link
                  href="/auth/signup?role=seeker"
                  className="w-full sm:w-auto bg-brand-800/60 hover:bg-brand-800/80 text-white border border-white/20 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Briefcase className="h-5 w-5" />
                  أنشئ حساب باحث عن عمل
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  return (
    <div className="group bg-white border border-slate-100 rounded-2xl p-4 hover:border-brand-200 hover:shadow-lg transition-all flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide",
            job.type === "دوام كامل"
              ? "bg-brand-50 text-brand-700"
              : "bg-sky-50 text-sky-700"
          )}
        >
          {job.type}
        </span>
        {job.status === "approved" && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-3 w-3" /> معتمدة
          </span>
        )}
      </div>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden relative p-0.5">
          {job.employers?.logo_url ? (
            <Image
              src={job.employers.logo_url}
              alt={job.employers?.company_name || job.company_name}
              fill
              className="object-contain"
              sizes="40px"
            />
          ) : (
            (job.company_name || "؟")[0]
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
            {job.title}
          </h3>
          <p className="text-[13px] text-slate-500 line-clamp-1">{job.employers?.company_name || job.company_name}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {job.category}
            {job.salary_min && job.salary_max
              ? ` · ${job.currency || "₪"} ${job.salary_min.toLocaleString("ar-EG")}-${job.salary_max.toLocaleString("ar-EG")}`
              : ""}
          </span>
        </div>
      </div>

      <div className="pt-3.5 border-t border-slate-50 flex items-center justify-between w-full mt-auto">
        <Link
          href={`/jobs/${job.id}`}
          className="bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
        >
          التفاصيل
        </Link>
        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <Clock className="h-3 w-3" />
          {new Date(job.created_at).toLocaleDateString("ar-EG")}
        </span>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}
