import type { MetadataRoute } from "next";
import { createClient } from '@supabase/supabase-js';

// Using standard supabase client for build-time / server-side static generation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.staffps.com";

  // Static pages
  const staticPages = [
    { path: "", priority: 1.0 },
    { path: "/jobs", priority: 0.9 },
    { path: "/blog", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/pricing", priority: 0.8 },
    { path: "/cv-builder", priority: 0.7 },
    { path: "/interview-tips", priority: 0.6 },
    { path: "/help", priority: 0.5 },
    { path: "/terms", priority: 0.4 },
    { path: "/privacy", priority: 0.4 },
    { path: "/cookies", priority: 0.4 },
    { path: "/auth/login", priority: 0.3 },
    { path: "/auth/signup", priority: 0.3 },
    { path: "/search-resumes", priority: 0.8 },
    { path: "/post-job", priority: 0.8 },
  ].map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: page.priority,
  }));

  // Fetch dynamic active jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, updated_at, published_at")
    .eq("status", "approved")
    .is("deleted_at", null);

  const jobPages = (jobs || []).map((job) => ({
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: new Date(job.updated_at || job.published_at || Date.now()),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Fetch dynamic published articles
  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at, created_at")
    .eq("status", "published");

  const articlePages = (articles || []).map((article) => ({
    url: `${baseUrl}/blog/${article.slug}`,
    lastModified: new Date(article.updated_at || article.created_at || Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...jobPages, ...articlePages];
}
