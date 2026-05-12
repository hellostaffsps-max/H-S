import { NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'roles:manage');
  if (guard) return guard;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('admin_permissions')
    .select('*')
    .order('category', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
