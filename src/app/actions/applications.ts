'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function applyToJob(jobId: string, message?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' };
  }

  // Verify seeker
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'seeker') {
    return { success: false, error: 'فقط الباحثين عن عمل يمكنهم التقديم' };
  }

  // Get seeker record
  const { data: seeker } = await supabase
    .from('seekers')
    .select('profile_id')
    .eq('profile_id', user.id)
    .single();

  if (!seeker) {
    return { success: false, error: 'لم يتم العثور على بيانات الباحث' };
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      seeker_id: user.id,
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('unique constraint')) {
      return { success: false, error: 'لقد قدمت لهذه الوظيفة مسبقاً' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/jobs');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function getApplications(jobId?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: [] };
  }

  let query = supabase
    .from('applications')
    .select('*, jobs(title, company_name), seekers(experience_years, job_title, profiles(full_name, avatar_url, location))')
    .order('created_at', { ascending: false });

  if (jobId) {
    query = query.eq('job_id', jobId);
  } else {
    // For employers, show applications to their jobs
    query = query.eq('jobs.employer_id', user.id);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data || [] };
}

export async function getMyApplications() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: [] };
  }

  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(title, company_name, location, type)')
    .eq('seeker_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data || [] };
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify the user is the employer of the job associated with this application
  const { data: application } = await supabase
    .from('applications')
    .select('job_id')
    .eq('id', applicationId)
    .single();

  if (!application) {
    return { success: false, error: 'Application not found' };
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('employer_id')
    .eq('id', application.job_id)
    .single();

  if (!job || job.employer_id !== user.id) {
    return { success: false, error: 'Forbidden: You can only update applications to your own jobs' };
  }

  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
