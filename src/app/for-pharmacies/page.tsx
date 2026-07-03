import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Pharmacies \u2014 Why Partner With Us",
  description:
    "PGDs with no per-consult fees, full data ownership and an integrated consultation tool. See why pharmacies are switching to Get Real Health.",
};

const features = [
  "A wide and growing PGD catalogue across travel, vaccines, weight management, sexual health and more",
  "Less common services included \u2014 such as HRT initiation, private PrEP and short-term anxiety symptom support",
  "Integrated consultation tool \u2014 built in-house, not licensed from a third party",
  "Audit-ready digital consultation records \u2014 exportable, kept indefinitely",
  "PMR-ready architecture \u2014 designed to complement your PMR, not compete with it",
  "Online training with CPD-compliant certificates for every PGD",
  "Superintendent dashboard \u2014 oversight across all your branches",
  "Patient-facing directory listing \u2014 patients find you, not us",
  "Per-pharmacy custom PGD documents \u2014 for multi-site groups with their own clinical sign-off",
  "Charged per store, not per pharmacist \u2014 locums and second pharmacists included at no extra cost",
];

export default function ForPharmaciesPage() {
  return (
    <>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-3xl">
            One fee per store. Zero per-consultation charges. Your whole team covered.
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl leading-relaxed">
            Other providers charge per pharmacist &mdash; so your costs go up
            every time you add cover. We charge per store, not per head. All
            PGDs, consultation platform, training, and clinical governance
            included. No per-consult fees, ever.
          </p>
        </div>
      </section>

      {/* ── FOUNDER CREDIBILITY ────────────────────────────── */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-lg leading-relaxed text-blue-100">
            Our founder spent years as Medical Director of Pharmacy2U &mdash;
            one of the UK&apos;s largest online pharmacies &mdash; helping
            build out its online doctor service. That work included some of
            the UK&apos;s earliest large-scale online prescribing programmes
            for GLP-1 weight management and testosterone replacement therapy.
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
            <div className="w-12 h-12 rounded-lg bg-[color:var(--tenant-primary)]/10 flex items-center justify-center mb-5">
              <svg
                className="w-6 h-6 text-[color:var(--tenant-primary)]"
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
              Exportable at any time. When you leave a typical PGD provider,
              you usually leave without your patient history. With us, you take
              everything.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-[color:var(--tenant-primary)]/10 flex items-center justify-center mb-5">
              <svg
                className="w-6 h-6 text-[color:var(--tenant-primary)]"
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
              One flat fee per store
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Most PGD providers charge per pharmacist or per consultation.
              The more staff you have, the more they earn. We charge one flat
              monthly fee per store &mdash; covering all your pharmacists,
              locums included. Zero per-consultation fees. Your 500th consult
              costs the same as your first. You keep the difference.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-[color:var(--tenant-primary)]/10 flex items-center justify-center mb-5">
              <svg
                className="w-6 h-6 text-[color:var(--tenant-primary)]"
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
              licensed from a third party. PGD governance, clinical workflows,
              training and audit-ready records sit in the same product, from
              the same team. No third-party platform contracts or lock-in. No
              integration risk. One login, one fee, one support number.
              Designed to work alongside your PMR, not replace it.
            </p>
          </div>
        </div>
      </section>

      {/* ── NHS FUNDING REALITY ────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-4">
            The NHS funding reality
          </h2>
          <p className="text-gray-600 mb-10 max-w-2xl mx-auto">
            Community pharmacy NHS funding has fallen sharply in real terms,
            and many contractors report private services now account for a
            meaningful share of their bottom line.
          </p>
          <div className="grid sm:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-red-600 mb-2">
                NHS funding shortfall
              </p>
              <p className="text-gray-600">
                Independent analysis of community pharmacy contractor finances
                consistently points to significant per-pharmacy shortfalls
                under the current contractual framework.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <p className="text-2xl font-bold text-[color:var(--tenant-primary)] mb-2">
                PGD revenue opportunity
              </p>
              <p className="text-gray-600">
                Pharmacies running well-marketed private PGD services
                (travel, weight, sexual health, ED) routinely report
                meaningful additional annual revenue.
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
                className="w-5 h-5 text-[color:var(--tenant-primary)] mt-0.5 shrink-0"
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
            &ldquo;I spent years as Medical Director at Pharmacy2U, helping
            build out online prescribing services at scale. That work taught
            me what good clinical governance actually looks like in practice
            &mdash; and how much it matters when something goes wrong.&rdquo;
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

      {/* ── ONE-STOP SHOP: PRACTICE DIGITAL ────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-navy-950 rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <p className="text-teal-400 font-semibold text-sm uppercase tracking-wider mb-2">
              New — Practice Digital
            </p>
            <h2 className="text-2xl font-bold text-white mb-3">
              Don&apos;t just launch services. Fill them.
            </h2>
            <p className="text-blue-100 leading-relaxed">
              Our sister marketing agency promotes your private services to
              local patients — web pages, Google Ads, social content, patient
              campaigns and AI call answering. One family, one accountable
              team, preferential rates for GRH partners.
            </p>
          </div>
          <Link
            href="/for-pharmacies/growth"
            className="shrink-0 px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-teal-500/20 text-center"
          >
            Grow your pharmacy
          </Link>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-4">
          Ready to see what you&apos;d earn?
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/onboard"
            className="px-7 py-3.5 bg-[color:var(--tenant-primary)]/100 hover:bg-[color:var(--tenant-primary)]/15 text-white font-semibold rounded-lg transition-colors text-lg shadow-sm"
          >
            Sign up your pharmacy
          </Link>
          <Link
            href="/for-pharmacies/pgd-catalogue"
            className="px-7 py-3.5 border border-[color:var(--tenant-primary)]/30 text-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/10 font-semibold rounded-lg transition-colors text-lg"
          >
            View PGD catalogue
          </Link>
          <Link
            href="/demo"
            className="px-7 py-3.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            See a demo
          </Link>
        </div>
      </section>
    </>
  );
}
