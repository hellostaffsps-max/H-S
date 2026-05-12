import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

export async function PUT(
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

  const { 
    name, 
    price, 
    features, 
    job_limit, 
    extra_job_price, 
    duration_days, 
    allow_articles, 
    featured_listings, 
    max_articles_per_month,
    allow_ads,
    is_active
  } = body;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('subscription_plans')
    .update({
      name,
      price,
      features,
      job_limit,
      extra_job_price,
      duration_days,
      allow_articles,
      featured_listings,
      max_articles_per_month,
      allow_ads,
      is_active
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.PLAN_UPDATE,
    target_type: 'plan',
    target_id: id,
    target_name: data?.name,
    details: { name, price },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'subscriptions_manage');
  if (guard) return guard;

  const { id } = await params;
  const supabase = await createClient();

  // Fetch plan name before deactivation
  const { data: planBefore } = await supabase.from('subscription_plans').select('name').eq('id', id).single();

  // Deactivate the plan instead of deleting to prevent breaking existing subscriptions
  const { error } = await supabase
    .from('subscription_plans')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.PLAN_DELETE,
    target_type: 'plan',
    target_id: id,
    target_name: planBefore?.name,
    details: {},
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, message: 'Plan deactivated successfully' });
}
