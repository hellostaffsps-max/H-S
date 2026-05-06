import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/profile/", "/messages/"],
    },
    sitemap: "https://www.staffps.com/sitemap.xml",
  };
}
