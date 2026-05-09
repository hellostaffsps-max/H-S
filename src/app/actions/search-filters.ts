'use server';

import { createClient } from '@/lib/supabase-server';

/**
 * Fetch distinct job categories from the jobs table
 */
export async function getJobCategories(): Promise<string[]> {
  const hospitalityCategories = [
    "مطبخ / شيف",
    "خدمة طعام / جرسون",
    "بارستا / مقهى",
    "استقبال / ريسبشن",
    "تدبير فندقي / تنظيف",
    "إدارة فنادق",
    "محاسبة مطاعم",
    "أمن وحراسة",
    "صيانة عامة",
    "سائق / توصيل",
  ];

  const supabase = await createClient();
  const { data } = await supabase
    .from('jobs')
    .select('category')
    .not('category', 'is', null)
    .order('category');

  const dynamic = data ? data.map((d) => d.category).filter(Boolean) : [];
  const unique = [...new Set([...hospitalityCategories, ...dynamic])];
  return unique as string[];
}

/**
 * Fetch distinct seeker job titles
 */
export async function getSeekerJobTitles(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('seekers')
    .select('job_title')
    .not('job_title', 'is', null)
    .order('job_title');

  if (!data) return [];
  const unique = [...new Set(data.map((d) => d.job_title).filter(Boolean))];
  return unique as string[];
}

/**
 * Fetch distinct locations from jobs
 */
export async function getJobLocations(): Promise<string[]> {
  const palestineCities = [
    "رام الله",
    "نابلس",
    "الخليل",
    "بيت لحم",
    "جنين",
    "طولكرم",
    "قلقيلية",
    "أريحا",
    "سلفيت",
    "طوباس",
    "القدس",
  ];

  const supabase = await createClient();
  const { data } = await supabase
    .from('jobs')
    .select('location')
    .not('location', 'is', null)
    .order('location');

  const dynamic = data ? data.map((d) => d.location).filter(Boolean) : [];
  const unique = [...new Set([...palestineCities, ...dynamic])];
  return unique as string[];
}

/**
 * Fetch all search filter options at once (combined for efficiency)
 */
export async function getSearchFilters() {
  const [categories, seekerTitles, locations] = await Promise.all([
    getJobCategories(),
    getSeekerJobTitles(),
    getJobLocations(),
  ]);

  return { categories, seekerTitles, locations };
}
