import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Briefcase, Clock, DollarSign, Building2, ArrowRight, Phone } from 'lucide-react';
import { getJobById } from '@/app/actions/jobs';
import { createClient } from '@/lib/supabase-server';
import ApplyButton from '@/components/ApplyButton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getJobById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const job = result.data;

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-6 sm:py-8" dir="rtl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/jobs" className="text-sm text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors">
          <ArrowRight className="h-4 w-4" /> العودة للوظائف
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${
                job.type === 'دوام كامل' ? "bg-brand-50 text-brand-700" : "bg-blue-50 text-blue-700"
              }`}>
                {job.type}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                {job.status === 'approved' ? 'معتمدة' : job.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{job.title}</h1>
            <div className="flex items-center gap-2 text-slate-500">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{job.company_name}</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center font-bold text-2xl shrink-0">
            {(job.company_name || '؟')[0]}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5 sm:p-3">
            <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">الموقع</p>
              <p className="text-sm font-bold text-slate-900 truncate">{job.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5 sm:p-3">
            <DollarSign className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">الراتب</p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {job.salary_min && job.salary_max 
                  ? `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                  : 'غير محدد'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-2.5 sm:p-3">
            <Clock className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">تاريخ النشر</p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {new Date(job.created_at).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <ApplyButton jobId={job.id} isLoggedIn={!!user} />
          {job.whatsapp_number && (
            <a
              href={`https://wa.me/${job.whatsapp_number.replace(/\D/g, '').replace(/^0/, '970')}`}
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">وصف الوظيفة</h2>
        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
          {job.description}
        </div>

        {job.experience_level && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-2">الخبرة المطلوبة</h3>
            <p className="text-slate-600">{job.experience_level}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-2">التخصص</h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium">
            <Briefcase className="h-4 w-4" />
            {job.category}
          </span>
        </div>
      </div>
    </div>
  );
}
