'use server';

import { createClient } from '@/lib/supabase-server';

export async function submitContactForm(formData: FormData) {
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
    return { success: false, error: 'حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً' };
  }

  return { success: true };
}
