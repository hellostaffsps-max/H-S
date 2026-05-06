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
  const body = await request.json();
  const { status, plan_id, plan_name } = body;

  const updates: Record<string, unknown> = {};

  if (status && ['active', 'rejected', 'pending', 'expired'].includes(status)) {
    updates.status = status;
    if (status === 'active') {
      updates.starts_at = new Date().toISOString();
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
