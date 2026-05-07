'use server';

import { createClient } from '@/lib/supabase-server';
import { toArabicError } from '@/lib/error-messages';
import { revalidatePath } from 'next/cache';

/**
 * Save CV data (resume_data) to seekers table.
 * Uses UPDATE (not upsert) to avoid overwriting other seeker fields.
 */
export async function saveCVData(cvData: Record<string, any>) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' };
  }

  // Check if seeker record exists
  const { data: existing } = await supabase
    .from('seekers')
    .select('profile_id')
    .eq('profile_id', user.id)
    .single();

  let error;

  if (existing) {
    // Update only resume_data field
    const result = await supabase
      .from('seekers')
      .update({ resume_data: cvData })
      .eq('profile_id', user.id);
    error = result.error;
  } else {
    // Insert new seeker record with resume_data
    const result = await supabase
      .from('seekers')
      .insert({ profile_id: user.id, resume_data: cvData });
    error = result.error;
  }

  if (error) {
    console.error('CV save error:', error);
    return { success: false, error: toArabicError(error.message) };
  }

  revalidatePath('/profile');
  revalidatePath('/cv-builder');
  return { success: true };
}

/**
 * Request CV download (paid - 10 ILS).
 * Creates a subscription entry for admin review.
 */
export async function requestCVDownload(receiptUrl: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' };
  }

  // Check if there's already a pending or approved cv_download request
  const { data: existingRequest } = await supabase
    .from('user_subscriptions')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('plan_name', 'cv_download')
    .in('status', ['pending', 'active'])
    .limit(1)
    .single();

  if (existingRequest) {
    if (existingRequest.status === 'active') {
      return { success: true, approved: true };
    }
    return { success: false, error: 'لديك طلب تحميل قيد المراجعة بالفعل' };
  }

  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: user.id,
      plan_name: 'cv_download',
      payment_receipt_url: receiptUrl,
      status: 'pending',
    });

  if (error) {
    console.error('CV download request error:', error);
    return { success: false, error: toArabicError(error.message) };
  }

  return { success: true, approved: false };
}

/**
 * Check if user has an approved CV download.
 */
export async function checkCVDownloadStatus() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { canDownload: false, status: null };
  }

  const { data } = await supabase
    .from('user_subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .eq('plan_name', 'cv_download')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return { canDownload: false, status: null };
  }

  return {
    canDownload: data.status === 'active',
    status: data.status as string,
  };
}
