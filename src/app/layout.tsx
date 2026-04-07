import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/legal/CookieConsent";

export const metadata: Metadata = {
  title: {
    default: "Get Real Health | PGD Services for UK Pharmacies",
    template: "%s | Get Real Health",
  },
  description:
    "UK pharmacy PGD provider. 60+ services, flat annual fee, no per-consult charges. Your patients. Your data. Your business.",
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
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Get Real Health",
  url: "https://www.getrealhealth.co.uk",
  description:
    "UK pharmacy PGD provider. 60+ services, flat annual fee, no per-consult charges.",
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
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
