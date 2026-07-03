import type { MetadataRoute } from "next";
import { patientCategories } from "@/data/patient-services";
import { articles } from "@/data/articles";
import { SERVICE_PAGES } from "@/data/service-pages";

const BASE_URL = "https://getrealhealthpgd.co.uk";

// Stable "site last reviewed" date. Using a fixed date (bumped when the
// marketing pages meaningfully change) instead of new Date() avoids sending
// Google a fresh lastModified on every deploy, which is a meaningless — and
// eventually distrusted — freshness signal. Article pages use their own
// publishDate below.
const SITE_UPDATED = "2026-07-01T00:00:00.000Z";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = SITE_UPDATED;

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
    { url: `${BASE_URL}/for-pharmacies/growth`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/for-patients`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/for-patients/find-service`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/onboard`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/services/comparison`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/cost-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/for-welsh-pharmacies`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Headline SEO landing pages — /services/<slug>. Distinct from the
  // /for-pharmacies/epgd/* consultation tools (which are noindex).
  const servicePages: MetadataRoute.Sitemap = SERVICE_PAGES.map((p) => ({
    url: `${BASE_URL}/services/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

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

  return [...staticPages, ...servicePages, ...categoryPages, ...articlePages];
}
