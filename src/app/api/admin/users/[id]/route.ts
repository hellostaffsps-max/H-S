import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';
import { logAdminAction, getClientIP, AuditActions } from '@/lib/admin-audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'users:manage');
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

  const supabase = createAdminClient();

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

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.USER_UPDATE_ROLE,
    target_type: 'user',
    target_id: id,
    target_name: data?.full_name,
    details: { new_role: role },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'users:manage');
  if (guard) return guard;

  const { id } = await params;
  
  // Use Admin Client to ensure we can delete from auth.users and bypass RLS if needed
  const supabase = createAdminClient();

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
  const filesToDelete: { bucket: string; path: string }[] = [];

  function extractStoragePath(url: string | null | undefined, bucket: string): string | null {
    if (!url) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) return url.substring(idx + marker.length);
    const parts = url.split(`/${bucket}/`);
    return parts.length > 1 ? parts[parts.length - 1] : null;
  }

  const avatarPath = extractStoragePath(existing.avatar_url, 'avatars');
  if (avatarPath) filesToDelete.push({ bucket: 'avatars', path: avatarPath });

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

  const { data: seeker } = await supabase
    .from('seekers')
    .select('cv_url')
    .eq('profile_id', id)
    .single();

  if (seeker) {
    const cvPath = extractStoragePath(seeker.cv_url, 'resumes'); // Corrected bucket name to 'resumes' based on audit report
    if (cvPath) filesToDelete.push({ bucket: 'resumes', path: cvPath });
  }

  for (const file of filesToDelete) {
    try {
      await supabase.storage.from(file.bucket).remove([file.path]);
    } catch (e) {
      console.error(`Failed to delete storage file ${file.bucket}/${file.path}:`, e);
    }
  }

  // ── Delete from Auth (This is the critical missing step) ────────────
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  
  if (authError) {
    console.error('Auth deletion error:', authError);
    // If auth deletion fails, we should still try to delete the profile 
    // but the user might "reappear" if the auth record remains.
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

  await logAdminAction({
    admin_id: auth.user?.id,
    admin_name: auth.profile?.full_name,
    admin_username: auth.profile?.username,
    action: AuditActions.USER_DELETE,
    target_type: 'user',
    target_id: id,
    target_name: existing?.full_name,
    details: { role: existing?.role },
    ip_address: await getClientIP(),
  });

  return NextResponse.json({ success: true, message: 'User and associated files deleted permanently' });
}

