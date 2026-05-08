'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { toArabicError } from '@/lib/error-messages';

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
    return { success: false, error: toArabicError(error.message) };
  }

  // Notify the employer about the new application
  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('employer_id, title')
      .eq('id', jobId)
      .single();

    const { data: seekerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (job?.employer_id) {
      const seekerName = seekerProfile?.full_name || 'باحث عن عمل';
      await createNotification(
        supabase,
        job.employer_id,
        'طلب توظيف جديد',
        `قام ${seekerName} بالتقديم على وظيفة "${job.title}"`,
        'application',
        `/dashboard`
      );
    }
  } catch (e) {
    console.error('Failed to notify employer:', e);
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
    .select('*, jobs(title, company_name), seekers(experience_years, job_title, bio, skills, cv_url, resume_data, is_available, current_employer, profiles(full_name, avatar_url, location, phone, email))')
    .order('created_at', { ascending: false })
    .limit(200);

  // Note: interview_date, interview_location, interview_notes are included via *

  if (jobId) {
    query = query.eq('job_id', jobId);
  } else {
    // For employers, show applications to their jobs
    query = query.eq('jobs.employer_id', user.id);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: toArabicError(error.message), data: [] };
  }

  return { success: true, data: data || [] };
}

async function createNotification(
  supabase: any,
  userId: string,
  title: string,
  message: string,
  type: string = 'application',
  link?: string
) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
    });
  } catch (e) {
    console.error('Failed to create notification:', e);
  }
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
    return { success: false, error: toArabicError(error.message), data: [] };
  }

  return { success: true, data: data || [] };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  interviewDate?: string | null,
  interviewLocation?: string | null,
  interviewNotes?: string | null,
  rejectionReason?: string | null
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify the user is the employer of the job associated with this application
  const { data: application } = await supabase
    .from('applications')
    .select('job_id, seeker_id, status')
    .eq('id', applicationId)
    .single();

  if (!application) {
    return { success: false, error: 'Application not found' };
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('employer_id, title')
    .eq('id', application.job_id)
    .single();

  if (!job || job.employer_id !== user.id) {
    return { success: false, error: 'Forbidden: You can only update applications to your own jobs' };
  }

  const updateData: any = { status };
  if (interviewDate !== undefined) updateData.interview_date = interviewDate;
  if (interviewLocation !== undefined) updateData.interview_location = interviewLocation;
  if (interviewNotes !== undefined) updateData.interview_notes = interviewNotes;
  if (rejectionReason !== undefined) updateData.rejection_reason = rejectionReason;

  const { error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', applicationId);

  if (error) {
    return { success: false, error: toArabicError(error.message) };
  }

  // Send notification to seeker
  let notifTitle = 'تحديث على طلب التقديم';
  let notifMessage = `تم تحديث حالة طلبك على وظيفة "${job.title}" إلى: ${status}`;

  if (status === 'مقبول') {
    notifTitle = 'تهانينا! تم قبول طلبك';
    notifMessage = `تم قبول طلبك على وظيفة "${job.title}". سنتواصل معك قريباً.`;
  } else if (status === 'لم يتم التوظيف') {
    notifTitle = 'تحديث على طلب التقديم';
    notifMessage = `لم يتم التوظيف على وظيفة "${job.title}" هذه المرة. نتمنى لك التوفيق.`;
  } else if (status === 'مقابلة') {
    notifTitle = 'تمت دعوتك لمقابلة عمل';
    notifMessage = `تمت دعوتك لمقابلة عمل على وظيفة "${job.title}". يرجى مراجعة التفاصيل.`;
  }

  // Build link for the notification
  const seekerLink = `/dashboard/applications`;
  const notifLink = status === 'مقبول' ? `/dashboard/applications` :
                    status === 'مقابلة' ? `/dashboard/applications` :
                    `/dashboard/applications`;

  await createNotification(supabase, application.seeker_id, notifTitle, notifMessage, 'application', notifLink);

  revalidatePath('/dashboard');
  return { success: true };
}
