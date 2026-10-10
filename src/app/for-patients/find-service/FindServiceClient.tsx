"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { patientCategories } from "@/data/patient-services";

export function FindServiceClient() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return patientCategories;
    const q = searchQuery.toLowerCase();
    return patientCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.tagline.toLowerCase().includes(q) ||
        cat.popularServices.some((s) => s.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  return (
    <>
      {/* Hero / Search bar */}
      <section className="bg-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
            Find a service near you
          </h1>
          <p className="text-teal-100 text-center mb-8 max-w-lg mx-auto">
            Search by condition or service, or browse categories below.
          </p>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="e.g. travel vaccines, weight loss, UTI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {searchQuery && (
          <p className="text-sm text-gray-500 mb-4">
            {filteredCategories.length} categor
            {filteredCategories.length === 1 ? "y" : "ies"} matching &ldquo;
            {searchQuery}&rdquo;
          </p>
        )}

        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">
              No services found for &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-teal-600 font-medium text-sm underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/for-patients/${cat.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`w-10 h-10 flex items-center justify-center rounded-lg ${cat.color} text-xl`}
                  >
                    {cat.icon}
                  </span>
                  <h3 className="font-bold text-navy-900 group-hover:text-teal-700 transition-colors">
                    {cat.name}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  {cat.tagline}
                </p>
                <ul className="space-y-1">
                  {cat.popularServices.slice(0, 3).map((service) => (
                    <li
                      key={service}
                      className="text-xs text-gray-500 flex items-start gap-1.5"
                    >
                      <span className="text-teal-400 mt-0.5">•</span>
                      <span className="line-clamp-1">{service}</span>
                    </li>
                  ))}
                  {cat.popularServices.length > 3 && (
                    <li className="text-xs text-teal-600 font-medium pl-3">
                      +{cat.popularServices.length - 3} more services
                    </li>
                  )}
                </ul>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-xl font-bold text-navy-900 mb-2">
            Not sure what you need?
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Get in touch and we&apos;ll help you find the right service.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Contact us
          </Link>
        </div>
      </section>
    </>
  );
}
