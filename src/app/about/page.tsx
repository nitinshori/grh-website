import type { Metadata } from "next";
import Image from "next/image";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Founded by the former Medical Director of Pharmacy2U, who helped shape early online GLP-1 and TRT prescribing in UK pharmacy. Learn about our story, values, and team.",
};

const values = [
  "Pharmacies should own their patient relationships \u2014 not their software provider.",
  "Transparent pricing is a basic courtesy. We show ours without making you register.",
  "Clinical governance should feel like a safety net, not a surveillance system.",
  "A pharmacist\u2019s professional judgment should be supported, never replaced, by technology.",
];

export default function AboutPage() {
  return (
    <>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Our story
          </h1>
          <p className="text-xl text-blue-200 leading-relaxed">
            Built by people who&apos;ve actually delivered clinical services at
            scale &mdash; not people who read about it.
          </p>
        </div>
      </section>

      {/* ── FOUNDER STORY ──────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Our founder spent years as Medical Director of Pharmacy2U &mdash; the
            UK&apos;s largest online pharmacy &mdash; and helped build its online
            doctor service from the ground up. That work involved designing
            clinical governance for online prescribing of GLP-1 weight management,
            testosterone replacement therapy, and erectile dysfunction medications
            in the early days of UK online pharmacy.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            What that experience taught us is that clinical governance isn&apos;t
            a compliance burden &mdash; it&apos;s a commercial foundation.
            Pharmacies that run safe, well-governed services build patient trust,
            generate repeat revenue, and grow. Pharmacies that treat governance as
            an afterthought pay for it eventually.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            We built this company because the existing PGD providers weren&apos;t
            founded by people who&apos;d actually built these services at scale.
            They&apos;re compliance businesses. We&apos;re a clinical business.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            We believed there was a better model &mdash; one that put pharmacies
            in control of their own patient data, their own revenue, and their own
            business. So we built it.
          </p>
        </div>
      </section>

      {/* ── VALUES ─────────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-10 text-center">
            Our values
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="text-teal-500 text-xl mt-0.5">&#9679;</span>
                  <p className="text-gray-700 leading-relaxed">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-10 text-center">
          Our team
        </h2>
        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Dr Nitin Shori */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-64 relative">
              <Image
                src="/images/nitin-founder.jpg"
                alt="Dr Nitin Shori"
                fill
                className="object-cover"
                style={{ objectPosition: "65% 20%" }}
                sizes="320px"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-navy-900 mb-1">Dr Nitin Shori</h3>
              <p className="text-sm text-teal-600 font-medium mb-3">
                Founder &amp; Medical Director
              </p>
              <p className="text-sm text-gray-600">
                NHS GP Partner for over 20 years. Former Medical Director of
                Pharmacy2U, where he helped build its early online GLP-1,
                TRT, and ED prescribing services. Law degree holder.
              </p>
            </div>
          </div>

          {/* Christopher Pilkington */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-64 relative">
              <Image
                src="/images/chris-pilkington.jpg"
                alt="Christopher Pilkington"
                fill
                className="object-cover"
                style={{ objectPosition: "50% 20%" }}
                sizes="320px"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-navy-900 mb-1">Christopher Pilkington</h3>
              <p className="text-sm text-teal-600 font-medium mb-3">
                Head Pharmacist
              </p>
              <p className="text-sm text-gray-600">
                Over 30 years of community pharmacy experience across
                independents, multiples, and GP practice prescribing.
                Specialist in PGD implementation and pharmacist training.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── REGULATORY ─────────────────────────────────────── */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-xl font-bold mb-4">CQC &amp; Regulatory Status</h2>
          <p className="text-blue-200 leading-relaxed">
            {legal.companyName} is registered with the Care Quality Commission
            as an Independent Medical Agency (provider ID{" "}
            <a
              href={legal.cqcUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 underline-offset-2 hover:underline"
            >
              {legal.cqcProviderId}
            </a>
            ). Our Patient Group Directions are written and governed in
            accordance with Human Medicines Regulations 2012 and MHRA guidance.
          </p>
          <p className="text-sm text-blue-300 mt-4">
            Companies House registration:{" "}
            <a
              href={legal.companyHouseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 underline-offset-2 hover:underline"
            >
              {legal.companyNumber}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
