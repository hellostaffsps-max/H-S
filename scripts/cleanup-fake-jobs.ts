#!/usr/bin/env tsx
/**
 * Cleanup script: Delete fake / non-hospitality jobs
 *
 * Run: npx tsx scripts/cleanup-fake-jobs.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const FAKE_CATEGORIES = [
  'Driving', 'Maintenance', 'Accounting', 'Home Care',
  'Security', 'Cleaning', 'Sales', 'Marketing', 'IT',
  'Engineering', 'Teaching', 'Medical', 'Other',
  'محاسبة', 'صيانة', 'تكييف', 'سائق', 'سكرتارية',
  'مربية', 'تدريس', 'طب', 'تمريض', 'أمن', 'نظافة',
  'مبيعات', 'تسويق', 'هندسة', 'تقنية معلومات',
];

const TITLE_KEYWORDS = /سائق|محاسب|مربية|فني\s*تكييف|فني\s*صيانة|سكرتير|محامي|مهندس|معلم|طبيب|ممرض|أمن|نظافة|مبيعات|تسويق|driver|accountant|nanny|technician|maintenance|secretary|lawyer|engineer|teacher|doctor|nurse|security|cleaner|sales|marketing|private|villa|family/i;

const COMPANY_KEYWORDS = /عائلة|فيلا|منزل|بيت|خاص|شركة\s*الأندلس|مكتب\s*استشارات|شركة\s*صيانة|شركة\s*نظافة|شركة\s*أمن|مؤسسة|مصنع|مستشفى|عيادة|مدرسة|جامعة/i;

async function cleanup() {
  console.log('🧹 Cleaning up fake / non-hospitality jobs...\n');

  // 1. Fetch all jobs
  const { data: allJobs, error: fetchError } = await supabase
    .from('jobs')
    .select('id, title, category, company_name, status');

  if (fetchError) {
    console.error('❌ Failed to fetch jobs:', fetchError.message);
    process.exit(1);
  }

  if (!allJobs || allJobs.length === 0) {
    console.log('  ℹ️  No jobs found in database');
    return;
  }

  console.log(`  📊 Total jobs in DB: ${allJobs.length}`);

  // 2. Identify fake jobs
  const fakeJobIds: string[] = [];
  const hospitalityCategories = new Set([
    'طاهي/ة', 'نادل/ة', 'باريستا', 'كاشير', 'مدير', 'توصيل', 'مضيف/ة', 'أخرى',
    'chef', 'waiter', 'barista', 'cashier', 'manager', 'delivery', 'host',
    'kitchen_helper', 'restaurant_manager', 'other_hospitality',
    'مساعد مطبخ', 'مدير مطعم',
  ]);

  for (const job of allJobs) {
    const isFakeCategory = FAKE_CATEGORIES.includes(job.category);
    const isFakeTitle = TITLE_KEYWORDS.test(job.title);
    const isFakeCompany = COMPANY_KEYWORDS.test(job.company_name);
    const isNotHospitality = !hospitalityCategories.has(job.category);

    if (isFakeCategory || isFakeTitle || isFakeCompany || isNotHospitality) {
      fakeJobIds.push(job.id);
      console.log(`    🗑️  Marked for deletion: "${job.title}" (${job.company_name}) [${job.category}]`);
    }
  }

  if (fakeJobIds.length === 0) {
    console.log('\n  ✅ No fake jobs found. Database is clean!');
    return;
  }

  console.log(`\n  🗑️  Deleting ${fakeJobIds.length} fake jobs...`);

  // 3. Delete fake jobs (cascades to applications via FK)
  const { error: deleteError } = await supabase
    .from('jobs')
    .delete()
    .in('id', fakeJobIds);

  if (deleteError) {
    console.error('  ❌ Delete failed:', deleteError.message);
    process.exit(1);
  }

  // 4. Clean up orphaned notifications
  const { error: notifError } = await supabase
    .from('notifications')
    .delete()
    .or('message.ilike.%سائق%,message.ilike.%محاسب%,message.ilike.%مربية%,message.ilike.%فني تكييف%,message.ilike.%صيانة%,message.ilike.%عائلة%,message.ilike.%فيلا%,message.ilike.%شركة الأندلس%');

  if (notifError) {
    console.warn('  ⚠️  Notification cleanup warning:', notifError.message);
  }

  console.log(`\n  ✅ Deleted ${fakeJobIds.length} fake jobs successfully!`);

  // 5. Show remaining real jobs
  const { data: remaining } = await supabase
    .from('jobs')
    .select('id, title, company_name, category, status')
    .order('created_at', { ascending: false });

  console.log(`\n  📋 Remaining jobs: ${remaining?.length || 0}`);
  for (const job of remaining || []) {
    const statusBadge = job.status === 'approved' ? '✅' : '⏳';
    console.log(`    ${statusBadge} ${job.title} — ${job.company_name} (${job.category})`);
  }
}

cleanup().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
