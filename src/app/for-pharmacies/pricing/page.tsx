import type { Metadata } from "next";
import Link from "next/link";
import { SavingsCalculator } from "./SavingsCalculator";
import { FAQAccordion } from "./FAQAccordion";

export const metadata: Metadata = {
  title: "Pricing \u2014 Simple, Transparent, No Surprises",
  description:
    "Flat annual fee. No per-consult charges. See our pricing tiers \u2014 no registration required. Compare with Pharmadoctor and ECG.",
};

const tiers = [
  {
    name: "Starter",
    pgds: "Up to 5 PGDs",
    price: "Contact us",
    highlighted: false,
    features: [
      "Platform access included",
      "Online training for all included PGDs",
      "Clinical support line (Mon\u2013Fri)",
      "Patient directory listing",
      "Marketing materials",
      "Zero per-consult fees \u2014 ever",
    ],
  },
  {
    name: "Growth",
    pgds: "Up to 20 PGDs",
    price: "Contact us",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Everything in Starter, plus:",
      "Up to 20 PGDs across any category",
      "Superintendent dashboard",
      "Seasonal campaign support",
      "Priority onboarding (24hr)",
      "Zero per-consult fees \u2014 ever",
    ],
  },
  {
    name: "Enterprise",
    pgds: "Unlimited PGDs",
    price: "Contact us",
    highlighted: false,
    features: [
      "Everything in Growth, plus:",
      "Unlimited PGDs across all categories",
      "Multi-branch superintendent overview",
      "Dedicated account manager",
      "Bespoke onboarding for your team",
      "Volume discount on training",
      "Zero per-consult fees \u2014 ever",
    ],
  },
];

const faqs = [
  {
    q: "Are there any hidden fees?",
    a: "No. The annual fee covers everything listed in your plan. We do not charge per consultation, per patient, per service, or per renewal of individual PGDs. The price you see is the price you pay.",
  },
  {
    q: "What happens when I want to add more PGDs?",
    a: "If you\u2019re on Starter and want more than 5 PGDs, you can upgrade to Growth at any time. We\u2019ll credit the remaining time on your current plan.",
  },
  {
    q: "Can I cancel?",
    a: "You can cancel at the end of your annual term. All your consultation records remain accessible and exportable. They\u2019re your data \u2014 you keep them.",
  },
  {
    q: "How does your pricing compare to Pharmadoctor?",
    a: "Pharmadoctor charges per consultation \u2014 the busier you get, the more you pay them. We charge one flat annual fee. Use the savings calculator above to see the difference based on your consultation volume.",
  },
  {
    q: "How does your pricing compare to ECG?",
    a: "ECG charges per PGD, per pharmacist, per year \u2014 plus a separate Charac subscription for the digital workflow. We charge one flat fee that covers everything: PGDs, platform, training, and support.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Simple, transparent pricing. No surprises.
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl">
            We show our prices here \u2014 no registration, no sales call, no
            pressure.
          </p>
        </div>
      </section>

      {/* Why this matters callout */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-6">
          <h2 className="font-bold text-navy-900 mb-2">Why this matters</h2>
          <p className="text-gray-700 leading-relaxed">
            Pharmadoctor doesn&apos;t show pricing without registration. ECG
            charges per PGD, per pharmacist, per year \u2014 plus Charac on top.
            We charge one flat annual fee and show it to you upfront. Because
            that&apos;s how we&apos;d want to be treated.
          </p>
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-xl border p-8 ${
                tier.highlighted
                  ? "border-teal-400 shadow-lg ring-2 ring-teal-100"
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-full">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold text-navy-900 mb-1">
                {tier.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{tier.pgds}</p>
              <p className="text-3xl font-bold text-navy-900 mb-6">
                {tier.price}
              </p>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f, i) => (
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
              <Link
                href="/contact"
                className={`block w-full text-center py-3 rounded-lg font-semibold text-sm transition-colors ${
                  tier.highlighted
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "bg-navy-900 hover:bg-navy-800 text-white"
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Savings calculator */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2 text-center">
            How much could you save?
          </h2>
          <p className="text-gray-500 text-center mb-8 max-w-xl mx-auto">
            Based on Pharmadoctor&apos;s published per-consultation pricing.
            Your actual savings will vary depending on volume and services.
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
