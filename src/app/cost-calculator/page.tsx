import type { Metadata } from "next";
import Link from "next/link";
import { ComparisonCalculator } from "./ComparisonCalculator";

const BASE_URL = "https://getrealhealthpgd.co.uk";

export const metadata: Metadata = {
  title: "Cost Calculator — GRH vs Pharmadoctor vs ECG",
  description:
    "Enter your pharmacies and pharmacists, see how much you'd save with Get Real Health vs Pharmadoctor or ECG Training. Locums included — the line item that breaks per-pharmacist pricing.",
  keywords: [
    "Pharmadoctor alternative",
    "Pharmadoctor pricing comparison",
    "ECG Training alternative",
    "ECG pricing comparison",
    "pharmacy PGD cost",
    "PGD platform comparison UK",
    "locum PGD cost",
  ],
  alternates: { canonical: `${BASE_URL}/cost-calculator` },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: `${BASE_URL}/cost-calculator`,
    siteName: "Get Real Health",
    title: "How much would you save vs Pharmadoctor or ECG?",
    description:
      "Per-store pricing, locums included, no per-consult charges. Calculate the 3-year saving live.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GRH cost calculator" }],
  },
};

// ── Feature comparison table (no appointment diary, no patient booking page) ──
const features: { label: string; grh: string; pharmadoctor: string; ecg: string }[] = [
  {
    label: "Annual base licence per pharmacy",
    grh: "£1,200 (£100/month × 12)",
    pharmadoctor: "~£2,639 inc. VAT",
    ecg: "~£1,800–£2,400",
  },
  {
    label: "Locum cover",
    grh: "Included — all locums, no extra fee",
    pharmadoctor: "Per-pharmacist training fees apply",
    ecg: "Per-pharmacist training fees apply",
  },
  {
    label: "PGDs included",
    grh: "70+ across every category",
    pharmadoctor: "Tiered packages — pay for what you use",
    ecg: "Modular — individual PGDs sold separately",
  },
  {
    label: "ePGD consultation tool",
    grh: "Built in — included",
    pharmadoctor: "Included on most tiers",
    ecg: "Via Charac partnership (separate sign-up)",
  },
  {
    label: "Training + CPD certificates",
    grh: "Included — every PGD",
    pharmadoctor: "Charged separately, per pharmacist",
    ecg: "Charged separately, sold as bundles",
  },
  {
    label: "Per-consultation fees",
    grh: "None",
    pharmadoctor: "None on base packages",
    ecg: "None",
  },
  {
    label: "Clinical governance pack + SOPs",
    grh: "Included",
    pharmadoctor: "Included",
    ecg: "Included",
  },
  {
    label: "Audit-ready patient records",
    grh: "Exportable, kept indefinitely",
    pharmadoctor: "Stored on Pharmadoctor servers",
    ecg: "Held in partner platforms",
  },
  {
    label: "Custom PGD versioning (multi-site)",
    grh: "Per-pharmacy signed PDFs",
    pharmadoctor: "Limited",
    ecg: "Customer must manage on intranet",
  },
  {
    label: "Wegovy + Mounjaro PGDs",
    grh: "Included",
    pharmadoctor: "Per-service training fee",
    ecg: "Sold separately",
  },
  {
    label: "Onboarding",
    grh: "10-minute self-serve via /onboard",
    pharmadoctor: "Sales call + paperwork",
    ecg: "Sales call + paperwork",
  },
  {
    label: "Clinical authority",
    grh: "Dr Nitin Shori (NHS GP, ex-Pharmacy2U Medical Director, 10+ yrs)",
    pharmadoctor: "Clinical board",
    ecg: "Clinical board",
  },
  {
    label: "Regulatory cover (England + Wales)",
    grh: "CQC + HIW registered",
    pharmadoctor: "Yes",
    ecg: "Yes",
  },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Pharmacy PGD provider cost comparison: GRH vs Pharmadoctor vs ECG",
  author: { "@type": "Organization", name: "Get Real Health" },
  publisher: { "@type": "Organization", name: "Get Real Health", url: BASE_URL },
  description:
    "Side-by-side cost comparison of UK pharmacy PGD providers. Interactive calculator adjusts for store count and locum rotation.",
  mainEntityOfPage: `${BASE_URL}/cost-calculator`,
};

export default function CostCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="text-sm text-blue-200 mb-6">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white">Cost calculator</li>
            </ol>
          </nav>
          <p className="text-sm uppercase tracking-wider text-teal-300 font-semibold mb-3">
            Cost calculator
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            How much would you save vs Pharmadoctor or ECG?
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
            We charge £100 per pharmacy per month, flat. Every pharmacist on your team
            &mdash; locums included &mdash; is covered. Pharmadoctor and ECG don&apos;t
            work that way. Plug your numbers in below to see what that means in £.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <ComparisonCalculator />
        </div>
      </section>

      {/* Feature comparison */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Feature-by-feature comparison
        </h2>
        <p className="text-gray-600 mb-8 max-w-3xl">
          Based on publicly available pricing pages and customer-reported quotes as of May 2026.
          Where competitors don&apos;t publish exact figures, we&apos;ve used the mid-point of
          customer-reported ranges.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 uppercase tracking-wide text-xs">
                  &nbsp;
                </th>
                <th className="text-left px-4 py-3 font-bold text-teal-700 uppercase tracking-wide text-xs bg-teal-50">
                  Get Real Health
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 uppercase tracking-wide text-xs">
                  Pharmadoctor
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 uppercase tracking-wide text-xs">
                  ECG Training
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {features.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 align-top">{f.label}</td>
                  <td className="px-4 py-3 align-top bg-teal-50/50 text-gray-800">{f.grh}</td>
                  <td className="px-4 py-3 align-top text-gray-700">{f.pharmadoctor}</td>
                  <td className="px-4 py-3 align-top text-gray-700">{f.ecg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-4 max-w-3xl">
          Pricing references: Pharmadoctor &mdash; based on the £2,639 per pharmacy per year
          (inc. VAT) figure widely quoted by customers in 2025&ndash;26, plus per-pharmacist
          training fees on Wegovy/Mounjaro that customers report aggregating to ~£250 per
          pharmacist per year across services. ECG Training &mdash; based on their published
          modular PGD pricing plus training bundles. Both providers run multiple tiers; the
          figures above reflect what most single-site independent customers report paying.
          GRH figures are exact &mdash; £100 per pharmacy per month, all-in.
        </p>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            All your locums. Every PGD. £100 per store. Forever.
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            That&apos;s the headline. Onboard in 10 minutes, see your first private patient this week.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/onboard"
              className="inline-flex items-center justify-center bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Sign up now
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
    </>
  );
}
