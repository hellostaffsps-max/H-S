'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function getProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data };
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const updates: Record<string, any> = {};
  const fields = ['full_name', 'phone', 'location'];
  fields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null) updates[field] = value;
  });

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  return { success: true, data };
}

export async function updateSeekerProfile(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const updates: Record<string, any> = {};
  const fields = ['job_title', 'bio', 'experience_years', 'is_available', 'skills', 'cv_url'];
  fields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null) {
      if (field === 'experience_years') {
        updates[field] = parseInt(value as string) || 0;
      } else if (field === 'is_available') {
        updates[field] = value === 'true';
      } else if (field === 'skills') {
        updates[field] = (value as string).split(',').map(s => s.trim());
      } else {
        updates[field] = value;
      }
    }
  });

  const { data, error } = await supabase
    .from('seekers')
    .upsert({ profile_id: user.id, ...updates })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  return { success: true, data };
}

export async function updateEmployerProfile(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const updates: Record<string, any> = {};
  const fields = [
    'company_name',
    'description',
    'logo_url',
    'business_type',
    'city',
    'area',
    'whatsapp_number',
    'business_email',
    'number_of_branches',
    'number_of_employees',
    'opening_hours',
    'cover_image_url',
    'application_preference',
    'show_whatsapp_to_candidates',
  ];

  fields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null) {
      if (field === 'number_of_branches') {
        updates[field] = parseInt(value as string) || 0;
      } else if (field === 'show_whatsapp_to_candidates') {
        updates[field] = value === 'true';
      } else {
        updates[field] = value;
      }
    }
  });

  const { data, error } = await supabase
    .from('employers')
    .upsert({ profile_id: user.id, ...updates })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  return { success: true, data };
}
