import type { MetadataRoute } from "next";
import { patientCategories } from "@/data/patient-services";
import { articles } from "@/data/articles";

const BASE_URL = "https://getrealhealthpgd.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static pages
  // NOTE: /for-pharmacies/epgd/* are deliberately NOT included.
  // Those routes are the consultation tools used by registered
  // pharmacy professionals during patient sessions — they carry
  // robots: { index: false, follow: false } in their page metadata
  // and are blocked at robots.txt. They are NOT marketing landing
  // pages. If we want SEO landing pages per service, build them
  // separately under /services/<slug>.
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

  return [...staticPages, ...categoryPages, ...articlePages];
}
