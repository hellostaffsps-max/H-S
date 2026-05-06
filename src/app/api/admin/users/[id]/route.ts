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
  const { role } = body;

  if (!role || !['admin', 'seeker', 'employer'].includes(role)) {
    return NextResponse.json(
      { success: false, error: 'Invalid role' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
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

  // Delete from auth (requires admin client)
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) {
    return NextResponse.json({ success: false, error: authError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'User deleted' });
}
