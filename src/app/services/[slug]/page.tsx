import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICE_PAGES, getServicePage } from "@/data/service-pages";

const BASE_URL = "https://getrealhealthpgd.co.uk";

// Pre-render all known service pages at build time.
export function generateStaticParams() {
  return SERVICE_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) return { title: "Service not found" };

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: `${BASE_URL}/services/${page.slug}` },
    openGraph: {
      type: "website",
      locale: "en_GB",
      siteName: "Get Real Health",
      url: `${BASE_URL}/services/${page.slug}`,
      title: page.title,
      description: page.description,
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: page.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/og-image.png"],
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getServicePage(slug);
  if (!page) notFound();

  const pageUrl = `${BASE_URL}/services/${page.slug}`;

  // ── JSON-LD: Service ──────────────────────────────────────────────
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.h1,
    description: page.description,
    serviceType: "Patient Group Direction Service",
    category: page.category,
    provider: {
      "@type": "Organization",
      name: "Get Real Health",
      url: BASE_URL,
      areaServed: { "@type": "Country", name: "United Kingdom" },
    },
    areaServed: { "@type": "Country", name: "United Kingdom" },
    audience: {
      "@type": "Audience",
      audienceType: "UK community pharmacies and pharmacists",
    },
    offers: {
      "@type": "Offer",
      price: "100",
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "100",
        priceCurrency: "GBP",
        unitCode: "MON",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "C62" },
      },
      availability: "https://schema.org/InStock",
      url: pageUrl,
      eligibleRegion: [{ "@type": "Country", name: "United Kingdom" }],
    },
    url: pageUrl,
  };

  // ── JSON-LD: Product (for AI engines that prefer Product over Service) ──
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${page.h1} — by Get Real Health`,
    description: page.description,
    brand: { "@type": "Brand", name: "Get Real Health" },
    category: page.category,
    offers: {
      "@type": "Offer",
      price: "100",
      priceCurrency: "GBP",
      availability: "https://schema.org/InStock",
      url: pageUrl,
    },
  };

  // ── JSON-LD: FAQPage ──────────────────────────────────────────────
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // ── JSON-LD: BreadcrumbList ───────────────────────────────────────
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Services", item: `${BASE_URL}/services` },
      { "@type": "ListItem", position: 3, name: page.h1, item: pageUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="text-sm text-blue-200 mb-6">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/services" className="hover:text-white">Services</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white">{page.h1}</li>
            </ol>
          </nav>
          <p className="text-sm uppercase tracking-wider text-teal-300 font-semibold mb-3">
            {page.category} · {page.drug}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 leading-tight">
            {page.h1}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl">{page.subhead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/onboard"
              className="inline-flex items-center justify-center bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Start onboarding
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center border border-blue-300 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              See a demo
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <p className="text-lg text-gray-700 leading-relaxed">{page.intro}</p>
      </section>

      {/* What's included */}
      <section className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            What&apos;s included
          </h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {page.whatsIncluded.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-800">
                <svg
                  className="w-5 h-5 mt-1 flex-shrink-0 text-teal-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Differentiators */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Why pharmacists choose this PGD with Get Real Health
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {page.differentiators.map((d, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">{d.title}</h3>
              <p className="text-gray-700 leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            How it works
          </h2>
          <ol className="grid md:grid-cols-2 gap-6">
            {page.howItWorks.map((s, i) => (
              <li key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold text-sm">
                    {s.step}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Frequently asked questions
        </h2>
        <dl className="space-y-6">
          {page.faqs.map((f, i) => (
            <div key={i} className="border-b border-gray-200 pb-6">
              <dt className="text-lg font-semibold text-gray-900 mb-2">{f.q}</dt>
              <dd className="text-gray-700 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{page.ctaHeadline}</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">{page.ctaSubhead}</p>
          <div className="flex flex-wrap justify-center gap-3">
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
              See the full PGD catalogue
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
