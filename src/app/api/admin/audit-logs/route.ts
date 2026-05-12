import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { getPagination, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();

  // Only super admins can view audit logs
  if (!auth.isAdmin || !auth.isSuperAdmin) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Super admin only' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, from, to } = getPagination(
    Number(searchParams.get('page') || '1'),
    Number(searchParams.get('limit') || '20')
  );

  const adminFilter = searchParams.get('admin_id');
  const actionFilter = searchParams.get('action');
  const targetTypeFilter = searchParams.get('target_type');

  const supabase = createAdminClient();
  let query = supabase
    .from('admin_audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (adminFilter) {
    query = query.eq('admin_id', adminFilter);
  }
  if (actionFilter) {
    query = query.eq('action', actionFilter);
  }
  if (targetTypeFilter) {
    query = query.eq('target_type', targetTypeFilter);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: data || [],
    ...createPaginatedResponse(data || [], page, limit, count || 0),
  });
}
