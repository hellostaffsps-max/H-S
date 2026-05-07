'use server';

import { createClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { toArabicError } from '@/lib/error-messages';

export async function submitContactForm(formData: FormData) {
  // Rate limit: 3 submissions per 15 minutes per IP
  const rateLimitResult = await checkRateLimit('contact', 3, 15 * 60 * 1000);
  if (!rateLimitResult.success) {
    return { success: false, error: 'لقد تجاوزت الحد المسموح، يرجى المحاولة بعد 15 دقيقة' };
  }

  const supabase = await createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  if (!name || !email || !subject || !message) {
    return { success: false, error: 'جميع الحقول مطلوبة' };
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'البريد الإلكتروني غير صالح' };
  }

  // Honeypot: if a hidden "website" field is filled, reject (bot detection)
  const honeypot = formData.get('website') as string;
  if (honeypot) {
    // Silently succeed to not alert the bot
    return { success: true };
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      sender_id: null,
      receiver_id: null,
      title: `تواصل: ${subject} - من ${name} (${email})`,
      content: message,
    });

  if (error) {
    console.error('Contact form error:', error);
    return { success: false, error: toArabicError(error.message) };
  }

  return { success: true };
}
