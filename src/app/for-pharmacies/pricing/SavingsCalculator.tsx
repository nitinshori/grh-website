"use client";

import { useState } from "react";

/* ── Competitor benchmarks ──────────────────────────────────────
   Based on publicly listed pricing from two leading UK PGD providers.

   Competitor A — "All-in-one provider"
     • £2,639 per pharmacy per year (inc. VAT)
     • 60+ services, paid upfront annually
     • No per-consultation fee on unlimited package

   Competitor B — "Per-PGD + platform provider"
     • £2,160 per pharmacy per year for their Advanced bundle
       (appointments, Rx, deliveries, PGDs, eCommerce)
     • Or lower tiers from £1,699/yr (PGD-only plan)
     • Separate platform subscription required for digital workflow      */
const COMPETITOR_A_ANNUAL = 2639; // all-in-one, inc. VAT
const COMPETITOR_B_ANNUAL = 2160; // Advanced bundle (ePGDs + full platform)

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
  const [pharmacyCount, setPharmacyCount] = useState(1);

  // ── Competitor A costs ────────────────────────────────────
  const compAAnnualTotal = COMPETITOR_A_ANNUAL * pharmacyCount;
  const compAMonthlyEquiv = compAAnnualTotal / 12;

  // ── Competitor B costs ────────────────────────────────────
  const compBAnnualTotal = COMPETITOR_B_ANNUAL * pharmacyCount;
  const compBMonthlyEquiv = compBAnnualTotal / 12;

  // ── GRH costs ─────────────────────────────────────────────
  const grhTier = getGRHTier(pharmacyCount);
  const isCustom = pharmacyCount > 30;
  const grhMonthlyFee = isCustom
    ? 0
    : grhTier.monthlyPerPharmacy * pharmacyCount;
  const grhAnnualFee = grhMonthlyFee * 12;

  // ── Savings (vs most expensive competitor) ────────────────
  const savingVsA = compAAnnualTotal - grhAnnualFee;
  const savingVsB = compBAnnualTotal - grhAnnualFee;
  const savingPctA =
    compAAnnualTotal > 0
      ? Math.round((savingVsA / compAAnnualTotal) * 100)
      : 0;
  const savingPctB =
    compBAnnualTotal > 0
      ? Math.round((savingVsB / compBAnnualTotal) * 100)
      : 0;

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
            : "Estimate your savings vs other providers"}
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Enter your pharmacy count to see a side-by-side annual cost
          comparison.
        </p>

        {/* Pharmacy count */}
        <div>
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
      </div>

      {/* ── Three-column comparison ─────────────────────────── */}
      <div className="bg-navy-950 text-white p-6 sm:p-8">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* ── Competitor A ──────────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-red-300 uppercase tracking-wide font-semibold mb-1">
              Provider A
            </p>
            <p className="text-[11px] text-blue-300 mb-4">
              All-in-one annual package
            </p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">
                  Annual fee
                </span>
                <span className="text-xs font-semibold text-white">
                  &pound;{fmt(COMPETITOR_A_ANNUAL)}/pharmacy
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">
                  Services
                </span>
                <span className="text-xs text-blue-200">60+</span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">Payment</span>
                <span className="text-xs text-blue-200">
                  Upfront annual
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">Training</span>
                <span className="text-xs text-blue-200">
                  Not included
                </span>
              </div>
              <div className="pt-2.5 border-t border-white/10">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs text-blue-200">Monthly equiv.</span>
                  <span className="text-base font-bold text-red-400">
                    &pound;{fmt(Math.round(compAMonthlyEquiv))}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs font-semibold text-blue-200">
                  Annual total
                </span>
                <span className="text-lg font-bold text-red-400">
                  &pound;{fmt(compAAnnualTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Competitor B ──────────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <p className="text-xs text-amber-300 uppercase tracking-wide font-semibold mb-1">
              Provider B
            </p>
            <p className="text-[11px] text-blue-300 mb-4">
              PGDs + platform bundle
            </p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">
                  Annual fee
                </span>
                <span className="text-xs font-semibold text-white">
                  &pound;{fmt(COMPETITOR_B_ANNUAL)}/pharmacy
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">
                  Services
                </span>
                <span className="text-xs text-blue-200">44+</span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">Payment</span>
                <span className="text-xs text-blue-200">
                  Annual subscription
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">Training</span>
                <span className="text-xs text-blue-200">
                  Separate cost
                </span>
              </div>
              <div className="pt-2.5 border-t border-white/10">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs text-blue-200">Monthly equiv.</span>
                  <span className="text-base font-bold text-amber-400">
                    &pound;{fmt(Math.round(compBMonthlyEquiv))}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs font-semibold text-blue-200">
                  Annual total
                </span>
                <span className="text-lg font-bold text-amber-400">
                  &pound;{fmt(compBAnnualTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ── GRH column ────────────────────────────────────── */}
          <div className="bg-teal-500/10 border border-teal-400/20 rounded-xl p-5">
            <p className="text-xs text-teal-400 uppercase tracking-wide font-semibold mb-1">
              Get Real Health
            </p>
            <p className="text-[11px] text-blue-300 mb-4">
              Flat monthly fee, everything included
            </p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">
                  Monthly fee
                </span>
                {isCustom ? (
                  <span className="text-xs font-semibold text-teal-400">
                    Custom
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-white">
                    &pound;{grhTier.monthlyPerPharmacy}/pharmacy
                  </span>
                )}
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">
                  Services
                </span>
                <span className="text-xs font-bold text-teal-400">60+</span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">Payment</span>
                <span className="text-xs text-teal-300">
                  Monthly rolling
                </span>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs text-blue-200">Training</span>
                <span className="text-xs font-bold text-teal-400">
                  Included
                </span>
              </div>
              <div className="pt-2.5 border-t border-white/10">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-xs text-blue-200">Monthly total</span>
                  {isCustom ? (
                    <span className="text-base font-bold text-teal-400">
                      Custom
                    </span>
                  ) : (
                    <span className="text-base font-bold text-teal-400">
                      &pound;{fmt(grhMonthlyFee)}
                    </span>
                  )}
                </div>
                {!isCustom && pharmacyCount > 1 && (
                  <p className="text-[10px] text-blue-300 mt-0.5 text-right">
                    {grhTier.name}: &pound;{grhTier.monthlyPerPharmacy} &times;{" "}
                    {pharmacyCount}
                  </p>
                )}
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-xs font-semibold text-blue-200">
                  Annual total
                </span>
                {isCustom ? (
                  <span className="text-lg font-bold text-teal-400">
                    Custom
                  </span>
                ) : (
                  <span className="text-lg font-bold text-teal-400">
                    &pound;{fmt(grhAnnualFee)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Savings banner ──────────────────────────────────── */}
        {!isCustom && savingVsA > 0 && (
          <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-6 text-center">
            <p className="text-xs text-green-300 uppercase tracking-wide font-semibold mb-2">
              Your estimated annual savings
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-2">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-green-400">
                  &pound;{fmt(savingVsA)}
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  vs Provider A ({savingPctA}% less)
                </p>
              </div>
              {savingVsB > 0 && (
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-green-400">
                    &pound;{fmt(savingVsB)}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    vs Provider B ({savingPctB}% less)
                  </p>
                </div>
              )}
            </div>
            {pharmacyCount > 1 && (
              <p className="text-xs text-blue-300">
                &pound;{fmt(Math.round(savingVsA / pharmacyCount))} saved per
                pharmacy vs Provider A
              </p>
            )}
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

        {!isCustom && (
          <div className="mt-6 pt-5 border-t border-blue-900">
            <p className="text-xs text-blue-300 text-center mb-4">
              Plus, with GRH you also get &mdash; included in your monthly fee:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                "Built-in clinical training",
                "Competency assessments",
                "ePGD consultation tool",
                "Clinical support (Mon\u2013Fri)",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 text-xs text-blue-200"
                >
                  <svg
                    className="w-3.5 h-3.5 text-teal-400 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-blue-300 mt-6 pt-4 border-t border-blue-900">
          Competitor pricing based on publicly listed rates. Provider A:
          all-in-one annual package. Provider B: full platform bundle with
          ePGDs (44+ services). GRH includes 60+ PGDs, training, and
          clinical support. Your actual savings may vary.{" "}
          <a href="/contact" className="text-teal-400 underline">
            Get your exact quote &rarr;
          </a>
        </p>
      </div>
    </div>
  );
}
