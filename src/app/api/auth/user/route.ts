import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch role from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: profile?.role ?? null,
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
  });
}
