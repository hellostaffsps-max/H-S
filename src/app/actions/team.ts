'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { toArabicError } from '@/lib/error-messages';

/**
 * Get all accepted (hired) team members for the employer
 */
export async function getTeamMembers() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: [] };
  }

  // Get all jobs by this employer
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, company_name')
    .eq('employer_id', user.id);

  if (!jobs || jobs.length === 0) {
    return { success: true, data: [], companyName: '' };
  }

  const jobIds = jobs.map(j => j.id);
  const companyName = jobs[0].company_name || '';

  // Get all accepted applications for these jobs
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      seeker_id,
      job_id,
      jobs(title, company_name),
      seekers(
        job_title,
        experience_years,
        skills,
        is_available,
        current_employer,
        profiles(full_name, avatar_url, location, phone, email)
      )
    `)
    .in('job_id', jobIds)
    .eq('status', 'مقبول')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: toArabicError(error.message), data: [] };
  }

  return { success: true, data: applications || [], companyName };
}

/**
 * Terminate an employee - changes status to "لم يتم التوظيف" and sets seeker as available
 */
export async function terminateEmployee(applicationId: string, reason?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Verify ownership
  const { data: application } = await supabase
    .from('applications')
    .select('id, seeker_id, job_id, status')
    .eq('id', applicationId)
    .single();

  if (!application) {
    return { success: false, error: 'الطلب غير موجود' };
  }

  if (application.status !== 'مقبول') {
    return { success: false, error: 'هذا الموظف ليس في حالة توظيف نشطة' };
  }

  // Verify the employer owns the job
  const { data: job } = await supabase
    .from('jobs')
    .select('employer_id, title')
    .eq('id', application.job_id)
    .single();

  if (!job || job.employer_id !== user.id) {
    return { success: false, error: 'ليس لديك صلاحية لإنهاء عمل هذا الموظف' };
  }

  // Update application status
  const updateData: Record<string, unknown> = { status: 'لم يتم التوظيف' };
  if (reason) updateData.rejection_reason = reason;

  const { error: updateError } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', applicationId);

  if (updateError) {
    return { success: false, error: toArabicError(updateError.message) };
  }

  // Send notification to seeker
  try {
    await supabase.from('notifications').insert({
      user_id: application.seeker_id,
      title: 'إنهاء فترة العمل',
      message: `تم إنهاء فترة عملك في وظيفة "${job.title}".${reason ? ` السبب: ${reason}` : ''} نتمنى لك التوفيق.`,
      type: 'application',
    });
  } catch (e) {
    console.error('Failed to create notification:', e);
  }

  revalidatePath('/dashboard/team');
  revalidatePath('/dashboard');
  return { success: true };
}
