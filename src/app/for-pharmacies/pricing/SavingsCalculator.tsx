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

export function SavingsCalculator() {
  const [volumes, setVolumes] = useState<number[]>(
    servicePresets.map((s) => s.defaultVolume)
  );

  const totalConsults = useMemo(
    () => volumes.reduce((sum, v) => sum + v, 0),
    [volumes]
  );

  const monthlyPDCost = totalConsults * PHARMADOCTOR_PER_CONSULT;
  const annualPDCost = monthlyPDCost * 12;

  // GRH flat fee benchmarks (indicative — actual depends on tier)
  const grhAnnualFee = totalConsults <= 0 ? 0 : 2400; // £200/mo equivalent for Growth tier
  const annualSaving = annualPDCost - grhAnnualFee;

  const updateVolume = (index: number, value: string) => {
    const parsed = parseInt(value, 10);
    setVolumes((prev) => {
      const next = [...prev];
      next[index] = isNaN(parsed) ? 0 : Math.max(0, Math.min(9999, parsed));
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Input section */}
      <div className="p-6 sm:p-8">
        <h3 className="font-bold text-navy-900 mb-1">
          Enter your monthly consultation volumes
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Estimate how many consultations you do per month for each service
          type.
        </p>

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
        <div className="grid sm:grid-cols-3 gap-6 text-center">
          {/* Pharmadoctor cost */}
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-1">
              Pharmadoctor annual cost
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-red-400">
              £{annualPDCost.toLocaleString()}
            </p>
            <p className="text-xs text-blue-300 mt-1">
              {totalConsults.toLocaleString()} &times; £
              {PHARMADOCTOR_PER_CONSULT.toFixed(2)} &times; 12 months
            </p>
          </div>

          {/* GRH cost */}
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-1">
              GRH annual fee
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-teal-400">
              {totalConsults > 0 ? `£${grhAnnualFee.toLocaleString()}` : "—"}
            </p>
            <p className="text-xs text-blue-300 mt-1">
              Flat fee — no per-consult charges
            </p>
          </div>

          {/* Savings */}
          <div>
            <p className="text-xs text-blue-300 uppercase tracking-wide mb-1">
              Your annual saving
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-green-400">
              {annualSaving > 0
                ? `£${annualSaving.toLocaleString()}`
                : totalConsults > 0
                  ? "—"
                  : "—"}
            </p>
            <p className="text-xs text-blue-300 mt-1">
              {annualSaving > 0
                ? "That's money back in your pharmacy"
                : "Enter your volumes above"}
            </p>
          </div>
        </div>

        {annualSaving > 0 && (
          <p className="text-center text-sm text-blue-200 mt-6 pt-4 border-t border-blue-900">
            Based on Pharmadoctor&apos;s published £
            {PHARMADOCTOR_PER_CONSULT.toFixed(2)} per-consultation fee. GRH
            Growth tier shown at £{grhAnnualFee.toLocaleString()}/year — actual
            pricing depends on your plan.{" "}
            <a href="/contact" className="text-teal-400 underline">
              Get your exact quote →
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
