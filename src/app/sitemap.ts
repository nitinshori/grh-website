import type { MetadataRoute } from "next";
import { patientCategories } from "@/data/patient-services";
import { articles } from "@/data/articles";
import { pgds } from "@/data/pgds";

const BASE_URL = "https://getrealhealthpgd.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/for-pharmacies`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/for-pharmacies/pgd-catalogue`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/for-pharmacies/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/for-pharmacies/platform`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/for-patients`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/for-patients/find-service`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/onboard`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/book`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Patient category pages
  const categoryPages: MetadataRoute.Sitemap = patientCategories.map((cat) => ({
    url: `${BASE_URL}/for-patients/${cat.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Article pages
  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/resources/${article.slug}`,
    lastModified: article.publishDate,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // ePGD landing pages — high-intent keywords like "Wegovy PGD UK pharmacy"
  // each map to a dedicated page; surfacing them in the sitemap gives Google
  // 60+ topical landing pages instead of one mega-catalogue.
  const epgdPages: MetadataRoute.Sitemap = pgds
    .filter((p) => !p.comingSoon)
    .map((p) => ({
      url: `${BASE_URL}/for-pharmacies/epgd/${p.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...categoryPages, ...articlePages, ...epgdPages];
}
