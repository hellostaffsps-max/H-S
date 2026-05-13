import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  ArrowRight,
  Phone,
  ShieldCheck,
  Star,
  Users,
  CheckCircle2,
  Calendar,
  Share2,
  Send,
  TrendingUp,
} from "lucide-react";
import { getJobById } from "@/app/actions/jobs";
import { createClient } from "@/lib/supabase-server";
import ApplyButton from "@/components/ApplyButton";
import { cn } from "@/lib/utils";
import { calculateProfileCompletion } from "@/lib/profile-utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getJobById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const job = result.data as any;

  // Check if user is logged in and get their role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: string | null = null;
  let profileComplete = true;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, phone, location')
      .eq('id', user.id)
      .single();
    userRole = profile?.role || null;

    if (userRole === 'seeker') {
      const { data: seekerProfile } = await supabase
        .from('seekers')
        .select('job_title, experience_years, skills, bio, cv_url, resume_data')
        .eq('profile_id', user.id)
        .single();
      if (seekerProfile) {
        const { completionPercent } = calculateProfileCompletion(profile, seekerProfile);
        profileComplete = completionPercent >= 90;
      } else {
        profileComplete = false;
      }
    }
  }

  // Fetch related jobs (same category, excluding current)
  const { data: relatedJobs } = await supabase
    .from("jobs")
    .select("id, title, company_name, location, type, category, salary_min, salary_max, currency, created_at")
    .eq("status", "approved")
    .eq("category", job.category)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(3);

  const postedDate = new Date(job.created_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
  const postedText =
    diffDays === 0
      ? "اليوم"
      : diffDays === 1
      ? "أمس"
      : diffDays < 7
      ? `منذ ${diffDays} أيام`
      : postedDate.toLocaleDateString("ar-EG");

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20" dir="rtl">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 pt-8 pb-12">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <nav className="mb-8">
            <Link
              href="/jobs"
              className="group inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-brand-600 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                <ArrowRight className="h-4 w-4" />
              </div>
              العودة للوظائف
            </Link>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/20 flex items-center justify-center text-white text-3xl font-black shrink-0 border-4 border-white overflow-hidden relative">
                {job.employers?.logo_url ? (
                  <Image
                    src={job.employers.logo_url}
                    alt={job.employers?.company_name || job.company_name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  (job.company_name || "؟")[0]
                )}
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight",
                    job.type === "دوام كامل" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"
                  )}>
                    {job.type}
                  </span>
                  {job.status === "approved" && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      موثق
                    </div>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                  {job.title}
                </h1>
                <div className="flex items-center gap-3 text-slate-500 font-bold text-base">
                  <Building2 className="h-5 w-5 text-brand-600/50" />
                  {job.employers?.company_name || job.company_name}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {userRole !== 'employer' && (
                <ApplyButton jobId={job.id} isLoggedIn={!!user} profileComplete={profileComplete} />
              )}
              {job.whatsapp_number && (
                <a
                  href={`https://wa.me/${job.whatsapp_number.replace(/\D/g, "").replace(/^0/, "970")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 bg-emerald-500 text-white px-8 py-4 rounded-[22px] text-base font-black hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                >
                  <Phone className="h-5 w-5" />
                  تواصل عبر واتساب
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 -mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <InfoCard icon={MapPin} label="الموقع" value={job.location} />
              <InfoCard icon={Calendar} label="تاريخ النشر" value={postedText} />
              <InfoCard icon={Briefcase} label="التخصص" value={job.category} />
              <InfoCard icon={Star} label="الخبرة" value={job.experience_level || "غير محدد"} />
            </div>

            {/* Description */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 sm:p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-20 bg-brand-600" />
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-600" />
                تفاصيل الوظيفة
              </h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base sm:text-lg font-medium">
                {job.description}
              </div>

              {job.salary_min && (
                <div className="mt-10 p-6 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">الراتب المتوقع</p>
                    <p className="text-xl font-black text-slate-900">
                      {job.salary_min.toLocaleString("ar-EG")} - {job.salary_max?.toLocaleString("ar-EG") || "..." } {job.currency || "₪"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Company Card */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm text-center">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-6 text-3xl font-black">
                {(job.company_name || "؟")[0]}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {job.company_name}
              </h3>
              <p className="text-sm font-bold text-slate-500 mb-6 flex items-center justify-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-500" />
                {job.location}
              </p>
              <div className="py-3 px-4 bg-emerald-50 rounded-2xl flex items-center justify-center gap-2 text-emerald-700 text-xs font-black">
                <ShieldCheck className="h-4 w-4" />
                صاحب عمل موثق
              </div>
            </div>

            {/* Share Card */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl shadow-slate-900/20">
              <h3 className="text-lg font-black mb-4 flex items-center gap-3">
                <Share2 className="h-5 w-5 text-brand-400" />
                شارك الفرصة
              </h3>
              <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
                ساعد أصدقائك في العثور على عمل. شارك هذا الإعلان معهم الآن.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <ShareAction
                  href={`https://wa.me/?text=${encodeURIComponent(`وظيفة: ${job.title} على Hello Staff\nhttps://www.staffps.com/jobs/${job.id}`)}`}
                  label="واتساب"
                  color="bg-emerald-600 hover:bg-emerald-700"
                />
                <ShareAction
                  href={`https://t.me/share/url?url=${encodeURIComponent(`https://www.staffps.com/jobs/${job.id}`)}&text=${encodeURIComponent(`وظيفة: ${job.title}`)}`}
                  label="تلغرام"
                  color="bg-sky-600 hover:bg-sky-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Jobs */}
      {(relatedJobs || []).length > 0 && (
        <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              وظائف مشابهة قد تهمك
            </h2>
            <Link href="/jobs" className="text-sm font-black text-brand-600 hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(relatedJobs || []).map((rj: any) => (
              <Link
                key={rj.id}
                href={`/jobs/${rj.id}`}
                className="group bg-white border border-slate-100 rounded-[32px] p-6 hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "px-3 py-1 rounded-xl text-[10px] font-black uppercase",
                    rj.type === "دوام كامل" ? "bg-brand-50 text-brand-700" : "bg-sky-50 text-sky-700"
                  )}>
                    {rj.type}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">
                  {rj.title}
                </h3>
                <p className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 opacity-50" />
                  {rj.company_name}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-xs font-black text-slate-400">{rj.location}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-all">
                    <ArrowRight className="h-4 w-4 -rotate-180" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-slate-900 truncate">{value}</p>
    </div>
  );
}

function ShareAction({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black text-white transition-all active:scale-95",
        color
      )}
    >
      {label}
    </a>
  );
}
