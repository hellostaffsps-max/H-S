import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';
import { getPagination, createPaginatedResponse } from '@/lib/pagination';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'articles:manage');
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const { page, limit, from, to } = getPagination(
    Number(searchParams.get('page') || '1'),
    Number(searchParams.get('limit') || '20')
  );

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      profiles(full_name, role)
    `)
    .order('created_at', { ascending: false })
    .range(from, to);

  const { count, error: countError } = await supabase
    .from('articles')
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

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'articles:manage');
  if (guard) return guard;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, content, excerpt, cover_image, status } = body;

  if (!title || !content) {
    return NextResponse.json(
      { success: false, error: 'Title and content are required' },
      { status: 400 }
    );
  }

  const slug = title
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, '-');

  const supabase = await createClient();

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return NextResponse.json(
      { success: false, error: 'An article with this title already exists' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('articles')
    .insert([{
      title,
      slug,
      content,
      excerpt: excerpt || null,
      cover_image: cover_image || null,
      status: status || 'published',
      author_id: auth.user!.id,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.ARTICLE_CREATE,
    target_type: 'article',
    target_id: data?.id,
    target_name: data?.title,
    details: { slug: data?.slug, status: data?.status },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, data }, { status: 201 });
}
