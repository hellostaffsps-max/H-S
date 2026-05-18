'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { profileSchema, seekerProfileSchema, employerProfileSchema, formatZodError } from '@/lib/validation';

export async function getProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, avatar_url, phone, location, email, created_at, username')
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

  const raw = {
    full_name: formData.get('full_name') as string | null,
    phone: formData.get('phone') as string | null,
    location: formData.get('location') as string | null,
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
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

  const raw = {
    job_title: formData.get('job_title') as string | null,
    bio: formData.get('bio') as string | null,
    experience_years: formData.get('experience_years') ? parseInt(formData.get('experience_years') as string) : null,
    is_available: formData.get('is_available') === 'true',
    skills: formData.get('skills') ? (formData.get('skills') as string).split(',').map(s => s.trim()) : [],
    cv_url: formData.get('cv_url') as string | null,
  };

  const parsed = seekerProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const { data, error } = await supabase
    .from('seekers')
    .upsert({ profile_id: user.id, ...parsed.data })
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

  const raw: Record<string, any> = {
    company_name: formData.get('company_name') as string | null,
    description: formData.get('description') as string | null,
    logo_url: formData.get('logo_url') as string | null,
    business_type: formData.get('business_type') as string | null,
    city: formData.get('city') as string | null,
    area: formData.get('area') as string | null,
    whatsapp_number: formData.get('whatsapp_number') as string | null,
    business_email: formData.get('business_email') as string | null,
    number_of_branches: formData.get('number_of_branches') ? parseInt(formData.get('number_of_branches') as string) : null,
    number_of_employees: formData.get('number_of_employees') ? parseInt(formData.get('number_of_employees') as string) : null,
    opening_hours: formData.get('opening_hours') as string | null,
    cover_image_url: formData.get('cover_image_url') as string | null,
    application_preference: formData.get('application_preference') as string | null,
    show_whatsapp_to_candidates: formData.get('show_whatsapp_to_candidates') === 'true',
  };

  const parsed = employerProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const { data, error } = await supabase
    .from('employers')
    .upsert({ profile_id: user.id, ...parsed.data })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  return { success: true, data };
}
