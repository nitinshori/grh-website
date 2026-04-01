import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Founded by the Medical Director who built the UK\u2019s first online GLP-1 and TRT prescribing service at Pharmacy2U. Learn about our story, values, and team.",
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
            UK&apos;s largest online pharmacy &mdash; and built its online doctor
            service from the ground up. In 2016, that meant designing the clinical
            governance for GLP-1 weight management, testosterone replacement
            therapy, and erectile dysfunction medications prescribed entirely
            online. At the time, it hadn&apos;t been done in UK pharmacy before.
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

      {/* ── TEAM PLACEHOLDER ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-10 text-center">
          Our team
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              name: "Founder & Medical Director",
              role: "Clinical Lead",
              bio: "Former Medical Director of Pharmacy2U. Built the UK\u2019s first online GLP-1, TRT, and ED prescribing service.",
            },
            {
              name: "Chief Operating Officer",
              role: "Operations",
              bio: "Experienced in scaling pharmacy operations and clinical service delivery across the UK.",
            },
            {
              name: "Head of Clinical Governance",
              role: "Governance",
              bio: "Specialist in PGD writing, MHRA compliance, and pharmacist training programme design.",
            },
          ].map((member, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="h-48 bg-navy-100 flex items-center justify-center">
                <svg
                  className="w-20 h-20 text-navy-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-navy-900 mb-1">{member.name}</h3>
                <p className="text-sm text-teal-600 font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REGULATORY ─────────────────────────────────────── */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-xl font-bold mb-4">CQC &amp; Regulatory Status</h2>
          <p className="text-blue-200 leading-relaxed">
            Get Real Health is registered with the Care Quality Commission as an
            Independent Medical Agency. Our Patient Group Directions are written
            and governed in accordance with Human Medicines Regulations 2012 and
            MHRA guidance.
          </p>
        </div>
      </section>
    </>
  );
}
