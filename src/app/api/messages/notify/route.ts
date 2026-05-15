import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { receiverId, content } = await req.json();
    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get sender name
    const { data: senderProfile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const senderName = senderProfile?.full_name || 'مستخدم';

    await adminClient.from('notifications').insert({
      user_id: receiverId,
      type: 'new_message',
      title: 'رسالة جديدة',
      message: `لديك رسالة جديدة من ${senderName}`,
      link: `/messages?with=${user.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Message notification error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
