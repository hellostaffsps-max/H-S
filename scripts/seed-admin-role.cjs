const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lwfmnngfmnnoydpcnuox.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Zm1ubmdmbW5ub3lkcGNudW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk3NTM1NSwiZXhwIjoyMDkzNTUxMzU1fQ.nT51tZgu3g7k5S_5PMbl8OGcMjyPwx-HdjyT4oWwNoQ',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PERMISSIONS = [
  // Users
  { id: 'users_view', name_ar: 'عرض المستخدمين', category: 'users' },
  { id: 'users_create', name_ar: 'إنشاء مستخدم', category: 'users' },
  { id: 'users_edit', name_ar: 'تعديل مستخدم', category: 'users' },
  { id: 'users_delete', name_ar: 'حذف مستخدم', category: 'users' },
  // Jobs
  { id: 'jobs_view', name_ar: 'عرض الوظائف', category: 'jobs' },
  { id: 'jobs_edit', name_ar: 'تعديل وظيفة', category: 'jobs' },
  { id: 'jobs_delete', name_ar: 'حذف وظيفة', category: 'jobs' },
  { id: 'jobs_approve', name_ar: 'الموافقة على وظيفة', category: 'jobs' },
  // Articles
  { id: 'articles_view', name_ar: 'عرض المقالات', category: 'articles' },
  { id: 'articles_create', name_ar: 'إنشاء مقال', category: 'articles' },
  { id: 'articles_edit', name_ar: 'تعديل مقال', category: 'articles' },
  { id: 'articles_delete', name_ar: 'حذف مقال', category: 'articles' },
  // Subscriptions
  { id: 'subscriptions_view', name_ar: 'عرض الاشتراكات', category: 'subscriptions' },
  { id: 'subscriptions_manage', name_ar: 'إدارة الاشتراكات', category: 'subscriptions' },
  // Settings
  { id: 'settings_view', name_ar: 'عرض الإعدادات', category: 'settings' },
  { id: 'settings_edit', name_ar: 'تعديل الإعدادات', category: 'settings' },
  // Ads
  { id: 'ads_view', name_ar: 'عرض الإعلانات', category: 'ads' },
  { id: 'ads_approve', name_ar: 'الموافقة على إعلان', category: 'ads' },
  { id: 'ads_delete', name_ar: 'حذف إعلان', category: 'ads' },
  // Support
  { id: 'tickets_view', name_ar: 'عرض التذاكر', category: 'tickets' },
  { id: 'tickets_reply', name_ar: 'الرد على تذكرة', category: 'tickets' },
];

async function seed() {
  console.log('🛡️  Seeding admin roles and permissions...\n');

  // 1. Insert permissions (ignore duplicates)
  for (const perm of PERMISSIONS) {
    const { error } = await supabase
      .from('admin_permissions')
      .upsert(perm, { onConflict: 'id' });
    if (error) {
      console.log('  ❌ Permission', perm.id, ':', error.message);
    } else {
      console.log('  ✅ Permission:', perm.id);
    }
  }

  // 2. Create superadmin role if not exists
  const { data: existingRole } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('name', 'superadmin')
    .single();

  let roleId;
  if (existingRole) {
    roleId = existingRole.id;
    console.log('\n  ⏭️  Role "superadmin" already exists');
  } else {
    const { data: newRole, error: roleError } = await supabase
      .from('admin_roles')
      .insert({ name: 'superadmin', description: 'Full access to all admin features' })
      .select('id')
      .single();

    if (roleError || !newRole) {
      console.error('\n  ❌ Failed to create superadmin role:', roleError?.message);
      return;
    }
    roleId = newRole.id;
    console.log('\n  ✅ Created role: superadmin');
  }

  // 3. Assign all permissions to superadmin
  for (const perm of PERMISSIONS) {
    const { error } = await supabase
      .from('admin_role_permissions')
      .upsert(
        { role_id: roleId, permission_id: perm.id },
        { onConflict: 'role_id,permission_id' }
      );
    if (error) {
      console.log('  ❌ Permission link', perm.id, ':', error.message);
    }
  }
  console.log('  ✅ Linked all permissions to superadmin');

  // 4. Create moderator role (read-only + limited actions)
  const { data: modRole } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('name', 'moderator')
    .single();

  let modRoleId;
  if (modRole) {
    modRoleId = modRole.id;
    console.log('\n  ⏭️  Role "moderator" already exists');
  } else {
    const { data: newMod, error: modError } = await supabase
      .from('admin_roles')
      .insert({ name: 'moderator', description: 'Can view and moderate content, cannot change settings' })
      .select('id')
      .single();
    if (modError || !newMod) {
      console.error('  ❌ Failed to create moderator role:', modError?.message);
    } else {
      modRoleId = newMod.id;
      console.log('\n  ✅ Created role: moderator');
    }
  }

  if (modRoleId) {
    const modPerms = ['users_view', 'jobs_view', 'jobs_approve', 'articles_view', 'articles_edit', 'ads_view', 'ads_approve', 'tickets_view', 'tickets_reply'];
    for (const permId of modPerms) {
      await supabase.from('admin_role_permissions').upsert(
        { role_id: modRoleId, permission_id: permId },
        { onConflict: 'role_id,permission_id' }
      );
    }
    console.log('  ✅ Linked moderator permissions');
  }

  console.log('\n🎉 Admin roles seeding complete!');
  console.log('   Role IDs:');
  console.log('     superadmin:', roleId);
  if (modRoleId) console.log('     moderator: ', modRoleId);
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
