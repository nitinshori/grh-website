import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { SavingsCalculator } from "./for-pharmacies/pricing/SavingsCalculator";

export const metadata: Metadata = {
  title: "Get Real Health | PGDs, Clinical Training & Governance for UK Pharmacies",
  description:
    "60+ PGDs with built-in clinical training and competency assessments. CQC and HIW registered. One flat annual fee \u2014 no per-consult charges, no revenue share. Founded by clinicians with 20 years of UK pharmacy experience.",
};

export default function HomePage() {
  return (
    <>
      {/* ── PROFESSIONAL DISCLAIMER ────────────────────────── */}
      <div className="bg-navy-950 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-center">
          <p className="text-xs text-blue-300">
            This website is intended for UK registered pharmacists and pharmacy technicians only.
          </p>
        </div>
      </div>

      {/* ── 1. HERO — Pharmacy-Focused with Key USPs ─────── */}
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
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
                Trusted by national supermarket chains &amp; pharmacies across the UK
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6">
                One fee per store.
                <br />
                <span className="text-teal-400">Not per pharmacist. Not per consult.</span>
              </h1>

              <p className="text-lg sm:text-xl text-blue-200 leading-relaxed mb-8 max-w-xl">
                60+ electronically enabled PGDs with built-in training,
                consultation platform, and appointment diary. One monthly fee
                covers your whole team &mdash; locums included. Zero per-consult
                charges. CQC and HIW registered.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/for-pharmacies/pgd-catalogue"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors text-lg shadow-lg shadow-teal-500/20"
                >
                  View PGD Catalogue
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
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-lg border border-white/20"
                >
                  Book a Discovery Call
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
                      style={{ objectPosition: "55% 25%" }}
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
                      NHS GP Partner. Medical Director of Pharmacy2U for 10+
                      years. 20 years of UK pharmacy experience.
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-2xl font-bold text-teal-400">20 yrs</p>
                      <p className="text-[11px] text-blue-200 mt-0.5 leading-tight">
                        UK pharmacy experience
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-teal-400">10+ yrs</p>
                      <p className="text-[11px] text-blue-200 mt-0.5 leading-tight">
                        Medical Director, Pharmacy2U
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold text-teal-400">60+</p>
                      <p className="text-[10px] text-blue-200 mt-0.5 leading-tight">
                        ePGD services
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-teal-400">CQC</p>
                      <p className="text-[10px] text-blue-200 mt-0.5 leading-tight">
                        registered
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-teal-400">HIW</p>
                      <p className="text-[10px] text-blue-200 mt-0.5 leading-tight">
                        registered
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-teal-400">NHS</p>
                      <p className="text-[10px] text-blue-200 mt-0.5 leading-tight">
                        GP Partner
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. KEY USP HIGHLIGHTS ────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* USP 1: Flat Pricing */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-navy-900">Per-Store Pricing</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  One monthly fee per store &mdash; not per pharmacist. Covers your whole team including locums. Zero per-consultation charges. Appointment diary included.
                </p>
              </div>
            </div>

            {/* USP 2: Trusted Nationwide */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-navy-900">Trusted Nationwide</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Used by national supermarket chains, large multiples and independent pharmacies across the UK.
                </p>
              </div>
            </div>

            {/* USP 3: 20 Years Experience */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-navy-900">20 Years&apos; Experience</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Founded by clinicians with two decades of UK pharmacy, prescribing and clinical governance experience.
                </p>
              </div>
            </div>

            {/* USP 4: Electronic PGDs */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-navy-900">Digital ePGDs</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  All 60+ PGDs are electronically enabled &mdash; a simple, step-by-step digital consultation process with built-in clinical safeguards.
                </p>
              </div>
            </div>
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-navy-900">
                CQC &amp; HIW
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Registered with the Care Quality Commission and Healthcare
                Inspectorate Wales
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
                Days
              </p>
              <p className="text-sm text-gray-500 mt-1">
                From sign-up to authorised and ready &mdash; not weeks
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF — Trusted by pharmacies across the UK ── */}
      <section className="bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          {/* Credibility headline */}
          <p className="text-center text-sm font-semibold text-teal-400 uppercase tracking-wider mb-8">
            Trusted by national supermarkets, large multiples and independent pharmacies
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-12">
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">1,000s</p>
              <p className="text-sm text-blue-200 mt-1">of consultations delivered under our PGDs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">60+</p>
              <p className="text-sm text-blue-200 mt-1">PGD services available</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">20 yrs</p>
              <p className="text-sm text-blue-200 mt-1">of pharmacy experience</p>
            </div>
            <div className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-white">CQC &amp; HIW</p>
              <p className="text-sm text-blue-200 mt-1">registered</p>
            </div>
          </div>

          {/* Dan testimonial */}
          <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
            <div className="flex items-start gap-4">
              {/* Quote mark */}
              <svg className="w-10 h-10 text-teal-500 shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
              </svg>
              <div>
                <p className="text-white text-lg md:text-xl leading-relaxed mb-4">
                  GRH made it straightforward to launch private services in my pharmacy. The training is thorough, the platform is simple to use, and the flat fee means I know exactly what I&apos;m paying. No surprises, no per-consult charges eating into my margins.
                </p>
                <div>
                  <p className="text-white font-semibold">Dan</p>
                  <p className="text-blue-300 text-sm">Pharmacy Owner</p>
                </div>
              </div>
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
                Our founder helped build some of the UK&apos;s earliest
                large-scale online prescribing services for GLP-1 and TRT, as
                Medical Director at Pharmacy2U. That clinical and regulatory
                experience is behind every PGD we write.
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
                PGDs, ePGD consultations, online training, clinical support, and
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
                One monthly fee per store &mdash; not per pharmacist. No
                per-consult charges, no revenue share. Appointment diary
                built in. You own every patient record, every booking, every
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
                    style={{ objectPosition: "65% 20%" }}
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
                law degree &mdash; giving him a perspective on clinical
                governance, regulatory compliance and the medico-legal
                landscape that very few prescribers bring to this work.
              </p>

              <p className="text-gray-600 leading-relaxed mb-4">
                Nitin spent years as Medical Director of the Pharmacy2U Online
                Doctor Service, helping build out online prescribing for GLP-1
                weight management and TRT &mdash; safely, at scale, under full
                CQC oversight.
              </p>

              <p className="text-gray-600 leading-relaxed mb-4">
                Through Get Real Health, we work with pharmacy chains,
                supermarkets and independent pharmacies of all sizes. Every
                pharmacist we work with completes the same structured
                clinical training and assessment &mdash; so the standard of
                care is consistent regardless of the size of the operation.
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

      {/* ── 6. HEAD PHARMACIST ─────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Left: Bio */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-2">
                Meet our head pharmacist
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-6">
                Three decades at the pharmacy frontline
              </h2>

              <p className="text-gray-600 leading-relaxed mb-4">
                Christopher Pilkington brings over 30 years of pharmacy
                experience spanning community independents, supermarkets, small
                and large multiples, and locum work. He has served as a
                pharmacist manager, held operations and governance roles, and
                practised as an independent prescriber &mdash; most recently
                moving into a prescribing role within a GP practice.
              </p>

              <p className="text-gray-600 leading-relaxed mb-4">
                His understanding of PGDs stretches back to 2011, when the Welsh
                NHS established an emergency contraception PGD and began
                championing community pharmacy&apos;s unique accessibility for
                patients. He has seen first-hand how PGD-delivered services have
                expanded across the sector ever since.
              </p>

              <p className="text-gray-600 leading-relaxed mb-4">
                In an evolving pharmacy landscape &mdash; where newly qualified
                pharmacists will join the register as independent prescribers
                &mdash; Christopher believes private PGDs offer a dual
                advantage: enabling experienced pharmacists to fully utilise
                their clinical skills while providing newly qualified IPs with
                the training, guidelines, and clinical frameworks they need as
                they expand their scope.
              </p>

              <p className="text-gray-600 leading-relaxed mb-6">
                At Get Real Health, Christopher oversees PGD implementation,
                pharmacist training standards, and day-to-day clinical
                governance &mdash; ensuring every partner pharmacy delivers
                services that are safe, consistent, and built to last.
              </p>

              <blockquote className="border-l-4 border-teal-500 pl-5 py-2">
                <p className="text-navy-800 italic leading-relaxed">
                  &ldquo;Private PGDs let experienced pharmacists do what
                  they&apos;ve always been capable of &mdash; and give the next
                  generation a clinical framework to grow into.&rdquo;
                </p>
              </blockquote>
            </div>

            {/* Right: Photo */}
            <div className="lg:col-span-2 flex justify-center order-1 lg:order-2">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-teal-200/40 to-navy-200/40 rounded-2xl blur-lg" />
                <div className="relative w-72 h-80 sm:w-80 sm:h-96 rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/chris-pilkington.jpg"
                    alt="Christopher Pilkington — Head Pharmacist at Get Real Health"
                    fill
                    className="object-cover"
                    style={{ objectPosition: "50% 20%" }}
                    sizes="(max-width: 768px) 288px, 320px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CPD ACCREDITATION BANNER ────────────────────────────── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8">
            {/* Badge */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-teal-400 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-teal-400 text-sm font-semibold uppercase tracking-wider mb-2">
                Pharmacist training built in
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Online videos and training with every PGD
              </h2>
              <p className="text-blue-200 leading-relaxed mb-4">
                Every PGD comes with online video training and a written
                competency assessment, so every clinician using our PGDs is
                demonstrably ready to deliver safe, effective consultations
                before they go live.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                <span className="inline-flex items-center gap-1.5 text-teal-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Online video training modules
                </span>
                <span className="inline-flex items-center gap-1.5 text-teal-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Written competency assessment
                </span>
                <span className="inline-flex items-center gap-1.5 text-teal-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Included with every PGD
                </span>
              </div>
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
              A structured, supported onboarding &mdash; not a multi-month
              implementation project.
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
                Start consulting using our built-in ePGD. We provide marketing
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
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mb-4">
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
              <h3 className="text-lg font-bold text-navy-900 mb-2">
                NHS funding shortfall
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Community pharmacies are facing a sustained NHS funding gap
                &mdash; the kind of pressure that&apos;s closing branches and
                forcing diversification beyond traditional dispensing.
              </p>
            </div>

            {/* Revenue card */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
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
              <h3 className="text-lg font-bold text-navy-900 mb-2">
                PGD revenue opportunity
              </h3>
              <p className="text-gray-600 leading-relaxed">
                A well-run private PGD service can become a meaningful,
                recurring revenue stream &mdash; covering staff time,
                contributing to overheads, and reducing dependency on
                prescription margin.
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

      {/* ── PRICING COMPARISON TOOL ────────────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
              Compare the true cost
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Other providers charge &pound;2,592&ndash;&pound;2,639 per
              pharmacy per year (inc. VAT), paid upfront. With GRH you pay a
              lower flat monthly fee + VAT &mdash; minimum 12-month contract, no upfront lump sum.
            </p>
          </div>
          <SavingsCalculator compact />
          <div className="text-center mt-8">
            <Link
              href="/for-pharmacies/pricing"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold transition-colors"
            >
              See full pricing details
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
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
            One flat-fee package. Every PGD, the consultation tool,
            training and clinical support &mdash; all included.
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
