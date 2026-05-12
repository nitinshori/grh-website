import type { MetadataRoute } from "next";

// Disallowed paths — apply identically to every crawler.
// /api/                       — server APIs, not user-facing content
// /_next/                     — Next.js build assets
// /for-pharmacies/epgd/       — pharmacist-facing consultation tools
//                               (not marketing pages; carry noindex)
// /for-pharmacies/dashboard   — authenticated partner area
// /admin/                     — admin console
// /login                      — auth entry
// /client/                    — per-client portals (private)
// /pharmacy-plus-health       — single-client resource hub
const DISALLOWED = [
  "/api/",
  "/_next/",
  "/for-pharmacies/epgd/",
  "/for-pharmacies/dashboard",
  "/admin/",
  "/login",
  "/client/",
  "/pharmacy-plus-health",
];

export default function robots(): MetadataRoute.Robots {
  // GRH WANTS to be discoverable by AI engines — pharmacy decision-makers
  // are increasingly using ChatGPT, Claude, Perplexity, and Google AI
  // Overviews for vendor discovery. Each AI crawler is named explicitly
  // (in addition to the wildcard fallback) so the intent is documented
  // and any future "default-deny AI" convention won't accidentally apply.
  const aiBots = [
    "GPTBot",          // OpenAI training crawler
    "OAI-SearchBot",   // OpenAI ChatGPT Search retrieval crawler
    "ChatGPT-User",    // Live browsing user-agent in ChatGPT
    "ClaudeBot",       // Anthropic training crawler
    "anthropic-ai",    // Anthropic retrieval crawler
    "Claude-Web",      // Anthropic browse / retrieval
    "PerplexityBot",   // Perplexity retrieval crawler
    "Google-Extended", // Google Gemini / AI Overviews training opt-in
    "Applebot-Extended", // Apple Intelligence training opt-in
    "CCBot",           // Common Crawl (feeds many AI engines)
    "Bytespider",      // ByteDance / Doubao
    "Amazonbot",       // Amazon Alexa / AI
  ];

  return {
    rules: [
      // Explicit allow rules for each AI bot.
      ...aiBots.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOWED,
      })),
      // Wildcard catches everything else (regular search engines, etc.)
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
    ],
    sitemap: "https://getrealhealthpgd.co.uk/sitemap.xml",
    host: "https://getrealhealthpgd.co.uk",
  };
}
