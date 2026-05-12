import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';
import { getPagination, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'jobs:manage');
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const { page, limit, from, to } = getPagination(
    Number(searchParams.get('page') || '1'),
    Number(searchParams.get('limit') || '20')
  );

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      employers(profile_id, company_name)
    `)
    .order('created_at', { ascending: false })
    .range(from, to);

  const { count, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });

  if (error || countError) {
    return NextResponse.json(
      { success: false, error: error?.message || countError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    ...createPaginatedResponse(data || [], page, limit, count || 0),
  });
}
