import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('   You need the service role key to create an admin user.');
  console.error('   Get it from: Supabase Dashboard > Project Settings > API > service_role key');
  process.exit(1);
}

const ADMIN_EMAIL = 'hellostaff.ps@gmail.com';
const ADMIN_PASSWORD = 'Admin@staff@2026';
const ADMIN_FULL_NAME = 'Super Admin';

async function createSuperAdmin() {
  const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`\n🚀 Creating super admin user: ${ADMIN_EMAIL}`);

  // Check if user already exists by email
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (existingProfile) {
    console.log('⚠️  A profile with this email already exists. Updating role to admin...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin', full_name: ADMIN_FULL_NAME })
      .eq('id', existingProfile.id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
      process.exit(1);
    }
    console.log('✅ Profile updated to admin!');
    console.log('   User ID:', existingProfile.id);
    console.log('   Email:', ADMIN_EMAIL);
    console.log('\n⚠️  Note: Password was NOT changed. Use the existing password or reset it via Supabase Dashboard.');
    return;
  }

  // Create new admin user in Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: ADMIN_FULL_NAME,
      role: 'admin',
    },
  });

  if (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }

  if (!data.user) {
    console.error('❌ User not created');
    process.exit(1);
  }

  // Insert into profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: data.user.id,
      role: 'admin',
      full_name: ADMIN_FULL_NAME,
      email: ADMIN_EMAIL,
    });

  if (profileError) {
    console.error('❌ Error creating profile:', profileError.message);
    process.exit(1);
  }

  console.log('✅ Super Admin user created successfully!');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Password:', ADMIN_PASSWORD);
}

createSuperAdmin().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
