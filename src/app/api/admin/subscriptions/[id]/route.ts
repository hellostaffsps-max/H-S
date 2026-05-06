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

  const { status, plan_id, plan_name } = body;

  const updates: Record<string, unknown> = {};

  if (status && ['active', 'rejected', 'pending', 'expired', 'canceled'].includes(status)) {
    updates.status = status;
    if (status === 'active') {
      updates.starts_at = new Date().toISOString();
      // Compute ends_at based on plan duration
      const supabase = await createClient();
      if (plan_id) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('duration_days')
          .eq('id', plan_id)
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

  return NextResponse.json({ success: true, data });
}
