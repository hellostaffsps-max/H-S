import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth);
  if (guard) return guard;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('articles')
    .select(`
      *,
      profiles(full_name, role)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth);
  if (guard) return guard;

  const body = await request.json();
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

  return NextResponse.json({ success: true, data }, { status: 201 });
}
