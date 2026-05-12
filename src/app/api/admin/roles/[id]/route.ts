import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

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

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.ROLE_UPDATE,
    target_type: 'role',
    target_id: id,
    target_name: name,
    details: { permissions },
    ip_address: await getClientIP(),
  });

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

  const { data: roleBefore } = await supabase.from('admin_roles').select('name').eq('id', id).single();

  const { error } = await supabase
    .from('admin_roles')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.ROLE_DELETE,
    target_type: 'role',
    target_id: id,
    target_name: roleBefore?.name,
    details: {},
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, message: 'Role deleted successfully' });
}
