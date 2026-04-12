"use client";

import { useState, useMemo } from "react";

/* ── Competitor benchmark ────────────────────────────────────────
   Based on publicly listed pricing from a leading UK PGD provider.
   Their "Unlimited Clinic Package" (60+ services):
     • £2,639 per pharmacy per year (inc. VAT)
     • No per-consultation fee on the unlimited package               */
const COMPETITOR_ANNUAL = 2639; // inc. VAT

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

  // ── Competitor costs ──────────────────────────────────────
  const competitorAnnualTotal = COMPETITOR_ANNUAL * pharmacyCount;
  const competitorMonthlyEquiv = competitorAnnualTotal / 12;

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
  const savingPct =
    competitorAnnualTotal > 0
      ? Math.round((annualSaving / competitorAnnualTotal) * 100)
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
            : "Estimate your savings vs a leading competitor"}
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

      {/* ── Side-by-side comparison ───────────────────────────── */}
      <div className="bg-navy-950 text-white p-6 sm:p-8">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* ── Competitor column ──────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-xs text-red-300 uppercase tracking-wide font-semibold mb-4">
              A leading competitor
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">
                  Annual fee per pharmacy
                </span>
                <span className="text-sm font-semibold text-white">
                  &pound;{fmt(COMPETITOR_ANNUAL)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">
                  Per-consultation charge
                </span>
                <span className="text-sm text-blue-200">
                  Included
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">Payment</span>
                <span className="text-sm text-blue-200">
                  Upfront annual
                </span>
              </div>
              <div className="pt-3 border-t border-white/10">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-blue-200">Monthly equiv.</span>
                  <span className="text-lg font-bold text-red-400">
                    &pound;{fmt(Math.round(competitorMonthlyEquiv))}
                  </span>
                </div>
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
            <p className="text-xs text-teal-400 uppercase tracking-wide font-semibold mb-4">
              Get Real Health
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">
                  Monthly fee per pharmacy
                </span>
                {isCustom ? (
                  <span className="text-sm font-semibold text-teal-400">
                    Custom
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-white">
                    &pound;{grhTier.monthlyPerPharmacy}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">
                  Per-consultation charge
                </span>
                <span className="text-sm font-bold text-teal-400">
                  &pound;0 &mdash; ever
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-blue-200">Payment</span>
                <span className="text-sm text-teal-300">Monthly rolling</span>
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
                {!isCustom && pharmacyCount > 1 && (
                  <p className="text-xs text-blue-300 mt-1 text-right">
                    {grhTier.name}: &pound;{grhTier.monthlyPerPharmacy} &times;{" "}
                    {pharmacyCount}
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
                {savingPct}% less
              </span>{" "}
              than a leading competitor
              {pharmacyCount > 1 && (
                <>
                  {" "}&mdash;{" "}
                  <span className="text-green-400 font-semibold">
                    &pound;{fmt(perPharmacyAnnualSaving)}
                  </span>{" "}
                  saved per pharmacy
                </>
              )}
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

        <p className="text-center text-xs text-blue-300 mt-6 pt-4 border-t border-blue-900">
          Competitor pricing based on their publicly listed Unlimited Clinic
          Package (&pound;{fmt(COMPETITOR_ANNUAL)}/yr per pharmacy, inc.
          VAT). Your actual savings may vary.{" "}
          <a href="/contact" className="text-teal-400 underline">
            Get your exact quote &rarr;
          </a>
        </p>
      </div>
    </div>
  );
}
