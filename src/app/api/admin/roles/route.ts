import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET() {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'roles:manage');
  if (guard) return guard;

  const supabase = createAdminClient();
  
  // Fetch roles with their permissions
  const { data: roles, error: rolesError } = await supabase
    .from('admin_roles')
    .select(`
      *,
      permissions:admin_role_permissions(permission_id)
    `)
    .order('created_at', { ascending: false });

  if (rolesError) {
    return NextResponse.json({ success: false, error: rolesError.message }, { status: 500 });
  }

  // Transform data for easier consumption
  const transformedRoles = roles?.map(role => ({
    ...role,
    permissions: role.permissions.map((p: any) => p.permission_id)
  }));

  return NextResponse.json({ success: true, data: transformedRoles });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'roles:manage');
  if (guard) return guard;

  const { name, description, permissions } = await request.json();

  if (!name) {
    return NextResponse.json({ success: false, error: 'Role name is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Create the role
  const { data: role, error: roleError } = await supabase
    .from('admin_roles')
    .insert({ name, description })
    .select()
    .single();

  if (roleError) {
    return NextResponse.json({ success: false, error: roleError.message }, { status: 500 });
  }

  // 2. Add permissions if provided
  if (permissions && Array.isArray(permissions) && permissions.length > 0) {
    const rolePermissions = permissions.map(pId => ({
      role_id: role.id,
      permission_id: pId
    }));

    const { error: permError } = await supabase
      .from('admin_role_permissions')
      .insert(rolePermissions);

    if (permError) {
      // Best effort: we created the role but failed to add perms. 
      // In a real system you might want a transaction.
      return NextResponse.json({ 
        success: true, 
        data: role, 
        warning: 'Role created but permissions failed to save: ' + permError.message 
      });
    }
  }

  return NextResponse.json({ success: true, data: role });
}
