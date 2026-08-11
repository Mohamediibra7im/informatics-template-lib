import type { MetadataRoute } from "next";
import { getDb } from "@/db";
import { categories, templates } from "@/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://itl-hub.vercel.app");

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contribute`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Add category pages
  try {
    const db = getDb();
    if (db) {
      const cats = await db.select({ slug: categories.slug }).from(categories);
      for (const cat of cats) {
        entries.push({
          url: `${baseUrl}/category/${cat.slug}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }

      const tmpls = await db
        .select({ slug: templates.slug, updatedAt: templates.updatedAt })
        .from(templates);
      for (const tmpl of tmpls) {
        entries.push({
          url: `${baseUrl}/template/${tmpl.slug}`,
          lastModified: tmpl.updatedAt ?? new Date(),
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // If DB unavailable, serve static-only sitemap
  }

  return entries;
}
