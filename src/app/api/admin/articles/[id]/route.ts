import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'articles:manage');
  if (guard) return guard;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, content, excerpt, cover_image, status } = body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (cover_image !== undefined) updates.cover_image = cover_image;
  if (status !== undefined) {
    const validStatuses = ['draft', 'pending_approval', 'published', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }
    updates.status = status;
    if (status === 'published') {
      updates.published_at = new Date().toISOString();
    } else if (status !== 'published') {
      updates.published_at = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: 'No valid fields to update' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check existence
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const action = data?.status === 'published' ? AuditActions.ARTICLE_PUBLISH : AuditActions.ARTICLE_UPDATE;
  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action,
    target_type: 'article',
    target_id: id,
    target_name: data?.title,
    details: { status: data?.status, slug: data?.slug },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'articles:manage');
  if (guard) return guard;

  const { id } = await params;
  const supabase = await createClient();

  const { data: articleBefore } = await supabase.from('articles').select('title').eq('id', id).single();

  const { error } = await supabase.from('articles').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.ARTICLE_DELETE,
    target_type: 'article',
    target_id: id,
    target_name: articleBefore?.title,
    details: {},
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, message: 'Article deleted' });
}
