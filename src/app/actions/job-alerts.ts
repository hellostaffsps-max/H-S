'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { toArabicError } from '@/lib/error-messages';

export async function getJobAlerts() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: [] };
  }

  const { data, error } = await supabase
    .from('job_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: toArabicError(error.message), data: [] };
  }

  return { success: true, data: data || [] };
}

export async function createJobAlert(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const alert = {
    user_id: user.id,
    keyword: (formData.get('keyword') as string) || null,
    category: (formData.get('category') as string) || null,
    location: (formData.get('location') as string) || null,
    type: (formData.get('type') as string) || null,
  };

  // Ensure at least one filter is set
  if (!alert.keyword && !alert.category && !alert.location && !alert.type) {
    return { success: false, error: 'يجب تحديد معيار واحد على الأقل للتنبيه' };
  }

  const { data, error } = await supabase
    .from('job_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) {
    return { success: false, error: toArabicError(error.message) };
  }

  revalidatePath('/job-alerts');
  return { success: true, data };
}

export async function deleteJobAlert(alertId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('job_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: toArabicError(error.message) };
  }

  revalidatePath('/job-alerts');
  return { success: true };
}

export async function toggleJobAlert(alertId: string, isActive: boolean) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('job_alerts')
    .update({ is_active: isActive })
    .eq('id', alertId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: toArabicError(error.message) };
  }

  revalidatePath('/job-alerts');
  return { success: true };
}
