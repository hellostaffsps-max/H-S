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
  console.error('   You need the service role key to create an admin user.');
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

async function createAdmin() {
  const email = await ask('Admin email: ');
  const password = await ask('Admin password: ');
  const fullName = await ask('Admin full name (default: Super Admin): ') || 'Super Admin';
  rl.close();

  if (!email || !password) {
    console.error('❌ Email and password are required');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`\n🚀 Creating admin user: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
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
      full_name: fullName,
    });

  if (profileError) {
    console.error('❌ Error creating profile:', profileError.message);
    process.exit(1);
  }

  console.log('✅ Admin user created successfully!');
  console.log('   User ID:', data.user.id);
  console.log('   Email:', email);
}

createAdmin().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
