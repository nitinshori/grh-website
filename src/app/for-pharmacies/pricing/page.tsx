import type { Metadata } from "next";
import Link from "next/link";
import { SavingsCalculator } from "./SavingsCalculator";
import { FAQAccordion } from "./FAQAccordion";

export const metadata: Metadata = {
  title: "Pricing — £100/month per pharmacy",
  description:
    "£100 per pharmacy per month. All PGDs included. No per-consult charges. No hidden fees.",
};

const features = [
  "All PGDs included — 70 across every category",
  "Unlimited consultations — zero per-consult fees",
  "Platform access via web and mobile",
  "Online training with CPD certificates for every PGD",
  "Clinical support line (Mon–Fri, 09:00–17:00)",
  "Built-in appointment diary — no extra software",
  "Patient directory listing",
  "Marketing materials and seasonal campaign support",
  "Onboarding and dedicated setup call",
  "Per-store pricing — covers your whole team, including locums",
];

const faqs = [
  {
    q: "What’s included in the £100/month?",
    a: "Everything. The monthly fee covers all PGDs across every category, platform access, training, clinical support, patient directory listing, marketing materials, and a built-in appointment diary. No per-consultation fees, no per-PGD upcharges, no hidden charges.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No. £100 per pharmacy per month is the price. We do not charge per consultation, per patient, per service, or per PGD. VAT is added where applicable.",
  },
  {
    q: "How does pricing work if I have multiple pharmacies?",
    a: "£100 per pharmacy per month. So if you have 10 pharmacies, that’s £1,000/month. No setup fees, no platform surcharges. For larger networks (30+ sites), get in touch for custom pricing.",
  },
  {
    q: "Why do you charge per store instead of per pharmacist?",
    a: "Because it’s fairer. Many pharmacies have two pharmacists, use locums, or rotate staff. Per-pharmacist pricing means your costs go up every time you add cover. With GRH, one monthly fee per store covers everyone on your team — no surprises, no extra licences.",
  },
  {
    q: "How does your pricing compare to other PGD providers?",
    a: "Some providers charge per pharmacist — so if you have two pharmacists or use locums, your costs double. Others charge £2,639 per pharmacy per year (inc. VAT) upfront. GRH is £100/month per store — all pharmacists and locums included, all 70 PGDs, the ePGD platform, training, clinical support, onboarding, and a built-in appointment diary. Use the savings calculator above to compare.",
  },
  {
    q: "Can I cancel?",
    a: "It’s a minimum 12-month contract — standard for clinical service agreements. You can cancel at the end of your term with 30 days’ notice. All your consultation records remain accessible and exportable. They’re your data — you keep them.",
  },
];

// FAQ JSON-LD — gets cited verbatim by Google AI Overviews and ChatGPT Search.
// Mirrors the faqs array above so on-page content and structured data stay in sync.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

// Offer JSON-LD — gives AI engines a clean structured price + currency to quote.
const offerJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Get Real Health PGD Platform",
  description:
    "All-inclusive PGD platform for UK community pharmacies. 70 PGDs, ePGD consultation tool, training, appointment diary, clinical support.",
  brand: { "@type": "Brand", name: "Get Real Health" },
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
    eligibleRegion: [
      { "@type": "Country", name: "United Kingdom" },
    ],
    availability: "https://schema.org/InStock",
    url: "https://getrealhealthpgd.co.uk/for-pharmacies/pricing",
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerJsonLd) }}
      />
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl">
            One flat monthly fee per store &mdash; not per pharmacist. All PGDs
            included. Zero per-consult charges. No surprises.
          </p>
        </div>
      </section>

      {/* Single pricing card */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-2xl border-2 border-teal-400 shadow-lg ring-2 ring-teal-100 p-8 sm:p-10">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-500 text-white text-xs font-bold rounded-full">
            All-inclusive
          </span>

          <div className="text-center mb-8">
            <p className="text-5xl sm:text-6xl font-bold text-navy-900">
              &pound;100
            </p>
            <p className="text-gray-500 mt-1">per pharmacy / month</p>
            <p className="text-sm text-gray-400 mt-1">
              + VAT where applicable
            </p>
          </div>

          <ul className="space-y-3 mb-8 max-w-lg mx-auto">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <svg
                  className="w-4 h-4 text-teal-500 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700">{f}</span>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <Link
              href="/contact"
              className="inline-block px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              Get started
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            For networks of 30+ pharmacies,{" "}
            <Link href="/contact" className="underline">
              contact us
            </Link>{" "}
            for custom pricing.
          </p>
        </div>
      </section>

      {/* Why this matters callout */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-6">
          <h2 className="font-bold text-navy-900 mb-2">Our pricing principle</h2>
          <ul className="text-gray-700 leading-relaxed space-y-2">
            <li>
              <strong>Charged per store, not per pharmacist.</strong> One fee
              covers your whole team &mdash; locums, second pharmacists,
              everyone. No nasty surprises when staff change.
            </li>
            <li>
              <strong>Flat monthly fee per pharmacy.</strong> No
              per-consultation charges, no per-PGD upcharges, no hidden layers.
            </li>
            <li>
              <strong>All PGDs included.</strong> Travel vaccines, flu jabs, UTI,
              weight management &mdash; everything covered by one fee.
            </li>
            <li>
              <strong>Zero per-consultation fees ever.</strong> Other providers
              charge &pound;2,592&ndash;&pound;2,639 per pharmacy per year (inc.
              VAT), paid upfront. GRH is a simple &pound;100/month subscription.
            </li>
            <li>
              <strong>Appointment diary included.</strong> Built-in scheduling so
              your team can manage patient bookings &mdash; no extra software or
              bolt-on fees.
            </li>
          </ul>
        </div>
      </section>

      {/* Savings calculator */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2 text-center">
            How much could you save?
          </h2>
          <p className="text-gray-500 text-center mb-8 max-w-xl mx-auto">
            Compare your annual costs against other PGD providers. Your actual
            savings will vary depending on volume and services.
          </p>
          <SavingsCalculator />
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-navy-900 mb-8 text-center">
          Frequently asked questions
        </h2>
        <FAQAccordion faqs={faqs} />
      </section>
    </>
  );
}
