"use client";

import { useMemo, useState } from "react";

// Cost assumptions. Sources documented at the bottom of /cost-calculator page.
//
// GRH — flat £100 per pharmacy per month. Locums covered. No per-pharmacist fees.
// Pharmadoctor — typical SMB customer-reported price ~£2,639/yr inc. VAT per
//   pharmacy + per-pharmacist training fees for headline services (Wegovy /
//   Mounjaro / TRT / HRT). Mid-point of customer-reported training fees: ~£250
//   per pharmacist per year aggregated across services.
// ECG — modular PGD pricing typically ~£2,000/yr per pharmacy + per-pharmacist
//   training fees averaging ~£180/yr aggregated.
//
// These figures are deliberately conservative for the competitors — many
// customers report higher.

const GRH_MONTHLY = 100; // £/store/month
const GRH_PER_LOCUM = 0; // locums included

const PD_ANNUAL_BASE = 2639; // £/store/year
const PD_PER_PHARMACIST = 250; // £/pharmacist/year (aggregated training)

const ECG_ANNUAL_BASE = 2000; // £/store/year
const ECG_PER_PHARMACIST = 180; // £/pharmacist/year (aggregated training)

interface Inputs {
  stores: number;
  pharmacistsPerStore: number;
}

interface Annual {
  grh: number;
  pharmadoctor: number;
  ecg: number;
}

function compute(inputs: Inputs): Annual {
  const { stores, pharmacistsPerStore } = inputs;
  const totalPharmacists = stores * pharmacistsPerStore;
  return {
    grh: stores * GRH_MONTHLY * 12 + totalPharmacists * GRH_PER_LOCUM * 12,
    pharmadoctor: stores * PD_ANNUAL_BASE + totalPharmacists * PD_PER_PHARMACIST,
    ecg: stores * ECG_ANNUAL_BASE + totalPharmacists * ECG_PER_PHARMACIST,
  };
}

const gbp = (n: number) =>
  "£" + n.toLocaleString("en-GB", { maximumFractionDigits: 0 });

export function ComparisonCalculator() {
  const [stores, setStores] = useState(1);
  const [pharmacists, setPharmacists] = useState(2);

  const annual = useMemo(
    () => compute({ stores, pharmacistsPerStore: pharmacists }),
    [stores, pharmacists],
  );
  const savingsVsPd = annual.pharmadoctor - annual.grh;
  const savingsVsEcg = annual.ecg - annual.grh;
  const savingsVsPd3yr = savingsVsPd * 3;
  const savingsVsEcg3yr = savingsVsEcg * 3;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          What does it cost?
        </h2>
        <p className="text-sm text-gray-600">
          Tweak the inputs to match your set-up. Numbers update live.
        </p>
      </div>

      {/* Inputs */}
      <div className="p-6 sm:p-8 bg-gray-50 grid sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="stores" className="block text-sm font-semibold text-gray-700 mb-1">
            How many pharmacies do you run?
          </label>
          <div className="flex items-center gap-3">
            <input
              id="stores"
              type="range"
              min={1}
              max={30}
              step={1}
              value={stores}
              onChange={(e) => setStores(Number(e.target.value))}
              className="flex-1 accent-teal-600"
              aria-label="Number of pharmacies"
            />
            <input
              type="number"
              min={1}
              max={500}
              value={stores}
              onChange={(e) => setStores(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-right font-semibold"
              aria-label="Number of pharmacies (numeric)"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Drag the slider or type a number. Up to 500.
          </p>
        </div>
        <div>
          <label htmlFor="pharmacists" className="block text-sm font-semibold text-gray-700 mb-1">
            Pharmacists per pharmacy (incl. locums)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="pharmacists"
              type="range"
              min={1}
              max={10}
              step={1}
              value={pharmacists}
              onChange={(e) => setPharmacists(Number(e.target.value))}
              className="flex-1 accent-teal-600"
              aria-label="Pharmacists per store"
            />
            <input
              type="number"
              min={1}
              max={50}
              value={pharmacists}
              onChange={(e) => setPharmacists(Math.max(1, Number(e.target.value) || 1))}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-right font-semibold"
              aria-label="Pharmacists per store (numeric)"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Average across stores. Include every pharmacist who works at any branch — permanent or locum.
          </p>
        </div>
      </div>

      {/* Results grid */}
      <div className="p-6 sm:p-8 grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border-2 border-teal-400 bg-teal-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Get Real Health
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{gbp(annual.grh)}</p>
          <p className="text-xs text-gray-700">per year, all in</p>
          <p className="text-[10px] text-gray-500 mt-2">
            {stores} store{stores === 1 ? "" : "s"} × £100/mo × 12. Locums included at no extra fee.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Pharmadoctor
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{gbp(annual.pharmadoctor)}</p>
          <p className="text-xs text-gray-700">per year, all in</p>
          <p className="text-[10px] text-gray-500 mt-2">
            {gbp(stores * PD_ANNUAL_BASE)} base + {gbp(stores * pharmacists * PD_PER_PHARMACIST)} pharmacist training fees.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            ECG Training
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{gbp(annual.ecg)}</p>
          <p className="text-xs text-gray-700">per year, all in</p>
          <p className="text-[10px] text-gray-500 mt-2">
            {gbp(stores * ECG_ANNUAL_BASE)} base + {gbp(stores * pharmacists * ECG_PER_PHARMACIST)} pharmacist training fees.
          </p>
        </div>
      </div>

      {/* Headline savings */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-teal-100 font-semibold">
              You&apos;d save vs Pharmadoctor
            </p>
            <p className="text-3xl font-bold mt-1">{gbp(Math.max(0, savingsVsPd))} / year</p>
            <p className="text-sm text-teal-50 mt-1">
              That&apos;s {gbp(Math.max(0, savingsVsPd3yr))} over 3 years.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-teal-100 font-semibold">
              You&apos;d save vs ECG
            </p>
            <p className="text-3xl font-bold mt-1">{gbp(Math.max(0, savingsVsEcg))} / year</p>
            <p className="text-sm text-teal-50 mt-1">
              That&apos;s {gbp(Math.max(0, savingsVsEcg3yr))} over 3 years.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-6 sm:p-8 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100">
        <p className="text-sm text-gray-600 max-w-md">
          Numbers above are conservative for the competitors — many customers
          report paying more. See the methodology footnote on this page.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <a
            href="/onboard"
            className="inline-flex items-center justify-center px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Start onboarding
          </a>
          <a
            href="/demo"
            className="inline-flex items-center justify-center px-5 py-3 bg-white border border-gray-300 hover:border-teal-300 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
          >
            See a demo
          </a>
        </div>
      </div>
    </div>
  );
}
