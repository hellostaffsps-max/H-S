'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { toArabicError } from '@/lib/error-messages';

export async function getConversations() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: [] };
  }

  // Get all messages where user is sender or receiver
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(full_name, avatar_url, role), receiver:profiles!receiver_id(full_name, avatar_url, role)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return { success: false, error: toArabicError(error.message), data: [] };
  }

  // Group by conversation partner
  const conversationsMap = new Map<string, {
    partnerId: string;
    partnerName: string;
    partnerAvatar: string | null;
    partnerRole: string | null;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
  }>();

  messages?.forEach((msg: any) => {
    const isMeSender = msg.sender_id === user.id;
    const partnerId = isMeSender ? msg.receiver_id : msg.sender_id;
    const partner = isMeSender ? msg.receiver : msg.sender;

    if (!conversationsMap.has(partnerId)) {
      conversationsMap.set(partnerId, {
        partnerId,
        partnerName: partner?.full_name || 'مستخدم',
        partnerAvatar: partner?.avatar_url || null,
        partnerRole: partner?.role || null,
        lastMessage: msg.content,
        lastMessageAt: msg.created_at,
        unreadCount: !isMeSender && !msg.is_read ? 1 : 0,
      });
    } else {
      const conv = conversationsMap.get(partnerId)!;
      if (!isMeSender && !msg.is_read) {
        conv.unreadCount++;
      }
    }
  });

  const data = Array.from(conversationsMap.values());

  return { success: true, data };
}

export async function getMessages(partnerId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized', data: [] };
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(full_name, avatar_url)')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  // Mark messages as read — handle errors properly
  const { error: updateError } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', partnerId)
    .eq('is_read', false);

  if (updateError) {
    console.error('Failed to mark messages as read:', updateError);
    // Don't fail the whole request; just log the error
  }

  return { success: true, data: data || [] };
}

export async function sendMessage(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' };
  }

  // Rate limit: 10 messages per minute
  const rateLimitResult = await checkRateLimit(`msg:${user.id}`, 10, 60 * 1000);
  if (!rateLimitResult.success) {
    return { success: false, error: 'لقد تجاوزت الحد المسموح لإرسال الرسائل، انتظر دقيقة' };
  }

  const receiverId = formData.get('receiver_id') as string;
  const content = (formData.get('content') as string)?.trim();
  const title = (formData.get('title') as string)?.trim() || null;

  if (!receiverId || !content) {
    return { success: false, error: 'البيانات غير كاملة' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      title,
      content,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: toArabicError(error.message) };
  }

  revalidatePath('/messages');
  return { success: true, data };
}

export async function sendMessageToUser(receiverId: string, content: string, title?: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'يجب تسجيل الدخول أولاً' };
  }

  // Rate limit: 10 messages per minute
  const rateLimitResult = await checkRateLimit(`msg:${user.id}`, 10, 60 * 1000);
  if (!rateLimitResult.success) {
    return { success: false, error: 'لقد تجاوزت الحد المسموح لإرسال الرسائل، انتظر دقيقة' };
  }

  if (!receiverId || !content.trim()) {
    return { success: false, error: 'البيانات غير كاملة' };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      title: title || null,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/messages');
  return { success: true, data };
}

export async function getUnreadMessagesCount() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, count: 0 };
  }

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('is_read', false);

  if (error) {
    return { success: false, count: 0 };
  }

  return { success: true, count: count || 0 };
}
