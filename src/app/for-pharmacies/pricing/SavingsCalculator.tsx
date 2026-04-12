"use client";

import { useState, useMemo } from "react";

const PHARMADOCTOR_PER_CONSULT = 6.5; // £ per consultation (published rate)

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

export function SavingsCalculator() {
  const [volumes, setVolumes] = useState<number[]>(
    servicePresets.map((s) => s.defaultVolume)
  );
  const [pharmacyCount, setPharmacyCount] = useState(1);

  const totalConsults = useMemo(
    () => volumes.reduce((sum, v) => sum + v, 0),
    [volumes]
  );

  const monthlyConsults = totalConsults;
  const monthlyPDCost = monthlyConsults * pharmacyCount * PHARMADOCTOR_PER_CONSULT;
  const annualPDCost = monthlyPDCost * 12;

  // GRH pricing based on pharmacy count and tier
  const grhTier = getGRHTier(pharmacyCount);
  const grhMonthlyFee =
    pharmacyCount > 30
      ? 0 // Custom pricing
      : grhTier.monthlyPerPharmacy * pharmacyCount;
  const grhAnnualFee = grhMonthlyFee * 12;
  const annualSaving = annualPDCost - grhAnnualFee;

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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Input section */}
      <div className="p-6 sm:p-8">
        <h3 className="font-bold text-navy-900 mb-1">
          Estimate your savings
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Enter your pharmacy count and estimated monthly consultation volumes.
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
          Monthly consultation volumes
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
            {totalConsults.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Results section */}
      <div className="bg-navy-950 text-white p-6 sm:p-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {/* Pharmadoctor cost */}
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-1">
              Pharmadoctor annual cost
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-red-400">
              £{annualPDCost.toLocaleString()}
            </p>
            <p className="text-xs text-blue-300 mt-1">
              {monthlyConsults.toLocaleString()} consults &times; {pharmacyCount}{" "}
              pharmacies &times; £{PHARMADOCTOR_PER_CONSULT.toFixed(2)}
            </p>
          </div>

          {/* GRH cost */}
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-1">
              GRH annual cost
            </p>
            {pharmacyCount > 30 ? (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-teal-400">
                  Custom
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  Contact us for Network pricing
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-teal-400">
                  £{grhAnnualFee.toLocaleString()}
                </p>
                <p className="text-xs text-blue-300 mt-1">
                  {grhTier.name}: £{grhTier.monthlyPerPharmacy}/pharmacy/month
                </p>
              </>
            )}
          </div>

          {/* Total saving */}
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-1">
              Total annual saving
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-green-400">
              {pharmacyCount > 30
                ? "—"
                : annualSaving > 0
                  ? `£${annualSaving.toLocaleString()}`
                  : "—"}
            </p>
            <p className="text-xs text-blue-300 mt-1">
              {annualSaving > 0 && "All pharmacies"}
            </p>
          </div>

          {/* Per-pharmacy saving */}
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-1">
              Per-pharmacy saving
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-green-400">
              {pharmacyCount > 30
                ? "—"
                : annualSaving > 0
                  ? `£${perPharmacyAnnualSaving.toLocaleString("en-GB", {
                      maximumFractionDigits: 0,
                    })}`
                  : "—"}
            </p>
            <p className="text-xs text-blue-300 mt-1">
              {annualSaving > 0 && "Per location"}
            </p>
          </div>
        </div>

        {annualSaving > 0 && (
          <p className="text-center text-sm text-blue-200 mt-6 pt-4 border-t border-blue-900">
            Based on Pharmadoctor&apos;s published £
            {PHARMADOCTOR_PER_CONSULT.toFixed(2)} per-consultation fee.{" "}
            <a href="/contact" className="text-teal-400 underline">
              Get your exact quote →
            </a>
          </p>
        )}
        {pharmacyCount > 30 && (
          <p className="text-center text-sm text-blue-200 mt-6 pt-4 border-t border-blue-900">
            Your network qualifies for custom Network pricing.{" "}
            <a href="/contact" className="text-teal-400 underline">
              Contact us for a tailored quote →
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
