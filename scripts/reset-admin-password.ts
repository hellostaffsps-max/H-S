import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';

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
  console.error('   You need the service role key to reset an admin password.');
  console.error('   Get it from: Supabase Dashboard > Project Settings > API > service_role key');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function resetAdminPassword() {
  const email = await ask('Admin email: ');
  const newPassword = await ask('New password (min 8 chars): ');
  rl.close();

  if (!email || !newPassword) {
    console.error('❌ Email and password are required');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Find user by email
  console.log(`\n🔍 Looking up user: ${email}`);
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    process.exit(1);
  }

  const user = userList.users.find((u) => u.email === email);

  if (!user) {
    console.error(`❌ User with email "${email}" not found in Auth.`);
    console.error('   You may need to create the admin first using: npx tsx scripts/create-admin.ts');
    process.exit(1);
  }

  console.log(`✅ Found user (ID: ${user.id})`);

  // Reset password
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error('❌ Error resetting password:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Password reset successfully!');
  console.log(`   You can now log in at: ${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/login`);
}

resetAdminPassword().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
