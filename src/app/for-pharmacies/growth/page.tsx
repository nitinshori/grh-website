import type { Metadata } from "next";
import Link from "next/link";
import { GrowthForm } from "./GrowthForm";

export const metadata: Metadata = {
  title: "Practice Digital | Pharmacy Websites by Clinicians — Get Real Health",
  description:
    "Practice Digital, Get Real Health's sister company, builds pharmacy websites that drive Pharmacy First walk-ins — clinic booking, repeat ordering, six languages and an AI patient chatbot. £399 a year, £0 setup, price locked for 5 years.",
  alternates: { canonical: "/for-pharmacies/growth" },
  openGraph: {
    title: "Practice Digital — the pharmacy website that drives walk-ins",
    description:
      "Built by working clinicians. £399/year, price locked 5 years, AI chatbot add-on. See the Bridgegate Pharmacy demo.",
  },
};

const FEATURES = [
  {
    title: "Pharmacy First, front and centre",
    body: "Most patients still don't know what Pharmacy First is. Your website does the explaining — walk-in conditions foregrounded, so patients come to you instead of queueing at the GP.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    title: "Clinic booking built in",
    body: "Travel vaccines, weight management, private services — patients book online, day or night. Repeat-prescription ordering sits right in the hero.",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    title: "AI patient chatbot",
    body: "An optional add-on (~£20/month, usage-based) that answers patient questions around the clock and guides them to book — trained by clinicians who know where helpful ends and clinical advice begins.",
    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
  },
  {
    title: "Compliance as standard",
    body: "Each pharmacist's GPhC number on the team page, premises registration in the footer, accessibility and privacy kept current. Six languages built in — English, Welsh, Polish, Romanian, Punjabi and Urdu.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Update it yourself, instantly",
    body: "Log in and publish urgent notices — closures, flu stock arriving early, bank holiday hours — live on your homepage in minutes, from anywhere.",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
  {
    title: "Honest pricing",
    body: "£399 a year, £0 setup, price locked for five years from the day you start. 30 days' notice to leave — no long tie-ins, no per-pharmacist upsells, no surprise renewals.",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
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
                — our sister company · healthcare websites by medics
              </span>
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              The pharmacy website that drives
              <span className="text-teal-400"> Pharmacy First walk-ins.</span>
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed mb-4">
              Built by working NHS doctors, nurses and practice managers.
              Pharmacy First foregrounded, repeat ordering in the hero, clinic
              booking for your travel and weight-management services, and an
              AI chatbot that answers patients while you sleep.
            </p>
            <p className="text-blue-200 font-semibold mb-8">
              £399 a year · £0 setup · price locked 5 years · 6 languages built in
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://bridgegate-pharmacy.pages.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-teal-500/20 text-center"
              >
                See the example pharmacy site →
              </a>
              <a
                href="#growth-form"
                className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-lg border border-white/20 text-center"
              >
                Get yours built
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRIDGEGATE SHOWCASE ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-teal-600 font-semibold text-sm uppercase tracking-wider mb-2">
              See it in action
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-4">
              Bridgegate Pharmacy — one of ours.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              A working demo built on the exact stack you&apos;d get: an
              independent Yorkshire community pharmacy with Pharmacy First
              walk-in, travel clinic and weight-management booking, repeat
              ordering, free home-delivery sign-up and GPhC registration
              displayed properly.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Every feature is live — click around, book something, try the
              chatbot.
            </p>
            <a
              href="https://bridgegate-pharmacy.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg transition-colors"
            >
              Open the live demo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          {/* stylised site-card preview */}
          <a
            href="https://bridgegate-pharmacy.pages.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-navy-950 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
          >
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="text-xs text-gray-500 ml-2 truncate">bridgegate-pharmacy.pages.dev</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-lg bg-teal-500 text-white font-bold flex items-center justify-center">BP</span>
                  <div>
                    <p className="font-bold text-navy-900">Bridgegate Pharmacy</p>
                    <p className="text-xs text-gray-500">Knaresborough · since 1978</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-navy-900 mb-2">Walk in. We&apos;ll see you today.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Pharmacy First</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Repeat order</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Travel clinic</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">Weight management</span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* ── WHAT YOU GET ──────────────────────────────────── */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3 text-center">
            What you get
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            One flat fee, everything included — and because Practice Digital
            and Get Real Health are the same family, your GRH services slot
            straight into your new site.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
                <svg className="w-8 h-8 text-teal-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.icon} />
                </svg>
                <h3 className="font-bold text-navy-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-10">
            <a
              href="https://practicedigital.co.uk/pharmacists.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
            >
              Full details at practicedigital.co.uk
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </p>
        </div>
      </section>

      {/* ── WHY US ────────────────────────────────────────── */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <blockquote className="text-lg sm:text-xl italic leading-relaxed text-blue-100 mb-8">
            &ldquo;Built by clinicians who&apos;ve spent thirty seconds
            explaining what Pharmacy First is and decided the website should
            do that instead.&rdquo;
          </blockquote>
          <p className="text-sm text-blue-300 font-medium">
            &mdash; Practice Digital · the only healthcare website service
            built and owned by practising doctors
          </p>
        </div>
      </section>

      {/* ── LEAD FORM ─────────────────────────────────────── */}
      <section id="growth-form" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
            Get yours built
          </h2>
          <p className="text-gray-600">
            Tell us about your pharmacy and we&apos;ll reply the same working
            day. Or go straight to{" "}
            <a
              href="https://practicedigital.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              practicedigital.co.uk
            </a>
            .
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
          <GrowthForm />
        </div>
      </section>
    </>
  );
}
