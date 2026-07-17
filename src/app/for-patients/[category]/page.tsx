import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  patientCategories,
  getCategoryBySlug,
} from "@/data/patient-services";

// Generate static pages for every category at build time
export function generateStaticParams() {
  return patientCategories.map((cat) => ({ category: cat.slug }));
}

// Dynamic metadata per category
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryBySlug(category);
  if (!cat) return {};
  return {
    title: cat.seoTitle,
    description: cat.seoDescription,
    alternates: { canonical: `/for-patients/${category}` },
    openGraph: {
      title: cat.seoTitle,
      description: cat.seoDescription,
      images: ["/og-image.png"],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  // Find related categories (exclude current, pick up to 3)
  const related = patientCategories
    .filter((c) => c.slug !== cat.slug)
    .slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className={`${cat.color} border-b border-gray-200`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <Link
            href="/for-patients"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            All services
          </Link>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl" role="img" aria-label={cat.name}>
              {cat.icon}
            </span>
            <h1 className={`text-3xl sm:text-4xl font-bold ${cat.textColor}`}>
              {cat.name}
            </h1>
          </div>
          <p className="text-gray-700 text-lg max-w-2xl">{cat.description}</p>
        </div>
      </section>

      {/* POM Disclaimer */}
      {cat.pomDisclaimer && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-amber-800 text-sm">
              Some services in this category involve prescription-only medicines (POMs). These are supplied under a Patient Group Direction (PGD) by a qualified, registered pharmacist following a clinical consultation.
            </p>
          </div>
        </div>
      )}

      {/* Services list */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-bold text-navy-900 mb-6">
          Services available
        </h2>
        <div className="space-y-3">
          {cat.popularServices.map((service) => (
            <div
              key={service}
              className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl"
            >
              <svg
                className="w-5 h-5 text-teal-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-800">{service}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why pharmacy */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold text-navy-900 mb-3">
            Why get this at your pharmacy?
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            {cat.whyPharmacy}
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                label: "No GP referral",
                desc: "Book directly with your pharmacy",
              },
              {
                label: "Same-day access",
                desc: "Many pharmacies offer walk-in or same-day appointments",
              },
              {
                label: "Private & confidential",
                desc: "Consultations in a private room with a qualified pharmacist",
              },
            ].map((point) => (
              <div key={point.label} className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="font-semibold text-navy-900 text-sm mb-1">
                  {point.label}
                </p>
                <p className="text-gray-500 text-xs">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Find a pharmacy CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-navy-900 mb-2">
          Ready to book?
        </h2>
        <p className="text-gray-600 mb-6">
          Find a pharmacy offering {cat.name.toLowerCase()} services near you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/for-patients/find-service"
            className="px-7 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Find a pharmacy near me
          </Link>
          <Link
            href="/contact"
            className="px-7 py-3 bg-white border border-gray-200 hover:border-gray-300 text-navy-900 font-semibold rounded-lg transition-colors text-sm"
          >
            Ask us a question
          </Link>
        </div>
      </section>

      {/* Related categories */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-lg font-bold mb-6">
            Other services you might need
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/for-patients/${rel.slug}`}
                className="bg-navy-900 hover:bg-navy-800 rounded-xl p-4 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{rel.icon}</span>
                  <h3 className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                    {rel.name}
                  </h3>
                </div>
                <p className="text-blue-200 text-sm">{rel.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
