"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  pgds,
  ALL_CATEGORIES,
  CATEGORY_TEXT_COLORS,
  CATEGORY_BG_LIGHT,
  type PGDCategory,
  type PGD,
} from "@/data/pgds";

type FilterOption = "All" | "Exclusives" | PGDCategory;

// Priority ordering for the default "All" view. The groups are applied in order:
// everything matching the first group lands at the top, then the next group, etc.
// Anything not matched falls through to a popularity sort by the PGD's `priority`
// field (1 = most popular, 3 = niche).
//
// Ordering updated 18 Apr 2026 per Nitin: testosterone, weight, ED and
// menopause/HRT are the headline services; travel alongside them.
const PRIORITY_GROUPS: Array<(p: PGD) => boolean> = [
  (p) => /Testosterone|\bTRT\b/i.test(p.title),
  (p) => p.category === "Weight Management",
  (p) => /Erectile Dysfunction/i.test(p.title),
  (p) => /\bHRT\b|Menopaus|Testosterone for Women/i.test(p.title),
  (p) => p.category === "Travel",
  (p) => /Premature Ejaculation/i.test(p.title),
  (p) => /Anxiety/i.test(p.title),
  (p) => /Sleep/i.test(p.title),
];

function sortedForAllView(list: PGD[]): PGD[] {
  const seen = new Set<string>();
  const ordered: PGD[] = [];
  for (const match of PRIORITY_GROUPS) {
    for (const p of list) {
      if (!seen.has(p.id) && match(p)) {
        ordered.push(p);
        seen.add(p.id);
      }
    }
  }
  const remaining = list
    .filter((p) => !seen.has(p.id))
    .sort((a, b) => a.priority - b.priority);
  return [...ordered, ...remaining];
}

export function PGDCatalogueClient() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [selectedPGDs, setSelectedPGDs] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (activeFilter === "All") return sortedForAllView(pgds);
    if (activeFilter === "Exclusives") return pgds.filter((p) => p.isNew);
    return pgds.filter((p) => p.category === activeFilter);
  }, [activeFilter]);

  const togglePGD = (id: string) => {
    setSelectedPGDs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedItems = pgds.filter((p) => selectedPGDs.has(p.id));
  const selectedCount = selectedItems.length;

  const exclusiveCount = pgds.filter((p) => p.isNew).length;
  const filterOptions: FilterOption[] = ["All", "Exclusives", ...ALL_CATEGORIES];

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3">
            {exclusiveCount} PGDs you won&apos;t find on other providers
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">PGD Catalogue</h1>
          <p className="text-lg text-blue-200 max-w-2xl">
            {pgds.length}+ PGDs across {ALL_CATEGORIES.length} categories. We
            lead with the highest-demand private services &mdash; testosterone,
            weight management, ED, menopause &amp; HRT, and travel health
            &mdash; then everything else in popularity order. Build your list
            and request a tailored quote.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-8 sticky top-16 lg:top-20 bg-white py-3 z-10 border-b border-gray-100">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option;
            const count =
              option === "All"
                ? pgds.length
                : option === "Exclusives"
                  ? exclusiveCount
                  : pgds.filter((p) => p.category === option).length;

            return (
              <button
                key={option}
                onClick={() => setActiveFilter(option)}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                  isActive
                    ? option === "Exclusives"
                      ? "bg-teal-500 text-white"
                      : "bg-navy-900 text-white"
                    : option === "Exclusives"
                      ? "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-8">
          {/* Cards grid */}
          <div className="flex-1">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((pgd) => (
                <PGDCard
                  key={pgd.id}
                  pgd={pgd}
                  selected={selectedPGDs.has(pgd.id)}
                  onToggle={() => togglePGD(pgd.id)}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-12">
                No services found for this filter.
              </p>
            )}
          </div>

          {/* Sticky enquiry sidebar (desktop) */}
          <aside className="hidden xl:block w-80 shrink-0">
            <div className="sticky top-32 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-navy-900 mb-1">Your enquiry list</h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedCount === 0
                  ? "Click \u201cAdd\u201d on any service to build your list."
                  : `${selectedCount} service${selectedCount !== 1 ? "s" : ""} selected`}
              </p>

              {selectedCount > 0 && (
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {selectedItems.map((pgd) => (
                    <div
                      key={pgd.id}
                      className="flex items-center justify-between text-sm py-1.5"
                    >
                      <span className="text-gray-700 truncate pr-2">
                        {pgd.title}
                      </span>
                      <button
                        onClick={() => togglePGD(pgd.id)}
                        className="text-red-400 hover:text-red-600 shrink-0 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/contact"
                className={`block w-full text-center px-4 py-3 rounded-lg font-semibold text-sm transition-colors ${
                  selectedCount > 0
                    ? "bg-teal-500 hover:bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {selectedCount > 0
                  ? `Request these ${selectedCount} PGDs`
                  : "Select services to enquire"}
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bar */}
      {selectedCount > 0 && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span className="text-sm font-medium text-navy-900">
              {selectedCount} service{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              Request these PGDs
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function PGDCard({
  pgd,
  selected,
  onToggle,
}: {
  pgd: PGD;
  selected: boolean;
  onToggle: () => void;
}) {
  const catColor = CATEGORY_TEXT_COLORS[pgd.category] || "text-gray-600";
  const catBg = CATEGORY_BG_LIGHT[pgd.category] || "bg-gray-50";

  return (
    <div
      className={`relative border rounded-xl p-5 transition-all ${
        selected
          ? "border-teal-400 bg-teal-50/30 shadow-md"
          : "border-gray-100 bg-white hover:shadow-sm"
      }`}
    >
      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catBg} ${catColor}`}
        >
          {pgd.category}
        </span>
        {pgd.isNew && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
            Exclusive
          </span>
        )}
        {pgd.pharmadoctor.startsWith("No") && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
            Not on competitor
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-navy-900 mb-2 text-sm leading-snug">
        {pgd.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-3">
        {pgd.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span title="Consultation time">{pgd.consultTime}</span>
      </div>

      {/* Add/Remove button */}
      <button
        onClick={onToggle}
        className={`w-full text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          selected
            ? "bg-teal-500 text-white hover:bg-teal-600"
            : "bg-gray-50 text-navy-900 hover:bg-gray-100 border border-gray-200"
        }`}
      >
        {selected ? "\u2713 Added to enquiry" : "Add to enquiry"}
      </button>
    </div>
  );
}
