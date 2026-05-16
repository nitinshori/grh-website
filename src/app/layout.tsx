import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { ChatWidget } from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "Get Real Health | PGD Services for UK Pharmacies",
    template: "%s | Get Real Health",
  },
  description:
    "UK pharmacy PGD provider. 70 PGDs, £100/month flat, no per-consult charges. Your patients. Your data. Your business.",
  keywords: [
    "PGD provider",
    "pharmacy PGD",
    "Patient Group Direction",
    "pharmacy private services",
    "travel clinic pharmacy",
    "weight management pharmacy",
    "UK pharmacy",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Get Real Health",
    url: "https://getrealhealthpgd.co.uk",
    title: "Get Real Health | PGD Services for UK Pharmacies",
    description:
      "70 PGDs. £100/month flat. No per-consult charges. CQC + HIW registered.",
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
    title: "Get Real Health | PGD Services for UK Pharmacies",
    description:
      "70 PGDs. £100/month flat. No per-consult charges. CQC + HIW registered.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Get Real Health",
  url: "https://getrealhealthpgd.co.uk",
  description:
    "UK pharmacy PGD provider. 70 PGDs, £100/month flat, no per-consult charges.",
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
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
          <ChatWidget />
          <GoogleAnalytics />
          <GoogleTagManager />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
