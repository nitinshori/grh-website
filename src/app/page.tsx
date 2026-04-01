import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Real Health | PGD Services for UK Pharmacies",
  description:
    "UK pharmacy PGD provider. 60+ services, flat annual fee, no per-consult charges. Your patients. Your data. Your business.",
};

export default function HomePage() {
  return (
    <>
      {/* ── HERO: Split Panel ──────────────────────────────── */}
      <section className="grid md:grid-cols-2 min-h-[70vh]">
        {/* Left: For Pharmacies */}
        <div className="bg-navy-900 text-white flex items-center justify-center px-8 py-20 md:py-28">
          <div className="max-w-md">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Your patients.
              <br />
              Your data.
              <br />
              Your business.
            </h1>
            <p className="text-lg text-blue-200 mb-8">
              PGDs that put you in control &mdash; not us.
            </p>
            <Link
              href="/for-pharmacies"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              I&apos;m a pharmacist
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Right: For Patients */}
        <div className="bg-teal-600 text-white flex items-center justify-center px-8 py-20 md:py-28">
          <div className="max-w-md">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Private healthcare at your local pharmacy.
            </h2>
            <p className="text-lg text-teal-100 mb-8">
              Book a travel jab, weight management consultation, or private
              health check near you &mdash; today.
            </p>
            <Link
              href="/for-patients/find-service"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-teal-700 hover:bg-teal-50 font-semibold rounded-lg transition-colors text-lg"
            >
              Find a service near me
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-navy-900">
                &pound;50,000+
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Average annual PGD revenue per pharmacy
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-navy-900">
                60+
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PGD services available from day one
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-navy-900">
                &pound;0
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Per-consult fees. Ever.
              </p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-navy-900">
                48hrs
              </p>
              <p className="text-sm text-gray-500 mt-1">
                From sign-up to authorised and ready
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION STATEMENT ─────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <p className="text-xl sm:text-2xl text-gray-700 leading-relaxed mb-6">
          We exist to help UK pharmacies build profitable private services
          &mdash; without giving away a cut of every consultation to a
          middleman.
        </p>
        <p className="text-lg text-gray-500 leading-relaxed mb-6">
          Our founder built the UK&apos;s first online GLP-1 and TRT prescribing
          service as Medical Director of Pharmacy2U. That experience &mdash;
          building clinical governance at national scale, under real regulatory
          scrutiny &mdash; is behind every PGD we write.
        </p>
        <p className="text-xl font-semibold text-navy-900">
          Flat fee. Your data. Your business.
        </p>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────── */}
      <section className="bg-navy-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to stop sharing your revenue?
          </h2>
          <p className="text-blue-200 mb-8 max-w-xl mx-auto">
            See our PGD catalogue and transparent pricing &mdash; no
            registration required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/for-pharmacies/pgd-catalogue"
              className="px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              View PGD Catalogue
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-lg border border-white/20"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
