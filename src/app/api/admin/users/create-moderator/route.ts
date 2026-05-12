import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, adminGuard } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin();
  const guard = adminGuard(auth, 'users:manage');
  if (guard) return guard;

  const { username, password, fullName, roleId } = await request.json();

  if (!username || !password || !fullName || !roleId) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Validate username format (alphanumeric, underscore, hyphen, 3-30 chars)
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, or hyphens' 
    }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Check if username is already taken
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (existingUser) {
    return NextResponse.json({ success: false, error: 'Username is already taken' }, { status: 409 });
  }

  // Generate a deterministic email from username for Supabase Auth
  const email = `${username}@admin.local`;

  // 1. Create the user in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, username }
  });

  if (authError) {
    return NextResponse.json({ success: false, error: authError.message }, { status: 500 });
  }

  // 2. Update the profile with role 'admin', username, and the specific admin_role_id
  const isSuper = roleId === 'super';
  
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ 
      full_name: fullName,
      username,
      role: 'admin',
      admin_role_id: isSuper ? null : roleId
    })
    .eq('id', authUser.user.id);

  if (profileError) {
    // If profile update fails, we might have an orphaned auth user.
    return NextResponse.json({ 
      success: false, 
      error: 'User created in Auth but profile update failed: ' + profileError.message 
    }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Moderator created successfully',
    data: { id: authUser.user.id, username, fullName }
  });
}
