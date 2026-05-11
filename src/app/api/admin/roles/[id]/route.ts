import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'roles:manage');
  if (guard) return guard;

  const { id } = await params;
  const { name, description, permissions } = await request.json();

  const supabase = createAdminClient();

  // 1. Update role info
  const { error: roleError } = await supabase
    .from('admin_roles')
    .update({ name, description })
    .eq('id', id);

  if (roleError) {
    return NextResponse.json({ success: false, error: roleError.message }, { status: 500 });
  }

  // 2. Sync permissions (Delete old, Insert new)
  if (permissions && Array.isArray(permissions)) {
    // Delete existing
    await supabase
      .from('admin_role_permissions')
      .delete()
      .eq('role_id', id);

    // Insert new
    if (permissions.length > 0) {
      const rolePermissions = permissions.map(pId => ({
        role_id: id,
        permission_id: pId
      }));

      const { error: permError } = await supabase
        .from('admin_role_permissions')
        .insert(rolePermissions);

      if (permError) {
        return NextResponse.json({ success: false, error: 'Failed to sync permissions: ' + permError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true, message: 'Role updated successfully' });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'roles:manage');
  if (guard) return guard;

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('admin_roles')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Role deleted successfully' });
}
