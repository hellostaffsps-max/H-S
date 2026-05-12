import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'subscriptions_manage');
  if (guard) return guard;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { status, plan_id, plan_name } = body;

  const updates: Record<string, unknown> = {};

  if (status && ['active', 'rejected', 'pending', 'expired', 'canceled'].includes(status)) {
    updates.status = status;
    if (status === 'active') {
      updates.starts_at = new Date().toISOString();
      const supabase = await createClient();
      
      // Determine the plan ID to use
      let effectivePlanId = plan_id;
      if (!effectivePlanId) {
        const { data: currentSub } = await supabase
          .from('user_subscriptions')
          .select('plan_id')
          .eq('id', id)
          .single();
        effectivePlanId = currentSub?.plan_id;
      }

      if (effectivePlanId) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('duration_days')
          .eq('id', effectivePlanId)
          .single();
        if (plan?.duration_days) {
          const endsAt = new Date();
          endsAt.setDate(endsAt.getDate() + plan.duration_days);
          updates.ends_at = endsAt.toISOString();
        }
      }
    }
  }

  if (plan_id) updates.plan_id = plan_id;
  if (plan_name) updates.plan_name = plan_name;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'No valid fields to update' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check existence
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Subscription not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Create notification for user
  const { data: subWithUser } = await supabase
    .from('user_subscriptions')
    .select('user_id, plan_name')
    .eq('id', id)
    .single();

  if (subWithUser) {
    let title = 'تحديث حالة الاشتراك';
    let message = `تم تحديث حالة اشتراكك في باقة "${subWithUser.plan_name}" إلى: ${status === 'active' ? 'نشط' : status === 'rejected' ? 'مرفوض' : status}`;
    let type = status === 'active' ? 'success' : status === 'rejected' ? 'error' : 'info';

    try {
      const { createAdminClient } = await import('@/lib/supabase-admin');
      const adminClient = createAdminClient();
      await adminClient.from('notifications').insert({
        user_id: subWithUser.user_id,
        title,
        message,
        type,
        link: '/dashboard',
      });
    } catch (err) {
      console.error('Failed to create notification', err);
    }
  }

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.SUBSCRIPTION_UPDATE,
    target_type: 'subscription',
    target_id: id,
    target_name: data?.plan_name,
    details: { status: data?.status, plan_id: data?.plan_id },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, data });
}
