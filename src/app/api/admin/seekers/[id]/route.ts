import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'users:manage');
  if (guard) return guard;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { verification_status } = body;

  if (!verification_status || !['pending', 'verified', 'rejected'].includes(verification_status)) {
    return NextResponse.json(
      { success: false, error: 'Invalid verification_status. Must be pending, verified, or rejected' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // Check existence
  const { data: existing } = await supabase
    .from('seekers')
    .select('profile_id')
    .eq('profile_id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Seeker not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('seekers')
    .update({ verification_status })
    .eq('profile_id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
