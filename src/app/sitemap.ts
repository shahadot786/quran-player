import type { MetadataRoute } from "next";
import { SURAHS } from "@/lib/surahs";
import { FEATURED_RECITER_IDS } from "@/lib/api/reciters";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://quran-player-gamma.vercel.app";
  const now = new Date();

  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/player`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/surahs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/reciters`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/library`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/stats`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const surahRoutes: MetadataRoute.Sitemap = SURAHS.map((surah) => ({
    url: `${siteUrl}/surahs/${surah.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const reciterRoutes: MetadataRoute.Sitemap = FEATURED_RECITER_IDS.map((id) => ({
    url: `${siteUrl}/reciters/${id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...coreRoutes, ...surahRoutes, ...reciterRoutes];
}
