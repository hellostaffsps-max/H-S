import { notFound } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { getJobById } from "@/app/actions/jobs";
import { createClient } from "@/lib/supabase-server";
import ApplyButton from "@/components/ApplyButton";

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
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    userRole = profile?.role || null;
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
      ? "نُشرت اليوم"
      : diffDays === 1
      ? "نُشرت أمس"
      : diffDays < 7
      ? `نُشرت منذ ${diffDays} أيام`
      : `نُشرت بتاريخ ${postedDate.toLocaleDateString("ar-EG")}`;

  return (
    <div
      className="max-w-5xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-6 sm:py-8"
      dir="rtl"
    >
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/jobs"
          className="text-sm text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          <ArrowRight className="h-4 w-4" /> الوظائف المتاحة
        </Link>
      </nav>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                      job.type === "دوام كامل"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {job.type}
                  </span>
                  {job.status === "approved" && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="h-3 w-3" /> معتمدة
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 leading-tight">
                  {job.title}
                </h1>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{job.company_name}</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center font-bold text-2xl shrink-0">
                {(job.company_name || "؟")[0]}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <InfoItem icon={MapPin} label="الموقع" value={job.location} />
              <InfoItem
                icon={DollarSign}
                label="الراتب"
                value={
                  job.salary_min && job.salary_max
                    ? `${job.currency || "₪"} ${job.salary_min.toLocaleString("ar-EG")} - ${job.salary_max.toLocaleString("ar-EG")}`
                    : "غير محدد"
                }
              />
              <InfoItem icon={Clock} label="تاريخ النشر" value={postedText} />
              <InfoItem icon={Briefcase} label="التخصص" value={job.category} />
              <InfoItem
                icon={Star}
                label="الخبرة المطلوبة"
                value={job.experience_level || "غير محدد"}
              />
              <InfoItem
                icon={Users}
                label="نوع الدوام"
                value={job.type}
              />
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              {userRole !== 'employer' && (
                <ApplyButton jobId={job.id} isLoggedIn={!!user} />
              )}
              {job.whatsapp_number && (
                <a
                  href={`https://wa.me/${job.whatsapp_number.replace(/\D/g, "").replace(/^0/, "970")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  تواصل عبر واتساب
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              وصف الوظيفة
            </h2>
            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {job.description}
            </div>

            {job.experience_level && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  الخبرة المطلوبة
                </h3>
                <p className="text-slate-600">{job.experience_level}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
              <span className="text-xs text-slate-400">
                رقم الإعلان: {job.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Employer Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">
              صاحب العمل
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl shrink-0">
                {(job.employers?.company_name || job.company_name || "؟")[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {job.employers?.company_name || job.company_name}
                </p>
                <p className="text-xs text-slate-500">{job.location}</p>
              </div>
            </div>
            {job.employers?.description && (
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {job.employers.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-bold">صاحب عمل معتمد</span>
            </div>
          </div>

          {/* Share / Actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">
              شارك الوظيفة
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              هل تعرف شخص يبحث عن هذه الوظيفة؟ شاركه معه.
            </p>
            <ShareButtons jobId={job.id} title={job.title} />
          </div>
        </div>
      </div>

      {/* Related Jobs */}
      {(relatedJobs || []).length > 0 && (
        <div className="mt-10 sm:mt-14">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-5 tracking-tight">
            وظائف مشابهة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(relatedJobs || []).map((rj: any) => (
              <Link
                key={rj.id}
                href={`/jobs/${rj.id}`}
                className="group bg-white border border-slate-100 rounded-2xl p-5 hover:border-brand-200 hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      rj.type === "دوام كامل"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-sky-50 text-sky-700"
                    }`}
                  >
                    {rj.type}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-brand-700 transition-colors">
                  {rj.title}
                </h3>
                <p className="text-xs text-slate-500 mb-3">{rj.company_name}</p>
                <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{rj.location}</span>
                  {rj.salary_min && rj.salary_max && (
                    <span className="text-xs font-bold text-brand-600">
                      {rj.currency || "₪"} {rj.salary_min.toLocaleString("ar-EG")}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
      <Icon className="h-4 w-4 text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 leading-none mb-1">{label}</p>
        <p className="text-xs font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function ShareButtons({ jobId, title }: { jobId: string; title: string }) {
  const url = `https://www.staffps.com/jobs/${jobId}`;
  const text = encodeURIComponent(`وظيفة: ${title} على Hello Staff`);

  return (
    <div className="flex gap-2">
      <a
        href={`https://wa.me/?text=${text}%0A${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center py-2 rounded-lg bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors"
      >
        واتساب
      </a>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center py-2 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 transition-colors"
      >
        تلغرام
      </a>
    </div>
  );
}
