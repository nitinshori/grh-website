import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          // Pharmacist-facing tools and authenticated areas — never for
          // consumer search results
          "/for-pharmacies/epgd/",
          "/for-pharmacies/dashboard",
          "/admin/",
          "/login",
          "/client/",
          // Single-client resource hub
          "/pharmacy-plus-health",
        ],
      },
    ],
    sitemap: "https://www.getrealhealth.co.uk/sitemap.xml",
  };
}
