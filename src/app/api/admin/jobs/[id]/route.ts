import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'jobs:manage');
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

  // Determine action type
  let action = AuditActions.JOB_UPDATE;
  if (status === 'approved') action = renew ? AuditActions.JOB_RENEW : AuditActions.JOB_APPROVE;
  else if (status === 'rejected') action = AuditActions.JOB_REJECT;

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action,
    target_type: 'job',
    target_id: id,
    target_name: data?.title,
    details: { status, renew, expires_at: data?.expires_at },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'jobs:manage');
  if (guard) return guard;

  const { id } = await params;
  const supabase = await createClient();

  // Fetch job title before deletion for audit log
  const { data: jobBefore } = await supabase.from('jobs').select('title').eq('id', id).single();

  const { error } = await supabase.from('jobs').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.JOB_DELETE,
    target_type: 'job',
    target_id: id,
    target_name: jobBefore?.title,
    details: {},
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, message: 'Job deleted' });
}
