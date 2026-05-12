import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

export async function GET() {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'subscriptions_manage');
  if (guard) return guard;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.PLAN_CREATE,
    target_type: 'plan',
    target_id: (data as any)?.id,
    target_name: (data as any)?.name,
    details: { price: (data as any)?.price, duration_days: (data as any)?.duration_days },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'subscriptions_manage');
  if (guard) return guard;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
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
    allow_ads
  } = body;

  if (!name || price === undefined || !duration_days) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert([{
      name,
      price,
      features: features || [],
      job_limit: job_limit || 0,
      extra_job_price: extra_job_price || 0,
      duration_days: duration_days,
      allow_articles: allow_articles || false,
      featured_listings: featured_listings || false,
      max_articles_per_month: max_articles_per_month || 0,
      allow_ads: allow_ads || false,
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
