import type { Metadata } from "next";
import Link from "next/link";
import { GrowthForm } from "./GrowthForm";

export const metadata: Metadata = {
  title: "Practice Digital | Pharmacy Marketing & Growth — Get Real Health",
  description:
    "Practice Digital is Get Real Health's sister agency: patient-facing web pages, Google Ads, local SEO, social content, patient campaigns and AI call answering for UK pharmacies. Launch services with GRH — fill your diary with Practice Digital.",
  alternates: { canonical: "/for-pharmacies/growth" },
  openGraph: {
    title: "Practice Digital — grow your pharmacy's private services",
    description:
      "The marketing arm of Get Real Health. One team for clinical services and the patients to fill them.",
  },
};

const SERVICES = [
  {
    title: "Patient-facing service pages",
    body: "Professional web pages for every service you run — weight management, travel clinic, women's health — written for patients and built to convert local searches into bookings.",
    icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    title: "Google Ads & local SEO",
    body: "Targeted campaigns for the services with real margin — appearing when patients near you search for them. Spend controlled, results reported monthly.",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    title: "Social media content",
    body: "A steady stream of professional, compliant content for your pharmacy's pages — service spotlights, seasonal campaigns, and local engagement.",
    icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
  },
  {
    title: "Patient campaigns",
    body: "Email and SMS campaigns to your existing patient base — flu season, travel season, new service launches — turning your quietest weeks into booked diaries.",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    title: "AI phone receptionist",
    body: "Never miss a call again. An AI receptionist answers your phone, handles service questions and books consultations straight into your diary — including when you're closed.",
    icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  },
  {
    title: "Plain-English reporting",
    body: "One monthly report: what we spent, what it brought in, what to do next. No dashboards to decipher — just bookings you can count.",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Launch with GRH",
    body: "Your PGDs, training and consultation platform — live and compliant.",
  },
  {
    n: "2",
    title: "Grow with Practice Digital",
    body: "We put your services in front of local patients — search, social, and your own patient list.",
  },
  {
    n: "3",
    title: "Patients book. You deliver.",
    body: "Demand flows into the same ePGD tools you already use. One family, one accountable team.",
  },
];

export default function GrowthPage() {
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-teal-400 font-semibold text-sm uppercase tracking-wider mb-4">
              Practice Digital
              <span className="text-blue-300 font-normal normal-case tracking-normal">
                — the marketing arm of Get Real Health
              </span>
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Clinical services fill your shelves.
              <span className="text-teal-400"> We fill your diary.</span>
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed mb-8">
              A PGD service without patients is a folder in a drawer. Practice
              Digital — from the same team behind Get Real Health — markets
              your private services to the patients around you, so the
              services you launch actually get used.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#growth-form"
                className="px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-teal-500/20 text-center"
              >
                Get a growth plan
              </a>
              <Link
                href="/for-pharmacies/pgd-catalogue"
                className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-lg border border-white/20 text-center"
              >
                See the clinical side
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ONE-STOP SHOP ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
            One team. Both halves of a private service.
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Most pharmacies buy clinical governance from one company and
            marketing from another — and neither talks to the other. We built
            both under one roof.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm text-center">
              <div className="w-10 h-10 rounded-full bg-teal-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {s.n}
              </div>
              <h3 className="font-bold text-navy-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES GRID ─────────────────────────────────── */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3 text-center">
            What Practice Digital does
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Pick one service or hand us the lot. GRH partner pharmacies get
            preferential rates.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                <svg
                  className="w-8 h-8 text-teal-500 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
                </svg>
                <h3 className="font-bold text-navy-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY US ────────────────────────────────────────── */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <blockquote className="text-lg sm:text-xl italic leading-relaxed text-blue-100 mb-8">
            &ldquo;We&apos;re clinicians first. We won&apos;t market a service
            your pharmacy can&apos;t deliver safely — and because we run the
            clinical side too, we know exactly which services are worth
            promoting, where, and when.&rdquo;
          </blockquote>
          <p className="text-sm text-blue-300 font-medium">
            &mdash; The Get Real Health &amp; Practice Digital team
          </p>
        </div>
      </section>

      {/* ── LEAD FORM ─────────────────────────────────────── */}
      <section id="growth-form" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
            Get your growth plan
          </h2>
          <p className="text-gray-600">
            Tell us about your pharmacy and we&apos;ll come back within one
            working day with a concrete plan — what to promote, how, and what
            it should cost.
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
          <GrowthForm />
        </div>
      </section>
    </>
  );
}
