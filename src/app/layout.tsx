import type { Metadata } from "next";
import "./globals.css";
import { HeaderShell } from "@/components/layout/HeaderShell";
import { FooterShell } from "@/components/layout/FooterShell";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  // Resolves all relative URLs (OG/Twitter images, per-page canonicals)
  // against the production domain instead of the Vercel deploy URL.
  metadataBase: new URL("https://getrealhealthpgd.co.uk"),
  title: {
    default: "Pharmacy PGD Provider | 60+ ePGDs, Flat Fee | Get Real Health",
    template: "%s | Get Real Health",
  },
  description:
    "UK pharmacy PGD provider. 60+ Patient Group Directions, £100/month flat, no per-consult charges. CQC + HIW registered. Includes training, ePGD tools and clinical governance.",
  keywords: [
    "pharmacy PGD provider",
    "PGD provider UK",
    "pharmacy PGD",
    "Patient Group Direction",
    "ePGD",
    "electronic PGD",
    "Wegovy PGD",
    "Mounjaro PGD",
    "weight management PGD",
    "TRT PGD",
    "HRT PGD",
    "travel vaccination PGD",
    "pharmacy private services",
    "pharmacy clinical governance",
    "UK pharmacy",
  ],
  // NOTE: no site-wide `alternates.canonical` here. A canonical set in the
  // root layout is inherited by every page that doesn't override it, which
  // previously pointed all pages at the homepage and told Google they were
  // duplicates. Canonicals are now set per page (relative to metadataBase).
  verification: {
    google: "Rdesn9BmMRZw8GTb5RG5xkFvgcDdkkOqx0xdR4vcdr0",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Get Real Health",
    url: "https://getrealhealthpgd.co.uk",
    title: "Pharmacy PGD Provider | 60+ ePGDs, Flat Fee | Get Real Health",
    description:
      "60+ PGDs. £100/month flat. No per-consult charges. CQC + HIW registered. Training, ePGD tools and clinical governance included.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Get Real Health — PGD platform for UK pharmacies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pharmacy PGD Provider | 60+ ePGDs, Flat Fee | Get Real Health",
    description:
      "60+ PGDs. £100/month flat. No per-consult charges. CQC + HIW registered.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Get Real Health",
  url: "https://getrealhealthpgd.co.uk",
  description:
    "UK pharmacy PGD provider. 60+ PGDs, £100/month flat, no per-consult charges.",
  areaServed: {
    "@type": "Country",
    name: "United Kingdom",
  },
  serviceType: "Patient Group Direction Services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <AuthSessionProvider>
          <HeaderShell />
          <main className="flex-1">{children}</main>
          <FooterShell />
          <CookieConsent />
          <ChatWidget />
          <GoogleAnalytics />
          <GoogleTagManager />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
