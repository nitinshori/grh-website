import type { Metadata } from "next";
import Link from "next/link";
import { SERVICE_PAGES } from "@/data/service-pages";

const BASE_URL = "https://getrealhealthpgd.co.uk";

export const metadata: Metadata = {
  title: "Pharmacy PGD Services | Wegovy, Mounjaro, TRT, HRT, Travel — Get Real Health",
  description:
    "Headline PGD services for UK community pharmacies — Wegovy, Mounjaro, TRT, HRT, and Travel Vaccinations. PGD, training, electronic consultation tool and clinical governance — all for £100 per pharmacy per month.",
  keywords: [
    "pharmacy PGD services",
    "Wegovy PGD",
    "Mounjaro PGD",
    "TRT PGD",
    "HRT PGD",
    "travel vaccination PGD",
    "UK pharmacy private services",
  ],
  alternates: { canonical: `${BASE_URL}/services` },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: `${BASE_URL}/services`,
    siteName: "Get Real Health",
    title: "Pharmacy PGD Services | Get Real Health",
    description:
      "PGD, training and ePGD tools for the highest-demand private pharmacy services. £100/month per pharmacy, all included.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Get Real Health services" }],
  },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Get Real Health — Pharmacy PGD Services",
  url: `${BASE_URL}/services`,
  description:
    "Headline PGD services for UK community pharmacies. Each service includes the PGD document, pharmacist training, electronic consultation tool and clinical governance pack.",
  hasPart: SERVICE_PAGES.map((p) => ({
    "@type": "Service",
    name: p.h1,
    description: p.description,
    url: `${BASE_URL}/services/${p.slug}`,
    category: p.category,
    provider: { "@type": "Organization", name: "Get Real Health", url: BASE_URL },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Services", item: `${BASE_URL}/services` },
  ],
};

export default function ServicesIndexPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="text-sm text-blue-200 mb-6">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white">Services</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Headline pharmacy PGD services
          </h1>
          <p className="text-lg text-blue-100 max-w-3xl">
            The highest-demand private services UK community pharmacies launch with — each one
            comes with the PGD document, pharmacist training, electronic consultation tool and the
            clinical governance pack. All for £100 per pharmacy per month, flat.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/onboard"
              className="inline-flex items-center justify-center bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Start onboarding
            </Link>
            <Link
              href="/for-pharmacies/pgd-catalogue"
              className="inline-flex items-center justify-center border border-blue-300 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              See all 70+ PGDs
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICE_PAGES.map((p) => (
            <Link
              key={p.slug}
              href={`/services/${p.slug}`}
              className="group block bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all"
            >
              <p className="text-xs uppercase tracking-wider text-teal-600 font-semibold mb-2">
                {p.category}
              </p>
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-700">
                {p.h1}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{p.drug}</p>
              <p className="text-sm text-gray-700 line-clamp-4">{p.subhead}</p>
              <p className="mt-4 text-sm font-semibold text-teal-700 group-hover:text-teal-800">
                Learn more →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            70+ PGDs included
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto mb-6">
            The five services above are our most-asked-about. The full catalogue covers
            men&apos;s and women&apos;s health, sexual health, weight management, dermatology,
            acute infection, respiratory, cardiovascular, mental health, vaccines, travel and
            paediatrics — every PGD included in the same flat monthly fee.
          </p>
          <Link
            href="/for-pharmacies/pgd-catalogue"
            className="inline-flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Browse the full PGD catalogue
          </Link>
        </div>
      </section>
    </>
  );
}
