"use client";

import { useState, useMemo } from "react";

/* ── Competitor benchmark ────────────────────────────────────────
   Based on publicly listed pricing from a leading UK PGD provider.
   Their "Unlimited Clinic Package" (60+ services):
     • £2,199 + VAT per pharmacy per year  (= £2,638.80 inc. VAT)
     • Plus £4–6.50 per consultation on top                          */
const COMPETITOR_ANNUAL_FEE = 2639; // £2,199 + 20% VAT, rounded
const COMPETITOR_PER_CONSULT = 6.5; // £ per consultation (upper end)

const servicePresets = [
  { label: "Travel vaccines", defaultVolume: 30 },
  { label: "Flu jabs", defaultVolume: 50 },
  { label: "Weight management", defaultVolume: 20 },
  { label: "UTI consultations", defaultVolume: 15 },
  { label: "Other PGD services", defaultVolume: 10 },
];

// GRH pricing tiers: £/pharmacy/month
const GRH_PRICING = {
  singleSite: 125, // 1–5 pharmacies
  group: 109, // 6–15 pharmacies
  enterprise: 99, // 16–30 pharmacies
  // 30+ = custom
};

function getGRHTier(pharmacyCount: number): {
  name: string;
  monthlyPerPharmacy: number;
} {
  if (pharmacyCount <= 5) {
    return { name: "Single Site", monthlyPerPharmacy: GRH_PRICING.singleSite };
  } else if (pharmacyCount <= 15) {
    return { name: "Group", monthlyPerPharmacy: GRH_PRICING.group };
  } else if (pharmacyCount <= 30) {
    return { name: "Enterprise", monthlyPerPharmacy: GRH_PRICING.enterprise };
  } else {
    return { name: "Network", monthlyPerPharmacy: 0 }; // Custom pricing
  }
}

export function SavingsCalculator({ compact = false }: { compact?: boolean }) {
  const [volumes, setVolumes] = useState<number[]>(
    servicePresets.map((s) => s.defaultVolume)
  );
  const [pharmacyCount, setPharmacyCount] = useState(1);

  const totalConsults = useMemo(
    () => volumes.reduce((sum, v) => sum + v, 0),
    [volumes]
  );

  // ── Competitor costs ──────────────────────────────────────
  const competitorAnnualPlatform = COMPETITOR_ANNUAL_FEE * pharmacyCount;
  const competitorAnnualConsults =
    totalConsults * pharmacyCount * COMPETITOR_PER_CONSULT * 12;
  const competitorAnnualTotal =
    competitorAnnualPlatform + competitorAnnualConsults;
  const competitorMonthlyTotal = competitorAnnualTotal / 12;

  // ── GRH costs ─────────────────────────────────────────────
  const grhTier = getGRHTier(pharmacyCount);
  const isCustom = pharmacyCount > 30;
  const grhMonthlyFee = isCustom
    ? 0
    : grhTier.monthlyPerPharmacy * pharmacyCount;
  const grhAnnualFee = grhMonthlyFee * 12;

  // ── Savings ───────────────────────────────────────────────
  const annualSaving = competitorAnnualTotal - grhAnnualFee;
  const perPharmacyAnnualSaving =
    pharmacyCount > 0 ? annualSaving / pharmacyCount : 0;

  const updateVolume = (index: number, value: string) => {
    const parsed = parseInt(value, 10);
    setVolumes((prev) => {
      const next = [...prev];
      next[index] = isNaN(parsed) ? 0 : Math.max(0, Math.min(9999, parsed));
      return next;
    });
  };

  const updatePharmacyCount = (value: string) => {
    const parsed = parseInt(value, 10);
    setPharmacyCount(isNaN(parsed) ? 1 : Math.max(1, Math.min(999, parsed)));
  };

  const fmt = (n: number) =>
    n.toLocaleString("en-GB", { maximumFractionDigits: 0 });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ── Input section ─────────────────────────────────────── */}
      <div className="p-6 sm:p-8">
        <h3 className="text-lg font-bold text-navy-900 mb-1">
          {compact
            ? "See how much you could save"
            : "Estimate your savings vs a leading competitor"}
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Enter your pharmacy count and estimated monthly consultation volumes
          to see a side-by-side cost comparison.
        </p>

        {/* Pharmacy count */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <label className="block text-sm text-gray-700 font-semibold mb-2">
            Number of pharmacies
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={999}
              value={pharmacyCount}
              onChange={(e) => updatePharmacyCount(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">
              {pharmacyCount === 1 ? "pharmacy" : "pharmacies"} (
              {grhTier.name} tier)
            </span>
          </div>
        </div>

        {/* Consultation volumes */}
        <h4 className="text-sm font-semibold text-gray-700 mb-4">
          Monthly consultation volumes{" "}
          <span className="font-normal text-gray-400">(per pharmacy)</span>
        </h4>
        <div className="space-y-4">
          {servicePresets.map((service, i) => (
            <div
              key={service.label}
              className="flex items-center justify-between gap-4"
            >
              <label className="text-sm text-gray-700 flex-1">
                {service.label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={volumes[i]}
                  onChange={(e) => updateVolume(i, e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
                <span className="text-xs text-gray-400 w-12">/month</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-navy-900">
            Total monthly consultations
          </span>
          <span className="text-xl font-bold text-navy-900">
            {fmt(totalConsults * pharmacyCount)}
          </span>
        </div>
      </div>

      {/* ── Side-by-side comparison ───────────────────────────── */}
      <div className="bg-navy-950 text-white p-6 sm:p-8">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* ── Competitor column ──────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-xs text-red-300 uppercase tracking-wide font-semibold mb-3">
              A leading competitor
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">Annual access fee</span>
                <span className="text-sm font-semibold text-white">
                  &pound;{fmt(COMPETITOR_ANNUAL_FEE)}{" "}
                  <span className="text-blue-300 font-normal">
                    &times;&nbsp;{pharmacyCount}
                  </span>
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">Per-consultation charge</span>
                <span className="text-sm font-semibold text-white">
                  &pound;{COMPETITOR_PER_CONSULT.toFixed(2)}{" "}
                  <span className="text-blue-300 font-normal">per consult</span>
                </span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-blue-200">Monthly equiv.</span>
                  <span className="text-lg font-bold text-red-400">
                    &pound;{fmt(Math.round(competitorMonthlyTotal))}
                  </span>
                </div>
                <p className="text-xs text-blue-300 mt-1 text-right">
                  &pound;{fmt(Math.round(competitorAnnualPlatform / 12))} access
                  + &pound;{fmt(Math.round(competitorAnnualConsults / 12))} consults
                </p>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-blue-200">
                  Annual total
                </span>
                <span className="text-xl font-bold text-red-400">
                  &pound;{fmt(competitorAnnualTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ── GRH column ────────────────────────────────────── */}
          <div className="bg-teal-500/10 border border-teal-400/20 rounded-xl p-6">
            <p className="text-xs text-teal-400 uppercase tracking-wide font-semibold mb-3">
              Get Real Health
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">Monthly fee</span>
                {isCustom ? (
                  <span className="text-sm font-semibold text-teal-400">
                    Custom
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-white">
                    &pound;{grhTier.monthlyPerPharmacy}{" "}
                    <span className="text-blue-300 font-normal">
                      &times;&nbsp;{pharmacyCount}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">Per-consultation charge</span>
                <span className="text-sm font-bold text-teal-400">
                  &pound;0.00
                </span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-blue-200">Monthly total</span>
                  {isCustom ? (
                    <span className="text-lg font-bold text-teal-400">
                      Custom
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-teal-400">
                      &pound;{fmt(grhMonthlyFee)}
                    </span>
                  )}
                </div>
                {!isCustom && (
                  <p className="text-xs text-blue-300 mt-1 text-right">
                    {grhTier.name}: &pound;{grhTier.monthlyPerPharmacy}/pharmacy/month
                  </p>
                )}
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-blue-200">
                  Annual total
                </span>
                {isCustom ? (
                  <span className="text-xl font-bold text-teal-400">
                    Custom
                  </span>
                ) : (
                  <span className="text-xl font-bold text-teal-400">
                    &pound;{fmt(grhAnnualFee)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Savings banner ──────────────────────────────────── */}
        {!isCustom && annualSaving > 0 && (
          <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-6 text-center">
            <p className="text-xs text-green-300 uppercase tracking-wide font-semibold mb-2">
              Your estimated annual saving
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-green-400 mb-1">
              &pound;{fmt(annualSaving)}
            </p>
            <p className="text-sm text-blue-200">
              That&apos;s{" "}
              <span className="text-green-400 font-semibold">
                &pound;{fmt(perPharmacyAnnualSaving)}
              </span>{" "}
              saved per pharmacy, per year
            </p>
          </div>
        )}

        {isCustom && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <p className="text-blue-200 mb-3">
              Your network qualifies for custom Network pricing.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg transition-colors"
            >
              Get a tailored quote
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
            </a>
          </div>
        )}

        <p className="text-center text-xs text-blue-300 mt-6 pt-4 border-t border-blue-900">
          Competitor pricing based on their publicly listed Unlimited Clinic
          Package (&pound;2,199&nbsp;+&nbsp;VAT/yr) plus per-consultation
          charges. Your actual savings may vary.{" "}
          <a href="/contact" className="text-teal-400 underline">
            Get your exact quote &rarr;
          </a>
        </p>
      </div>
    </div>
  );
}
