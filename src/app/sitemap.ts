import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.staffps.com";

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
  ];

  return staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: page.priority,
  }));
}
