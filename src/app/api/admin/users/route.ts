import { NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth);
  if (guard) return guard;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, avatar_url, phone, location, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
