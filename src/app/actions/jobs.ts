'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { toArabicError } from '@/lib/error-messages';

export async function getJobs(filters?: { category?: string; type?: string; location?: string; search?: string; experience_level?: string; has_salary?: boolean; page?: number; limit?: number }) {
  const supabase = await createClient();

  let query = supabase
    .from('jobs')
    .select('*, employers(company_name, logo_url)')
    .eq('status', 'approved')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters?.experience_level) {
    query = query.eq('experience_level', filters.experience_level);
  }
  if (filters?.has_salary) {
    query = query.not('salary_min', 'is', null);
  }

  // Pagination
  const limit = filters?.limit || 100;
  const page = filters?.page || 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    return { success: false, error: toArabicError(error.message), data: [] };
  }

  return { success: true, data: data || [] };
}

export async function getJobById(id: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('jobs')
    .select('*, employers(company_name, description, logo_url)')
    .eq('id', id);

  // If no user or not the employer/admin, only show approved jobs
  if (!user) {
    query = query.eq('status', 'approved').gte('expires_at', new Date().toISOString());
  } else {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isOwner = await supabase
      .from('jobs')
      .select('employer_id')
      .eq('id', id)
      .eq('employer_id', user.id)
      .single()
      .then(({ data }) => !!data);

    if (!isAdmin && !isOwner) {
      query = query.eq('status', 'approved').gte('expires_at', new Date().toISOString());
    }
  }

  const { data, error } = await query.single();

  if (error) {
    return { success: false, error: toArabicError(error.message), data: null };
  }

  return { success: true, data };
}

export async function createJob(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' };
  }

  // Verify user is employer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    return { success: false, error: 'فقط أصحاب العمل يمكنهم نشر وظائف' };
  }

  // Get employer record
  const { data: employer } = await supabase
    .from('employers')
    .select('profile_id')
    .eq('profile_id', user.id)
    .single();

  if (!employer) {
    return { success: false, error: 'لم يتم العثور على بيانات صاحب العمل' };
  }

  const job = {
    employer_id: user.id,
    title: formData.get('title') as string,
    category: formData.get('category') as string,
    type: formData.get('type') as string,
    location: formData.get('location') as string,
    company_name: formData.get('company_name') as string,
    experience_level: formData.get('experience_level') as string,
    description: formData.get('description') as string,
    currency: formData.get('currency') as string || 'ILS',
    salary_min: formData.get('salary_min') ? parseInt(formData.get('salary_min') as string) : null,
    salary_max: formData.get('salary_max') ? parseInt(formData.get('salary_max') as string) : null,
    whatsapp_number: formData.get('whatsapp_number') as string,
    status: 'approved' as const, // Auto-approve jobs
  };

  if (!job.title || !job.category || !job.type || !job.location || !job.company_name || !job.description) {
    return { success: false, error: 'جميع الحقول المطلوبة يجب ملؤها' };
  }

  // --- Subscription Limit Check ---
  // 1. Get the current active plan or fallback to free
  const { data: activeSub } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', user.id)
    .in('status', ['active', 'free'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let jobLimit = 1; // Default free limit
  if (activeSub && activeSub.subscription_plans) {
    jobLimit = activeSub.subscription_plans.job_limit || 0;
  } else {
    // If no active subscription, fetch the default free plan from the database
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('job_limit')
      .eq('price', 0)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (freePlan) jobLimit = freePlan.job_limit;
  }

  // 2. Count current approved/pending jobs
  const { count: currentJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('employer_id', user.id)
    .in('status', ['approved', 'pending']);

  if (currentJobs !== null && currentJobs >= jobLimit) {
    return { 
      success: false, 
      error: `لقد وصلت للحد الأقصى من الوظائف المسموح بها في خطتك الحالية (${jobLimit} وظائف). يرجى ترقية الخطة لنشر المزيد.` 
    };
  }
  // --------------------------------

  const { data, error } = await supabase.from('jobs').insert(job).select().single();

  if (error) {
    return { success: false, error: toArabicError(error.message) };
  }

  // Notify admins about the new job
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (admins && admins.length > 0) {
    const notifications = admins.map((admin) => ({
      user_id: admin.id,
      title: 'تم نشر وظيفة جديدة',
      message: `قامت منشأة (${job.company_name}) للتو بنشر وظيفة: ${job.title}`,
      type: 'job_posted',
      link: `/admin/jobs`,
    }));
    await supabase.from('notifications').insert(notifications);
  }

  revalidatePath('/jobs');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function getEmployerJobs() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: [] };
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('id, employer_id, title, category, type, location, company_name, status, salary_min, salary_max, currency, experience_level, created_at, expires_at, whatsapp_number')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: toArabicError(error.message), data: [] };
  }

  return { success: true, data: data || [] };
}

export async function updateJobStatus(jobId: string, status: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId)
    .eq('employer_id', user.id);

  if (error) {
    return { success: false, error: toArabicError(error.message) };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
