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

  // 1. Get regular messages where user is sender or receiver (RLS protected)
  const { data: regularMessages, error: regularError } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(full_name, avatar_url, role), receiver:profiles!receiver_id(full_name, avatar_url, role)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  // 2. Get broadcast messages (receiver_id IS NULL) using admin client to bypass RLS
  const { createAdminClient } = await import('@/lib/supabase-admin');
  const adminClient = createAdminClient();
  const { data: broadcastMessages, error: broadcastError } = await adminClient
    .from('messages')
    .select('*, sender:profiles!sender_id(full_name, avatar_url, role), receiver:profiles!receiver_id(full_name, avatar_url, role)')
    .is('receiver_id', null)
    .not('sender_id', 'is', null)
    .order('created_at', { ascending: false });

  if (regularError) {
    return { success: false, error: toArabicError(regularError.message), data: [] };
  }
  if (broadcastError) {
    console.error('Broadcast fetch error:', broadcastError);
  }

  // Merge and sort by created_at desc
  const allMessages = [
    ...(regularMessages || []),
    ...(broadcastMessages || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 200);

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

  allMessages?.forEach((msg: any) => {
    const isBroadcast = msg.receiver_id === null;
    const isMeSender = msg.sender_id === user.id;
    const partnerId = isBroadcast ? 'system-broadcasts' : (isMeSender ? msg.receiver_id : msg.sender_id);
    const partner = isMeSender ? msg.receiver : msg.sender;

    if (!conversationsMap.has(partnerId)) {
      conversationsMap.set(partnerId, {
        partnerId,
        partnerName: isBroadcast ? 'إعلانات النظام (تعميم)' : (partner?.full_name || 'مستخدم'),
        partnerAvatar: isBroadcast ? null : (partner?.avatar_url || null),
        partnerRole: isBroadcast ? 'system' : (partner?.role || null),
        lastMessage: msg.content,
        lastMessageAt: msg.created_at,
        unreadCount: !isBroadcast && !isMeSender && !msg.is_read ? 1 : 0,
      });
    } else {
      const conv = conversationsMap.get(partnerId)!;
      if (!isBroadcast && !isMeSender && !msg.is_read) {
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

  let data: any[] | null = null;
  let error: any = null;

  if (partnerId === 'system-broadcasts') {
    // Use admin client for broadcasts since RLS blocks receiver_id = null for regular users
    const { createAdminClient } = await import('@/lib/supabase-admin');
    const adminClient = createAdminClient();
    const result = await adminClient
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url)')
      .is('receiver_id', null)
      .not('sender_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(200);
    data = result.data;
    error = result.error;
  } else {
    const result = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(full_name, avatar_url)')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(200);
    data = result.data;
    error = result.error;
  }

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  // Mark messages as read — handle errors properly (except for broadcasts)
  if (partnerId !== 'system-broadcasts') {
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

  // Insert notification for the receiver
  try {
    const { createAdminClient } = await import('@/lib/supabase-admin');
    const adminClient = createAdminClient();
    
    // Get sender's name
    const { data: senderData } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
      
    const senderName = senderData?.full_name || 'مستخدم';
    
    await adminClient.from('notifications').insert({
      user_id: receiverId,
      type: 'new_message',
      title: 'رسالة جديدة',
      message: `لديك رسالة جديدة من ${senderName}`,
      link: `/messages?with=${user.id}`,
    });
  } catch (notifError) {
    console.error('Failed to create notification for message:', notifError);
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

  // Insert notification for the receiver
  try {
    const { createAdminClient } = await import('@/lib/supabase-admin');
    const adminClient = createAdminClient();
    
    // Get sender's name
    const { data: senderData } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
      
    const senderName = senderData?.full_name || 'مستخدم';
    
    await adminClient.from('notifications').insert({
      user_id: receiverId,
      type: 'new_message',
      title: 'رسالة جديدة',
      message: `لديك رسالة جديدة من ${senderName}`,
      link: `/messages?with=${user.id}`,
    });
  } catch (notifError) {
    console.error('Failed to create notification for message:', notifError);
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
