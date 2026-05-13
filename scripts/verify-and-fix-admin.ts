import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing env variables');
  process.exit(1);
}

const ADMIN_EMAIL = 'hellostaff.ps@gmail.com';
const ADMIN_PASSWORD = 'Admin@staff@2026';

async function verifyAndFix() {
  const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`🔍 Checking user: ${ADMIN_EMAIL}\n`);

  // 1. List users by email
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find(u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!existingUser) {
    console.error('❌ User NOT FOUND in Supabase Auth!');
    console.log('   The site may be connected to a different Supabase project.');
    console.log(`   Local project URL: ${supabaseUrl}`);
    console.log('   Check your hosting dashboard (Vercel/Netlify) for the correct SUPABASE_URL.');
    process.exit(1);
  }

  console.log('✅ User found in Auth!');
  console.log('   User ID:', existingUser.id);
  console.log('   Email:', existingUser.email);
  console.log('   Email confirmed:', existingUser.email_confirmed_at ? 'Yes' : 'No');
  console.log('   Created at:', existingUser.created_at);

  // 2. Check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', existingUser.id)
    .single();

  if (profile) {
    console.log('\n✅ Profile found:');
    console.log('   Role:', profile.role);
    console.log('   Full name:', profile.full_name);
  } else {
    console.log('\n⚠️  Profile NOT found in "profiles" table. Creating...');
    const { error: insertError } = await supabase.from('profiles').insert({
      id: existingUser.id,
      role: 'admin',
      full_name: 'Super Admin',
      email: ADMIN_EMAIL,
    });
    if (insertError) {
      console.error('❌ Failed to create profile:', insertError.message);
    } else {
      console.log('✅ Profile created!');
    }
  }

  // 3. Reset password to ensure it matches
  console.log('\n🔄 Resetting password to:', ADMIN_PASSWORD);
  const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password: ADMIN_PASSWORD,
  });

  if (updateError) {
    console.error('❌ Failed to update password:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Password updated successfully!');

  // 4. Verify login works
  console.log('\n🔑 Testing login...');
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (loginError) {
    console.error('❌ Login test FAILED:', loginError.message);
    process.exit(1);
  }

  console.log('✅ Login test PASSED! Everything looks good.');
  console.log('\n💡 If the live site still fails, it means the site connects to a DIFFERENT Supabase project.');
  console.log(`   Check your hosting provider for the correct Supabase URL vs local: ${supabaseUrl}`);
}

verifyAndFix().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
