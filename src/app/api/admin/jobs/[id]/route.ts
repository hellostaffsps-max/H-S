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
  const { status } = body;

  if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json(
      { success: false, error: 'Invalid status' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .update({ status })
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
