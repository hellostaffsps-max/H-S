import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

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

  const { verification_status, is_featured } = body;

  const supabase = createAdminClient();

  // Check existence and get current data
  const { data: existing } = await supabase
    .from('seekers')
    .select('profile_id, experience_years, cv_url, is_featured')
    .eq('profile_id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Seeker not found' }, { status: 404 });
  }

  // Handle featured toggle
  if (typeof is_featured === 'boolean') {
    if (is_featured) {
      // Validate: must have 6+ years experience
      if (!existing.experience_years || existing.experience_years < 6) {
        return NextResponse.json(
          { success: false, error: 'Cannot feature: employee must have 6+ years of experience' },
          { status: 400 }
        );
      }
      // Validate: must have CV uploaded
      if (!existing.cv_url) {
        return NextResponse.json(
          { success: false, error: 'Cannot feature: employee must have a CV uploaded' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = { is_featured };
    if (is_featured) {
      updateData.featured_at = new Date().toISOString();
      updateData.featured_by = auth.user?.id;
    } else {
      updateData.featured_at = null;
      updateData.featured_by = null;
    }

    const { data, error } = await supabase
      .from('seekers')
      .update(updateData)
      .eq('profile_id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const action = is_featured ? AuditActions.USER_FEATURE : AuditActions.USER_UNFEATURE;
    await logAdminAction({
      admin_id: auth.user?.id,
      admin_name: auth.profile?.full_name,
      admin_username: auth.profile?.username,
      action,
      target_type: 'user',
      target_id: id,
      target_name: data?.job_title,
      details: { is_featured, type: 'seeker' },
      ip_address: await getClientIP(),
    });

    return NextResponse.json({ success: true, data });
  }

  // Handle verification status update (existing logic)
  if (!verification_status || !['pending', 'verified', 'rejected'].includes(verification_status)) {
    return NextResponse.json(
      { success: false, error: 'Invalid verification_status. Must be pending, verified, or rejected' },
      { status: 400 }
    );
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

  const action = verification_status === 'verified' ? AuditActions.USER_VERIFY : AuditActions.USER_REJECT;
  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action,
    target_type: 'user',
    target_id: id,
    target_name: data?.full_name,
    details: { verification_status, type: 'seeker' },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, data });
}
