import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export interface AdminAuthResult {
  user: { id: string; email?: string } | null;
  profile: { role: string; full_name?: string; username?: string; admin_role_id?: string | null } | null;
  permissions: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  error?: string;
}

export async function verifyAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, profile: null, permissions: [], isAdmin: false, isSuperAdmin: false, error: 'Unauthorized' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, username, admin_role_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { user: null, profile: null, permissions: [], isAdmin: false, isSuperAdmin: false, error: 'Profile not found' };
    }

    if (profile.role !== 'admin') {
      return { user, profile, permissions: [], isAdmin: false, isSuperAdmin: false, error: 'Forbidden: Admin role required' };
    }

    const isSuperAdmin = profile.admin_role_id === null;
    let permissions: string[] = [];

    if (!isSuperAdmin) {
      // Fetch permissions for the specific role
      const { data: rolePerms } = await supabase
        .from('admin_role_permissions')
        .select('permission_id')
        .eq('role_id', profile.admin_role_id);
      
      permissions = rolePerms?.map(p => p.permission_id) || [];
    }

    return { user, profile, permissions, isAdmin: true, isSuperAdmin };
  } catch {
    return { user: null, profile: null, permissions: [], isAdmin: false, isSuperAdmin: false, error: 'Internal error' };
  }
}

export function adminGuard(result: AdminAuthResult, requiredPermission?: string): NextResponse | null {
  if (!result.isAdmin) {
    return NextResponse.json(
      { success: false, error: result.error || 'Unauthorized' },
      { status: result.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  if (requiredPermission && !result.isSuperAdmin && !result.permissions.includes(requiredPermission)) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  return null;
}
