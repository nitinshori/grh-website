"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  pgds as allPgds,
  ALL_CATEGORIES,
  CATEGORY_TEXT_COLORS,
  CATEGORY_BG_LIGHT,
  type PGDCategory,
  type PGD,
} from "@/data/pgds";
import { getPgdDocumentUrl } from "@/lib/pgd-documents";

// Public catalogue must never advertise restricted (private/pilot) PGDs.
const pgds = allPgds.filter((p) => !p.restrictedToEmails || p.restrictedToEmails.length === 0);

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

  const filtered = useMemo(() => {
    if (activeFilter === "All") return sortedForAllView(pgds);
    if (activeFilter === "Exclusives") return pgds.filter((p) => p.isNew);
    return pgds.filter((p) => p.category === activeFilter);
  }, [activeFilter]);

  const exclusiveCount = pgds.filter((p) => p.isNew).length;
  const filterOptions: FilterOption[] = ["All", "Exclusives", ...ALL_CATEGORIES];

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-3">
            {exclusiveCount} PGDs you won&apos;t find on other providers
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">PGD Catalogue</h1>
          <p className="text-lg text-blue-200 max-w-2xl mb-6">
            {pgds.length}+ PGDs across {ALL_CATEGORIES.length} categories.
            One flat-fee package. Every PGD included. No per-consultation
            charges, no hidden extras.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center px-6 py-3 bg-[color:var(--tenant-primary)]/100 hover:bg-[color:var(--tenant-primary)]/15 text-white font-semibold rounded-lg transition-colors text-base"
            >
              See a demo
            </Link>
            <Link
              href="/for-pharmacies/pricing"
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors text-base"
            >
              View pricing
            </Link>
          </div>
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
                      ? "bg-[color:var(--tenant-primary)]/100 text-white"
                      : "bg-navy-900 text-white"
                    : option === "Exclusives"
                      ? "bg-[color:var(--tenant-primary)]/10 text-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/20 border border-[color:var(--tenant-primary)]/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option}
                <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Cards grid — full width, no sidebar */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((pgd) => (
            <PGDCard key={pgd.id} pgd={pgd} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            No services found for this filter.
          </p>
        )}
      </div>

      {/* Bottom CTA */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-3">
            Every PGD above. One flat fee.
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            No per-consultation charges. No picking and choosing. Your team
            gets access to the full catalogue, the consultation tool, training
            and clinical governance &mdash; all included.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/demo"
              className="px-7 py-3.5 bg-[color:var(--tenant-primary)]/100 hover:bg-[color:var(--tenant-primary)]/15 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              See a demo
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg transition-colors text-lg"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function PGDCard({ pgd }: { pgd: PGD }) {
  const catColor = CATEGORY_TEXT_COLORS[pgd.category] || "text-gray-600";
  const catBg = CATEGORY_BG_LIGHT[pgd.category] || "bg-gray-50";

  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-white hover:shadow-sm transition-all flex flex-col">
      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catBg} ${catColor}`}
        >
          {pgd.category}
        </span>
        {pgd.isNew && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[color:var(--tenant-primary)]/15 text-[color:var(--tenant-primary)]">
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
      <div className="text-xs text-gray-500 mb-4">
        <span title="Consultation time">{pgd.consultTime}</span>
      </div>

      {/* Action links */}
      <div className="mt-auto flex flex-col gap-2">
        <Link
          href={`/for-pharmacies/epgd/${pgd.id}`}
          className="w-full text-center px-3 py-2 rounded-lg text-sm font-medium bg-[color:var(--tenant-primary)]/100 text-white hover:bg-[color:var(--tenant-primary)]/15 transition-colors"
        >
          Open ePGD tool
        </Link>
        {getPgdDocumentUrl(pgd.id) ? (
          // The signed PGD PDF itself — this used to point at the contact
          // page ("Let's Talk"), which read as a broken link to pharmacists
          // wanting to review the clinical document (reported by Moin).
          <a
            href={getPgdDocumentUrl(pgd.id)!}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-navy-900 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            View PGD document
          </a>
        ) : (
          <span className="w-full text-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-400 border border-gray-200">
            Document coming soon
          </span>
        )}
      </div>
    </div>
  );
}
