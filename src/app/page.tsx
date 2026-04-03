import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Real Health | PGD Services for UK Pharmacies",
  description:
    "UK pharmacy PGD provider. 60+ services, flat annual fee, no per-consult charges. Your patients. Your data. Your business.",
};

export default function HomePage() {
  return (
    <>
      {/* ── 1. HERO — Founder-Led Credibility + Dual CTAs ─────── */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 border border-teal-400/20 rounded-full text-teal-300 text-sm font-medium mb-6">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Founded by a Pharmacy2U Medical Director
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6">
                Clinical expertise.
                <br />
                <span className="text-teal-400">Commercial sense.</span>
              </h1>

              <p className="text-lg sm:text-xl text-blue-200 leading-relaxed mb-8 max-w-xl">
                60+ PGD services. One flat fee. No per-consult charges, no
                revenue share. Built by the pharmacist who launched GLP-1
                prescribing at Pharmacy2U.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/for-pharmacies"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-teal-500/20"
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
                <Link
                  href="/for-patients/find-service"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-lg border border-white/20"
                >
                  Find a service near me
                </Link>
              </div>
            </div>

            {/* Right: Founder card */}
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute -inset-4 bg-gradient-to-br from-teal-400/20 to-teal-600/10 rounded-2xl blur-xl" />

                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-sm">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-6 ring-4 ring-white/10">
                    <Image
                      src="/images/nitin-founder.jpg"
                      alt="Dr Nitin Shori — Founder & Medical Director"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      style={{ objectPosition: "50% 25%" }}
                      priority
                    />
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white">
                      Dr Nitin Shori
                    </h3>
                    <p className="text-teal-300 font-medium mt-1">
                      Founder &amp; Medical Director
                    </p>
                    <p className="text-blue-200 text-sm mt-3 leading-relaxed">
                      NHS GP Partner for 20 years. Pharmacy2U Medical Director
                      for 12 years. Law degree holder.
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-teal-400">60+</p>
                      <p className="text-xs text-blue-200 mt-0.5">
                        PGD Services
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-teal-400">48hrs</p>
                      <p className="text-xs text-blue-200 mt-0.5">
                        To Go Live
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. DUAL-AUDIENCE STRIP ────────────────────────────── */}
      <section className="grid md:grid-cols-2">
        {/* Pharmacies */}
        <div className="bg-navy-900 px-6 sm:px-8 py-8 flex items-center">
          <div className="max-w-lg mx-auto flex items-center gap-5">
            <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-teal-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                For UK Pharmacies
              </h3>
              <p className="text-blue-200 text-sm mt-1">
                60+ PGDs, flat fee, your data &mdash; launch private services in
                48 hours.
              </p>
            </div>
            <Link
              href="/for-pharmacies"
              className="ml-auto shrink-0 text-teal-400 hover:text-teal-300 transition-colors"
              aria-label="For Pharmacies"
            >
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Patients */}
        <div className="bg-teal-600 px-6 sm:px-8 py-8 flex items-center">
          <div className="max-w-lg mx-auto flex items-center gap-5">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">For Patients</h3>
              <p className="text-teal-100 text-sm mt-1">
                Private healthcare at your local pharmacy &mdash; book travel
                jabs, weight management &amp; more.
              </p>
            </div>
            <Link
              href="/for-patients/find-service"
              className="ml-auto shrink-0 text-white/80 hover:text-white transition-colors"
              aria-label="Find a service"
            >
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. TRUST STRIP — Enhanced Stats with Icons ─────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-teal-600"
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
              <p className="text-3xl sm:text-4xl font-bold text-navy-900">
                &pound;50k+
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Average annual PGD revenue per pharmacy
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-teal-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-navy-900">
                60+
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PGD services from day one
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-teal-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-navy-900">
                &pound;0
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Per-consult fees. Ever.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-teal-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
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

      {/* ── 4. WHY PHARMACIES CHOOSE US — Three Pillars ────────── */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
              Why pharmacies choose us
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We&apos;re not a tech company selling PGDs on the side. We&apos;re
              pharmacists who built something better.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pillar 1: Clinical expertise */}
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-3">
                Pharmacist-led clinical expertise
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our founder was Medical Director at Pharmacy2U, where he built
                the UK&apos;s first online GLP-1 and TRT prescribing service.
                That regulatory experience is behind every PGD we write.
              </p>
              <p className="text-sm font-semibold text-teal-600">
                Not a tech company &mdash; a clinical one.
              </p>
            </div>

            {/* Pillar 2: End-to-end */}
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
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
                End-to-end platform
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                PGDs, consultation eTool, online training, clinical support, and
                superintendent dashboard &mdash; all built in-house, not
                licensed from a third party. One login. One fee. One support
                number.
              </p>
              <p className="text-sm font-semibold text-teal-600">
                Everything in one place.
              </p>
            </div>

            {/* Pillar 3: Your data */}
            <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
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
              <h3 className="text-xl font-bold text-navy-900 mb-3">
                Your data. Your business.
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Flat annual fee &mdash; no per-consult charges, no revenue
                share. You own every patient record, every booking, every
                consultation. When you leave, you take everything with you.
              </p>
              <p className="text-sm font-semibold text-teal-600">
                Keep 100% of what you earn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FOUNDER DEEP-DIVE ──────────────────────────────── */}
      <section className="bg-navy-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Left: Photo */}
            <div className="lg:col-span-2 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-teal-200/40 to-navy-200/40 rounded-2xl blur-lg" />
                <div className="relative w-72 h-80 sm:w-80 sm:h-96 rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/nitin-founder.jpg"
                    alt="Dr Nitin Shori — Founder & Medical Director of Get Real Health"
                    fill
                    className="object-cover"
                    style={{ objectPosition: "50% 20%" }}
                    sizes="(max-width: 768px) 288px, 320px"
                  />
                </div>
              </div>
            </div>

            {/* Right: Bio */}
            <div className="lg:col-span-3">
              <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-2">
                Meet the founder
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-6">
                Built on real clinical experience
              </h2>

              <p className="text-gray-600 leading-relaxed mb-4">
                Dr Nitin Shori has been an NHS GP Partner for over 20 years and
                ran a private GP service alongside his NHS practice. He holds a
                law degree &mdash; giving him a unique perspective on clinical
                governance, regulatory compliance, and the medico-legal
                landscape.
              </p>

              <p className="text-gray-600 leading-relaxed mb-4">
                As founder of the Pharmacy2U Online Doctor Service and Medical
                Director for 12 years, Nitin built the UK&apos;s first online
                GLP-1 and TRT prescribing service from scratch &mdash; safely,
                at scale, under full CQC oversight.
              </p>

              <p className="text-gray-600 leading-relaxed mb-4">
                Through Get Real Health, we&apos;ve written PGDs for the
                country&apos;s biggest pharmacy chains and supermarkets, as well
                as smaller independent pharmacies. Our CPD-accredited training
                ensures every pharmacist we work with meets the same clinical
                standard &mdash; regardless of the size of their operation.
              </p>

              <p className="text-gray-600 leading-relaxed mb-6">
                That breadth of experience is behind everything we do: every PGD
                we write, every training module we deliver, and every governance
                framework we build for partner pharmacies.
              </p>

              <blockquote className="border-l-4 border-teal-500 pl-5 py-2 mb-6">
                <p className="text-navy-800 italic leading-relaxed">
                  &ldquo;Clinical rigour enables commercial success &mdash; not
                  the other way around. That&apos;s the principle behind every
                  PGD, every training module, and every decision we make.&rdquo;
                </p>
              </blockquote>

              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
              >
                Learn more about our team
                <svg
                  className="w-4 h-4"
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
        </div>
      </section>

      {/* ── 6. HOW IT WORKS — 4-Step Process ──────────────────── */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
              Go live in four steps
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From sign-up to your first consultation in as little as 48 hours.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-navy-900 text-white flex items-center justify-center text-xl font-bold mb-5">
                1
              </div>
              {/* Connector line (desktop only) */}
              <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gray-200" />
              <h3 className="text-lg font-bold text-navy-900 mb-2">Sign up</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Quick onboarding form. Tell us about your pharmacy and the
                services you want to offer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-navy-900 text-white flex items-center justify-center text-xl font-bold mb-5">
                2
              </div>
              <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gray-200" />
              <h3 className="text-lg font-bold text-navy-900 mb-2">
                Get authorised
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Complete our online CPD training and receive your PGD
                authorisation certificates.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-navy-900 text-white flex items-center justify-center text-xl font-bold mb-5">
                3
              </div>
              <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-gray-200" />
              <h3 className="text-lg font-bold text-navy-900 mb-2">
                Launch services
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Start consulting using our built-in eTool. We provide marketing
                materials to help you promote.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-teal-500 text-white flex items-center justify-center text-xl font-bold mb-5">
                4
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">
                Scale &amp; grow
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Add more services any time. Use our superintendent dashboard to
                oversee all your branches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. NHS FUNDING REALITY ────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
              The NHS funding reality
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Private PGD services aren&apos;t a growth strategy. They&apos;re a
              survival strategy.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 mb-10">
            {/* Shortfall card */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-red-50 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              </div>
              <p className="text-4xl sm:text-5xl font-bold text-red-600 mb-2">
                &pound;67k
              </p>
              <p className="text-gray-600">
                Average annual NHS funding shortfall per community pharmacy
              </p>
            </div>

            {/* Revenue card */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-teal-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <p className="text-4xl sm:text-5xl font-bold text-teal-600 mb-2">
                &pound;50k+
              </p>
              <p className="text-gray-600">
                Average annual revenue from PGD private services
              </p>
            </div>
          </div>

          {/* Killer line */}
          <div className="bg-navy-900 rounded-xl p-8 text-center">
            <p className="text-lg sm:text-xl text-white leading-relaxed max-w-2xl mx-auto">
              The question isn&apos;t whether to offer private services &mdash;
              it&apos;s{" "}
              <span className="text-teal-400 font-semibold">
                who you&apos;re splitting the revenue with.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── 8. BOTTOM CTA ─────────────────────────────────────── */}
      <section className="bg-navy-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            See what GRH can do for your pharmacy
          </h2>
          <p className="text-blue-200 mb-8 max-w-xl mx-auto">
            Browse our full PGD catalogue and transparent pricing &mdash; no
            registration required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/for-pharmacies/pgd-catalogue"
              className="px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-teal-500/20"
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
