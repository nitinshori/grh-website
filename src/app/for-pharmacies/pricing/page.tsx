import type { Metadata } from "next";
import Link from "next/link";
import { SavingsCalculator } from "./SavingsCalculator";
import { FAQAccordion } from "./FAQAccordion";

export const metadata: Metadata = {
  title: "Pricing \u2014 Request a Quote",
  description:
    "Flat annual fee. No per-consult charges. Get in touch for a quote on our Starter, Growth, and Enterprise tiers.",
};

const tiers = [
  {
    name: "Single Site",
    pgds: "1\u20135 pharmacies",
    price: "£125",
    priceSubtitle: "/pharmacy/month",
    highlighted: false,
    features: [
      "All PGDs included",
      "Platform access",
      "Online training for all PGDs",
      "Clinical support (Mon\u2013Fri)",
      "Patient directory listing",
      "Marketing materials",
      "Zero per-consult fees \u2014 ever",
    ],
  },
  {
    name: "Group",
    pgds: "6\u201315 pharmacies",
    price: "£109",
    priceSubtitle: "/pharmacy/month",
    highlighted: true,
    badge: "Most popular",
    features: [
      "All PGDs included",
      "Everything in Single Site, plus:",
      "Superintendent dashboard",
      "Seasonal campaign support",
      "Priority onboarding (24hr)",
      "Dedicated onboarding call",
      "Save up to £192/pharmacy vs Single Site",
    ],
  },
  {
    name: "Enterprise",
    pgds: "16\u201330 pharmacies",
    price: "£99",
    priceSubtitle: "/pharmacy/month",
    highlighted: false,
    features: [
      "All PGDs included",
      "Everything in Group, plus:",
      "Multi-branch superintendent overview",
      "Dedicated account manager",
      "Bespoke onboarding",
      "Custom integrations",
    ],
  },
  {
    name: "Network",
    pgds: "30+ pharmacies",
    price: "Custom",
    priceSubtitle: "Contact us",
    highlighted: false,
    features: [
      "Everything in Enterprise, plus:",
      "Tailored pricing",
      "SLA guarantees",
      "White-label options",
      "Strategic account support",
    ],
  },
];

const faqs = [
  {
    q: "What\u2019s included in the monthly fee?",
    a: "Everything. The flat monthly fee per pharmacy covers all PGDs across every category, platform access, training, clinical support, patient directory listing, and marketing materials. No per-consultation fees, no per-PGD upcharges, no hidden charges.",
  },
  {
    q: "Are there any hidden fees?",
    a: "No. Your monthly fee covers everything listed in your plan. We do not charge per consultation, per patient, per service, or per PGD. The price you see is the price you pay.",
  },
  {
    q: "How does pricing work if I have multiple pharmacies?",
    a: "You pay per pharmacy per month at the tier rate. So if you have 10 pharmacies, you\u2019re on the Group tier (6\u201315 pharmacies): 10 \u00d7 £109 = £1,090/month. No per-pharmacy setup fees, no platform surcharges.",
  },
  {
    q: "Can I start small and scale up?",
    a: "Yes. Start with Single Site (1\u20135 pharmacies) and add more pharmacies anytime. Once you reach the next tier threshold, your per-pharmacy rate automatically drops. We\u2019ll adjust your next invoice accordingly.",
  },
  {
    q: "How does your pricing compare to other PGD providers?",
    a: "A leading competitor charges a monthly platform fee plus £4–6.50 per consultation — the busier you get, the more you pay.50 per consultation \u2014 the busier you get, the more you pay. GRH is a flat monthly fee with zero per-consultation charges. Use the savings calculator above to see your potential savings based on your actual volumes.",
  },
  {
    q: "How does your pricing compare to ECG?",
    a: "ECG charges per PGD, per pharmacist, per year \u2014 plus a separate third-party platform subscription for the digital workflow. GRH is one flat fee that covers everything: all PGDs, platform, training, clinical support, and onboarding. No hidden layers.",
  },
  {
    q: "Can I cancel?",
    a: "You can cancel at the end of your annual term. All your consultation records remain accessible and exportable. They\u2019re your data \u2014 you keep them.",
  },
];

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Transparent pricing
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl">
            One flat monthly fee per pharmacy. All PGDs included. Zero per-consult charges. Price goes down as you grow.
          </p>
        </div>
      </section>

      {/* Why this matters callout */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-navy-50 border border-navy-100 rounded-xl p-6">
          <h2 className="font-bold text-navy-900 mb-2">Our pricing principle</h2>
          <ul className="text-gray-700 leading-relaxed space-y-2">
            <li><strong>Flat monthly fee per pharmacy.</strong> No per-consultation charges, no per-PGD upcharges, no hidden layers.</li>
            <li><strong>All PGDs included at every tier.</strong> Travel vaccines, flu jabs, UTI, weight management &mdash; everything covered by one fee.</li>
            <li><strong>Zero per-consultation fees ever.</strong> Unlike a leading competitor\u2019s £4\u20136.50/item model, your cost doesn\u2019t rise with volume.</li>
            <li><strong>Price goes down as you grow.</strong> Volume discounts: £125/pharmacy for 1\u20135 sites, down to £99 for 16\u201330, and custom pricing for networks of 30+.</li>
          </ul>
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
              <div className="mb-6">
                <p className="text-3xl font-bold text-navy-900">
                  {tier.price}
                </p>
                {tier.priceSubtitle && (
                  <p className="text-sm text-gray-500">{tier.priceSubtitle}</p>
                )}
              </div>
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
            Compare your costs against a leading per-consultation PGD provider.
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
