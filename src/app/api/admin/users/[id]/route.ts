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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { role } = body;

  if (!role || !['admin', 'seeker', 'employer'].includes(role)) {
    return NextResponse.json(
      { success: false, error: 'Invalid role' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Check existence
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  // Prevent removing the last admin
  if (existing.role === 'admin' && role !== 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (count === 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot downgrade the last admin' },
        { status: 403 }
      );
    }
  }

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

  // Check existence and fetch storage-related URLs
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role, avatar_url')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  // Prevent deleting the last admin
  if (existing.role === 'admin') {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (count === 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last admin' },
        { status: 403 }
      );
    }
  }

  // ── Storage Cleanup ─────────────────────────────────────────────────
  // Collect file paths to delete from various buckets
  const filesToDelete: { bucket: string; path: string }[] = [];

  // Helper: extract storage path from a full Supabase URL
  // e.g. "https://xxx.supabase.co/storage/v1/object/public/avatars/abc.jpg" → "abc.jpg"
  function extractStoragePath(url: string | null | undefined, bucket: string): string | null {
    if (!url) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) return url.substring(idx + marker.length);
    // Fallback: try last segment after bucket name
    const parts = url.split(`/${bucket}/`);
    return parts.length > 1 ? parts[parts.length - 1] : null;
  }

  // 1. Avatar from profiles
  const avatarPath = extractStoragePath(existing.avatar_url, 'avatars');
  if (avatarPath) filesToDelete.push({ bucket: 'avatars', path: avatarPath });

  // 2. Employer assets (logo, cover)
  const { data: employer } = await supabase
    .from('employers')
    .select('logo_url, cover_image_url')
    .eq('profile_id', id)
    .single();

  if (employer) {
    const logoPath = extractStoragePath(employer.logo_url, 'company-logos');
    if (logoPath) filesToDelete.push({ bucket: 'company-logos', path: logoPath });

    const coverPath = extractStoragePath(employer.cover_image_url, 'company-covers');
    if (coverPath) filesToDelete.push({ bucket: 'company-covers', path: coverPath });
  }

  // 3. Seeker CV file
  const { data: seeker } = await supabase
    .from('seekers')
    .select('cv_url')
    .eq('profile_id', id)
    .single();

  if (seeker) {
    const cvPath = extractStoragePath(seeker.cv_url, 'company-assets');
    if (cvPath) filesToDelete.push({ bucket: 'company-assets', path: cvPath });
  }

  // Delete all collected files (best-effort — don't block user deletion on failure)
  for (const file of filesToDelete) {
    try {
      await supabase.storage.from(file.bucket).remove([file.path]);
    } catch (e) {
      console.error(`Failed to delete storage file ${file.bucket}/${file.path}:`, e);
    }
  }

  // ── Delete Profile (cascades to related tables via FK constraints) ──
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (profileError) {
    return NextResponse.json(
      { success: false, error: profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: 'User and associated files deleted' });
}
