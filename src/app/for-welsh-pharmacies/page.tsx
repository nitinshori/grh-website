import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = "https://getrealhealthpgd.co.uk";

export const metadata: Metadata = {
  title: "For Welsh Pharmacies — HIW Registered | Get Real Health",
  description:
    "Get Real Health is registered with Healthcare Inspectorate Wales (HIW) and the Care Quality Commission (CQC) in England. Run private PGD services in Wales alongside NHS Wales Common Ailment Service / Choose Pharmacy.",
  keywords: [
    "Welsh pharmacy PGD",
    "HIW registered pharmacy PGD",
    "private pharmacy services Wales",
    "Wegovy pharmacy Wales",
    "HRT pharmacy Wales",
    "NHS Wales Common Ailment Service private",
    "Wales pharmacy private services",
  ],
  alternates: { canonical: `${BASE_URL}/for-welsh-pharmacies` },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: `${BASE_URL}/for-welsh-pharmacies`,
    siteName: "Get Real Health",
    title: "For Welsh Pharmacies — HIW Registered",
    description:
      "HIW-registered PGD platform for Welsh community pharmacy. Sits alongside your Common Ailment Service / Choose Pharmacy NHS work.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GRH for Welsh Pharmacies" }],
  },
};

const faqs = [
  {
    q: "Is GRH regulated to operate in Wales?",
    a: "Yes. Get Real Health is registered with Healthcare Inspectorate Wales (HIW) — the regulator for independent healthcare providers in Wales — and with the Care Quality Commission (CQC) in England. Most of our competitors hold CQC but not HIW; that means Welsh pharmacies are often pushed to use providers regulated only in England. We're registered in both jurisdictions.",
  },
  {
    q: "Does private PGD work clash with the NHS Wales Common Ailment Service?",
    a: "No. They sit alongside each other. Common Ailment Service (or 'Choose Pharmacy') covers a defined list of minor ailments under NHS funding. GRH's 70+ private PGDs cover the services that fall outside CAS — Wegovy, Mounjaro, HRT, TRT, travel vaccines, advanced sexual health, dermatology and more. Our PGDs are explicit about not duplicating NHS-funded work; they pick up where CAS leaves off.",
  },
  {
    q: "Can I run the service in both Welsh and English?",
    a: "Yes — the consultation tool is in English but patient-facing materials and consent forms can be supplied in Welsh on request. If you serve a primarily Welsh-speaking patient base, tell us at onboarding and we'll prioritise Welsh-language versions for the most common services in your menu.",
  },
  {
    q: "What's the pricing in Wales?",
    a: "Same as everywhere else: £100 per pharmacy per month, flat. Every PGD included. Every pharmacist on your team covered — locums included. Welsh pharmacies are not charged extra and not put on a different tier.",
  },
  {
    q: "Who's the medical authority on these PGDs?",
    a: "Dr Nitin Shori — NHS GP partner, previously Medical Director of Pharmacy2U Online Doctor Service for 10+ years, where he helped build some of the UK's earliest large-scale online prescribing programmes. Every PGD has a named clinician.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Get Real Health for Welsh Pharmacies",
  description:
    "HIW-registered Patient Group Direction platform for Welsh community pharmacy. Sits alongside the NHS Wales Common Ailment Service.",
  provider: { "@type": "Organization", name: "Get Real Health", url: BASE_URL },
  areaServed: [
    { "@type": "AdministrativeArea", name: "Wales" },
    { "@type": "Country", name: "United Kingdom" },
  ],
  audience: { "@type": "Audience", audienceType: "Welsh community pharmacies and pharmacists" },
  serviceType: "Patient Group Direction Services",
  url: `${BASE_URL}/for-welsh-pharmacies`,
};

export default function WelshPharmaciesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <nav aria-label="Breadcrumb" className="text-sm text-blue-200 mb-6">
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-white">For Welsh Pharmacies</li>
            </ol>
          </nav>
          <p className="text-sm uppercase tracking-wider text-teal-300 font-semibold mb-3">
            HIW + CQC registered
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Private PGDs for Welsh pharmacies &mdash; properly regulated
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-3xl">
            Get Real Health is registered with Healthcare Inspectorate Wales
            and the Care Quality Commission. Run a Wegovy clinic, an HRT clinic,
            a travel clinic in Aberystwyth or Aberdare with the same governance
            you&apos;d expect in central London &mdash; and the same flat fee.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/onboard"
              className="inline-flex items-center justify-center bg-teal-500 hover:bg-teal-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Start onboarding
            </Link>
            <Link
              href="/cost-calculator"
              className="inline-flex items-center justify-center border border-blue-300 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              See savings calculator
            </Link>
          </div>
        </div>
      </section>

      {/* Regulator badges */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-rose-50 to-white">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Wales regulator</p>
                  <p className="text-xl font-bold text-gray-900">HIW registered</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Healthcare Inspectorate Wales is the independent regulator for
                healthcare services in Wales. Most UK PGD providers don&apos;t
                hold HIW registration. We do.
              </p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">England regulator</p>
                  <p className="text-xl font-bold text-gray-900">CQC registered</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Care Quality Commission registered in England. Welsh pharmacies
                with English branches can run the same private service across
                the border on the same governance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NHS Wales compatibility statement */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Sits alongside NHS Wales Common Ailment Service
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The Welsh NHS Common Ailment Service (CAS) &mdash; the Welsh equivalent
            of Pharmacy First &mdash; covers a defined list of minor ailments under
            NHS funding. Patients access it free of charge for things like
            uncomplicated UTIs, conjunctivitis, hay fever, oral thrush and a
            handful of other conditions.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            GRH&apos;s 70+ private PGDs pick up where CAS leaves off &mdash;
            Wegovy, Mounjaro, HRT, TRT, travel vaccines, advanced sexual health,
            dermatology, vaccines that aren&apos;t on Welsh NHS rotas. Our PGDs
            are explicit about not duplicating NHS-funded work. Your CAS revenue
            stays NHS, your private revenue stays yours.
          </p>
          <Link
            href="/services/comparison"
            className="text-teal-700 font-semibold text-sm hover:text-teal-800"
          >
            See the full NHS vs private service comparison &rarr;
          </Link>
        </div>
      </section>

      {/* FAQs */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Welsh pharmacy FAQs
        </h2>
        <dl className="space-y-6">
          {faqs.map((f, i) => (
            <div key={i} className="border-b border-gray-200 pb-6">
              <dt className="text-lg font-semibold text-gray-900 mb-2">{f.q}</dt>
              <dd className="text-gray-700 leading-relaxed">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Add a private service to your Welsh pharmacy this week
          </h2>
          <p className="text-blue-200 text-lg mb-8 max-w-2xl mx-auto">
            HIW-registered. Every PGD. All your locums. £100 per store per month, flat.
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
