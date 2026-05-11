import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth);
  if (guard) return guard;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { status, renew } = body;

  if (!status || !['approved', 'rejected', 'pending', 'expired'].includes(status)) {
    return NextResponse.json(
      { success: false, error: 'Invalid status' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check existence
  const { data: existing } = await supabase
    .from('jobs')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
  }

  // Build update object
  const updateObj: any = { status };
  
  // If approving for the first time or renewing, set/reset expiry to 30 days from now
  if (status === 'approved' || renew) {
    updateObj.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(updateObj)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth);
  if (guard) return guard;

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('jobs').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Job deleted' });
}
