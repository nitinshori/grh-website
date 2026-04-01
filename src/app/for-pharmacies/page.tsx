import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Pharmacies \u2014 Why Partner With Us",
  description:
    "PGDs with no per-consult fees, full data ownership, and an integrated consultation tool. See why pharmacies are switching from Pharmadoctor and ECG.",
};

const features = [
  "60+ PGD services available at launch \u2014 more than any other provider",
  "Exclusive services: HRT initiation, private PrEP, TRT, propranolol for anxiety \u2014 not available anywhere else via pharmacy PGD",
  "Integrated consultation tool \u2014 built in-house, not licensed from a third party",
  "Online training with CPD-compliant certificates for every PGD",
  "Clinical support line \u2014 speak to a clinician when you need one",
  "Superintendent dashboard \u2014 oversight across all your branches",
  "Patient-facing directory listing \u2014 patients find you, not us",
  "Marketing materials \u2014 posters, social graphics, email templates",
  "Seasonal campaign support \u2014 flu, travel, weight management",
  "48-hour onboarding \u2014 sign up today, consult by end of the week",
];

export default function ForPharmaciesPage() {
  return (
    <>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-3xl">
            You&apos;ve been giving Pharmadoctor a cut of every patient you see.
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl leading-relaxed">
            We built the clinical governance for the UK&apos;s largest online
            pharmacy. We know what good looks like. And we know what it costs
            when it isn&apos;t.
          </p>
        </div>
      </section>

      {/* ── FOUNDER CREDIBILITY ────────────────────────────── */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-lg leading-relaxed text-blue-100">
            Our founder was Medical Director of Pharmacy2U &mdash; the UK&apos;s
            largest online pharmacy &mdash; and built its online doctor service
            from scratch: GLP-1 weight management, testosterone replacement, and
            erectile dysfunction treatments, online, before anyone else in the UK
            was doing it.
          </p>
          <p className="text-lg leading-relaxed text-blue-200 mt-4">
            That&apos;s not a CV line. It&apos;s the clinical experience behind
            every PGD we write, every governance framework we build, and every
            decision we make when something goes wrong.
          </p>
        </div>
      </section>

      {/* ── THREE PILLARS ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mb-5">
              <svg
                className="w-6 h-6 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-3">Your data</h3>
            <p className="text-gray-600 leading-relaxed">
              Every consultation you carry out is recorded in your system &mdash;
              not ours. Patient records, booking history, risk assessment forms.
              Exportable at any time. When you leave Pharmadoctor, you leave
              without your patient history. With us, you take everything.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mb-5">
              <svg
                className="w-6 h-6 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-3">
              One flat fee
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Pharmadoctor charges per consultation. The busier you get, the more
              they earn. We charge one flat annual fee. Your 500th travel
              consultation of the year costs us exactly the same as your first.
              You keep the difference.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mb-5">
              <svg
                className="w-6 h-6 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-3">
              One platform
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Our consultation tool was built for PGD delivery &mdash; not
              licensed from a third party. PGD governance and the clinical
              workflow sit in the same product, from the same team. No Charac
              contract. No integration risk. One login, one fee, one support
              number.
            </p>
          </div>
        </div>
      </section>

      {/* ── NHS FUNDING REALITY ────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-8">
            The NHS funding reality
          </h2>
          <div className="grid sm:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <p className="text-4xl font-bold text-red-600 mb-2">
                &pound;67,000
              </p>
              <p className="text-gray-600">
                Average annual NHS funding shortfall per community pharmacy
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <p className="text-4xl font-bold text-teal-600 mb-2">
                &pound;50,000+
              </p>
              <p className="text-gray-600">
                Average annual revenue from PGD private services
              </p>
            </div>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Private services aren&apos;t a growth strategy. They&apos;re a
            survival strategy. The question isn&apos;t whether to offer them
            &mdash; it&apos;s who you&apos;re splitting the revenue with.
          </p>
        </div>
      </section>

      {/* ── FEATURE LIST ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-10 text-center">
          What you get
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <svg
                className="w-5 h-5 text-teal-500 mt-0.5 shrink-0"
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
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ───────────────────────────────────── */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <blockquote className="text-lg sm:text-xl italic leading-relaxed text-blue-100 mb-6">
            &ldquo;I was the Medical Director at Pharmacy2U when we launched
            GLP-1 prescribing online in 2016. We were told it was too risky, too
            complicated, and that pharmacies weren&apos;t ready. We did it anyway
            &mdash; safely, at scale, under full CQC oversight.&rdquo;
          </blockquote>
          <blockquote className="text-lg sm:text-xl italic leading-relaxed text-blue-100 mb-8">
            &ldquo;Everything we build here starts from that same principle:
            clinical rigour enables commercial success. Not the other way
            around.&rdquo;
          </blockquote>
          <p className="text-sm text-blue-300 font-medium">
            &mdash; Founder &amp; Medical Director
          </p>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-4">
          Ready to see what you&apos;d earn?
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/for-pharmacies/pgd-catalogue"
            className="px-7 py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            View our PGD catalogue and pricing
          </Link>
          <Link
            href="/contact"
            className="px-7 py-3.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Book a 20-minute demo
          </Link>
        </div>
      </section>
    </>
  );
}
