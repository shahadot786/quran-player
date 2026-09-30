import type { MetadataRoute } from "next";
import { SURAHS } from "@/lib/surahs";
import { FEATURED_RECITER_IDS } from "@/lib/api/reciters";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/player`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/surahs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/reciters`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/stats`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const surahRoutes: MetadataRoute.Sitemap = SURAHS.map((surah) => ({
    url: `${SITE_URL}/surahs/${surah.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const reciterRoutes: MetadataRoute.Sitemap = FEATURED_RECITER_IDS.map((id) => ({
    url: `${SITE_URL}/reciters/${id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...coreRoutes, ...surahRoutes, ...reciterRoutes];
}
