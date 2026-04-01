import type { Metadata } from "next";
import Link from "next/link";
import { articles, ARTICLE_CATEGORIES } from "@/data/articles";

export const metadata: Metadata = {
  title: "Resources — Education Hub",
  description:
    "Everything you need to know about PGDs — written for pharmacists. Free guides, articles, and compliance checklists.",
};

const categoryColors: Record<string, string> = {
  "PGD Fundamentals": "bg-blue-100 text-blue-700",
  "Revenue & Growth": "bg-emerald-100 text-emerald-700",
  "Clinical Services": "bg-purple-100 text-purple-700",
  Compliance: "bg-amber-100 text-amber-700",
  Industry: "bg-gray-100 text-gray-700",
};

export default function ResourcesPage() {
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Education Hub
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl">
            Practical guides, compliance checklists, and revenue strategies —
            written for UK pharmacists by people who understand the business.
          </p>
        </div>
      </section>

      {/* Category pills */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-wrap gap-2">
          {ARTICLE_CATEGORIES.map((cat) => (
            <span
              key={cat}
              className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[cat] || "bg-gray-100 text-gray-700"}`}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Featured article */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/resources/${featured.slug}`}
          className="block bg-navy-50 border border-navy-100 rounded-xl p-6 sm:p-8 hover:shadow-lg transition-shadow group"
        >
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[featured.category] || "bg-gray-100 text-gray-700"} mb-3`}
          >
            {featured.category}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 group-hover:text-teal-700 transition-colors mb-2">
            {featured.title}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-3 max-w-2xl">
            {featured.description}
          </p>
          <span className="text-sm text-gray-400">{featured.readTime}</span>
        </Link>
      </section>

      {/* Article grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((article) => (
            <Link
              key={article.slug}
              href={`/resources/${article.slug}`}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all group flex flex-col"
            >
              <span
                className={`inline-block self-start px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[article.category] || "bg-gray-100 text-gray-700"} mb-3`}
              >
                {article.category}
              </span>
              <h3 className="font-bold text-navy-900 group-hover:text-teal-700 transition-colors mb-2 leading-snug">
                {article.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-3 flex-1">
                {article.description}
              </p>
              <span className="text-xs text-gray-400">
                {article.readTime}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">
            Ready to put this into practice?
          </h2>
          <p className="text-teal-100 mb-6">
            See how Get Real Health gives you the PGDs, platform, and support to
            grow your pharmacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/for-pharmacies/pgd-catalogue"
              className="px-7 py-3 bg-white text-teal-700 font-semibold rounded-lg hover:bg-teal-50 transition-colors text-sm"
            >
              Browse our PGDs
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
