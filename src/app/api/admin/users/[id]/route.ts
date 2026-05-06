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

  const { role } = body;

  if (!role || !['admin', 'seeker', 'employer'].includes(role)) {
    return NextResponse.json(
      { success: false, error: 'Invalid role' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check existence
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  // Prevent removing the last admin
  if (existing.role === 'admin' && role !== 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (count === 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot downgrade the last admin' },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
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

  // Prevent self-deletion
  if (auth.user?.id === id) {
    return NextResponse.json(
      { success: false, error: 'Cannot delete yourself' },
      { status: 403 }
    );
  }

  // Check existence
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  // Prevent deleting the last admin
  if (existing.role === 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (count === 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last admin' },
        { status: 403 }
      );
    }
  }

  // Delete from profiles (cascades to related tables via FK constraints)
  // NOTE: auth.users deletion requires a service-role Supabase client.
  // If SUPABASE_SERVICE_ROLE_KEY is available, use it here. Otherwise,
  // the auth user remains but their profile and data are removed.
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (profileError) {
    return NextResponse.json(
      { success: false, error: profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: 'User deleted' });
}
