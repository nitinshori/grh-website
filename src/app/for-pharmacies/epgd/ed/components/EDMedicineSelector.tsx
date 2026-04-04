"use client";

import type { MedicineSelection, DoseRecommendation } from "../lib/ed-types";
import { getAvailableDoses, getMaxQuantity } from "../lib/ed-clinical-logic";

interface EDMedicineSelectorProps {
  selection: MedicineSelection;
  recommendation: DoseRecommendation | null;
  onChange: (field: keyof MedicineSelection, value: MedicineSelection[keyof MedicineSelection]) => void;
}

export function EDMedicineSelector({
  selection,
  recommendation,
  onChange,
}: EDMedicineSelectorProps) {
  const availableDoses = getAvailableDoses(
    selection.medicine,
    selection.dosingRegimen
  );
  const maxQty = getMaxQuantity(selection.medicine, selection.dosingRegimen);

  const handleMedicineChange = (medicine: string) => {
    onChange("medicine", medicine);
    onChange("dose", "");
    onChange("dosingRegimen", medicine === "sildenafil" ? "on-demand" : "");
    onChange("quantity", 4);
    onChange("pharmacistOverride", false);
    onChange("overrideReason", "");
  };

  const handleRegimenChange = (regimen: string) => {
    onChange("dosingRegimen", regimen);
    onChange("dose", "");
    onChange("quantity", regimen === "daily" ? 28 : 4);
  };

  return (
    <div className="space-y-6">
      {/* Auto-recommendation */}
      {recommendation && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">💊</span>
            <div>
              <p className="text-sm font-semibold text-teal-800">
                Recommended:{" "}
                {recommendation.medicine === "sildenafil"
                  ? "Sildenafil"
                  : "Tadalafil"}{" "}
                {recommendation.dose}
                {recommendation.dosingRegimen === "daily"
                  ? " daily"
                  : " on-demand"}
              </p>
              <p className="text-xs text-teal-700 mt-1">
                {recommendation.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Medicine selection */}
      <div>
        <label className="block text-sm font-semibold text-navy-900 mb-3">
          Select medicine
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleMedicineChange("sildenafil")}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${
                selection.medicine === "sildenafil"
                  ? "border-teal-500 bg-teal-50 ring-1 ring-teal-300"
                  : "border-gray-200 hover:border-gray-300"
              }
            `}
          >
            <p className="font-bold text-navy-900">Sildenafil</p>
            <p className="text-xs text-gray-500 mt-1">
              On-demand dosing. Take ~1 hour before activity. Effective for 4-5
              hours.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Available: 25mg, 50mg, 100mg
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleMedicineChange("tadalafil")}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${
                selection.medicine === "tadalafil"
                  ? "border-teal-500 bg-teal-50 ring-1 ring-teal-300"
                  : "border-gray-200 hover:border-gray-300"
              }
            `}
          >
            <p className="font-bold text-navy-900">Tadalafil</p>
            <p className="text-xs text-gray-500 mt-1">
              On-demand or daily dosing. Longer acting — effective up to 36
              hours.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              On-demand: 5mg, 10mg, 20mg | Daily: 2.5mg, 5mg
            </p>
          </button>
        </div>
      </div>

      {/* Dosing regimen (tadalafil only) */}
      {selection.medicine === "tadalafil" && (
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-3">
            Dosing regimen
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRegimenChange("on-demand")}
              className={`
                p-3 rounded-lg border-2 text-left transition-all
                ${
                  selection.dosingRegimen === "on-demand"
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <p className="font-semibold text-navy-900 text-sm">On-demand</p>
              <p className="text-xs text-gray-500 mt-1">
                Take at least 30 mins before activity. Max 1 dose per 24 hours.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleRegimenChange("daily")}
              className={`
                p-3 rounded-lg border-2 text-left transition-all
                ${
                  selection.dosingRegimen === "daily"
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <p className="font-semibold text-navy-900 text-sm">Daily</p>
              <p className="text-xs text-gray-500 mt-1">
                Once daily at the same time. For men anticipating frequent
                activity (≥2x/week).
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Dose selection */}
      {selection.medicine && (selection.medicine !== "tadalafil" || selection.dosingRegimen) && (
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-3">
            Select dose
          </label>
          <div className="flex gap-3 flex-wrap">
            {availableDoses.map((dose) => (
              <button
                key={dose}
                type="button"
                onClick={() => onChange("dose", dose)}
                className={`
                  px-5 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                  ${
                    selection.dose === dose
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }
                `}
              >
                {dose}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      {selection.dose && (
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-1">
            Quantity to supply (tablets)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Maximum {maxQty} tablets per supply
            {selection.dosingRegimen === "daily"
              ? " (28-day supply)"
              : " (based on twice-weekly use)"}
          </p>
          <input
            type="number"
            min={1}
            max={maxQty}
            value={selection.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChange("quantity", isNaN(val) ? 1 : Math.max(1, Math.min(maxQty, val)));
            }}
            className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
      )}

      {/* Override recommendation */}
      {recommendation &&
        selection.medicine &&
        (selection.medicine !== recommendation.medicine ||
          selection.dose !== recommendation.dose) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selection.pharmacistOverride}
                onChange={(e) =>
                  onChange("pharmacistOverride", e.target.checked)
                }
                className="mt-0.5 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
              />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  I am overriding the recommended dose/medicine
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  You have selected a different medicine or dose from the
                  auto-recommendation. Please confirm and provide a reason.
                </p>
              </div>
            </label>
            {selection.pharmacistOverride && (
              <textarea
                value={selection.overrideReason}
                onChange={(e) =>
                  onChange("overrideReason", e.target.value)
                }
                placeholder="Reason for override..."
                rows={2}
                className="mt-3 w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            )}
          </div>
        )}
    </div>
  );
}
