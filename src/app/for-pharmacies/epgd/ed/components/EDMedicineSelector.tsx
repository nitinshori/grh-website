"use client";

import type { MedicineSelection, DoseRecommendation } from "../lib/ed-types";
import { getAvailableDoses, getMaxQuantity } from "../lib/ed-clinical-logic";
import type { ArmAvailability, DoseCaps } from "../lib/ed-clinical-logic";

interface EDMedicineSelectorProps {
  selection: MedicineSelection;
  recommendation: DoseRecommendation | null;
  onChange: (field: keyof MedicineSelection, value: MedicineSelection[keyof MedicineSelection]) => void;
  /** PGD v008 arm exclusions (ritonavir/cobicistat bars sildenafil; doxazosin bars tadalafil). */
  armAvailability?: ArmAvailability;
  /** PGD v008 dose caps and starting-dose rules. */
  caps?: DoseCaps;
}

export function EDMedicineSelector({
  selection,
  recommendation,
  onChange,
  armAvailability,
  caps,
}: EDMedicineSelectorProps) {
  const availableDoses = getAvailableDoses(
    selection.medicine,
    selection.dosingRegimen,
    caps
  );
  const maxQty = getMaxQuantity(selection.medicine, selection.dosingRegimen, caps);
  const rule72 = !!caps?.tadalafil72HourRule;
  const differsFromRecommendation =
    !!recommendation &&
    !!selection.medicine &&
    (selection.medicine !== recommendation.medicine ||
      selection.dose !== recommendation.dose ||
      (selection.medicine === "tadalafil" &&
        !!selection.dosingRegimen &&
        selection.dosingRegimen !== recommendation.dosingRegimen));
  const sildenafilOpen = armAvailability ? armAvailability.sildenafil : true;
  const tadalafilOpen = armAvailability ? armAvailability.tadalafil : true;
  const dailyAllowed = caps ? caps.tadalafilDailyAllowed : true;

  const handleMedicineChange = (medicine: string) => {
    if (medicine === "sildenafil" && !sildenafilOpen) return;
    if (medicine === "tadalafil" && !tadalafilOpen) return;
    onChange("medicine", medicine);
    onChange("dose", "");
    onChange("dosingRegimen", medicine === "sildenafil" ? "on-demand" : "");
    onChange("quantity", 4);
    onChange("pharmacistOverride", false);
    onChange("overrideReason", "");
  };

  const handleRegimenChange = (regimen: string) => {
    if (regimen === "daily" && !dailyAllowed) return;
    onChange("dosingRegimen", regimen);
    onChange("dose", "");
    onChange("quantity", regimen === "daily" ? 28 : 4);
    onChange("pharmacistOverride", false);
    onChange("overrideReason", "");
  };

  return (
    <div className="space-y-6">
      {/* Auto-recommendation */}
      {recommendation && (
        <div className="bg-[color:var(--tenant-primary)]/10 border border-[color:var(--tenant-primary)]/30 rounded-lg px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="text-lg">💊</span>
            <div>
              <p className="text-sm font-semibold text-[color:var(--tenant-primary)]">
                Recommended:{" "}
                {recommendation.medicine === "sildenafil"
                  ? "Sildenafil"
                  : "Tadalafil"}{" "}
                {recommendation.dose}
                {recommendation.dosingRegimen === "daily"
                  ? " daily"
                  : " on-demand"}
              </p>
              <p className="text-xs text-[color:var(--tenant-primary)] mt-1">
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
        {caps && caps.reasons.length > 0 && (
          <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <p className="font-semibold">Dose limits for this patient (PGD v008):</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              {caps.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleMedicineChange("sildenafil")}
            disabled={!sildenafilOpen}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${
                selection.medicine === "sildenafil"
                  ? "border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 ring-1 ring-[color:var(--tenant-primary)]/30"
                  : "border-gray-200 hover:border-gray-300"
              }
              ${!sildenafilOpen ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <p className="font-bold text-navy-900">Sildenafil 25mg, 50mg and 100mg film-coated tablets</p>
            <p className="text-xs text-gray-500 mt-1">
              On-demand. Starting dose 50mg about 1 hour before sexual activity (30 minutes to 4 hours). Maximum one dose in any 24 hours. Up to 8 tablets per supply.
            </p>
            {!sildenafilOpen && armAvailability && (
              <p className="text-xs text-red-700 mt-1">{armAvailability.sildenafilReason}</p>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleMedicineChange("tadalafil")}
            disabled={!tadalafilOpen}
            className={`
              p-4 rounded-lg border-2 text-left transition-all
              ${
                selection.medicine === "tadalafil"
                  ? "border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 ring-1 ring-[color:var(--tenant-primary)]/30"
                  : "border-gray-200 hover:border-gray-300"
              }
              ${!tadalafilOpen ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <p className="font-bold text-navy-900">Tadalafil 2.5mg, 5mg, 10mg and 20mg film-coated tablets</p>
            <p className="text-xs text-gray-500 mt-1">
              On-demand (starting dose 10mg, at least 30 minutes before, effective up to 36 hours) or once daily (2.5mg, increased to 5mg, for men anticipating sexual activity at least twice per week). Half-life about 17.5 hours: the nitrate warning applies for two days after a dose.
            </p>
            {!tadalafilOpen && armAvailability && (
              <p className="text-xs text-red-700 mt-1">{armAvailability.tadalafilReason}</p>
            )}
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
                    ? "border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10"
                    : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              <p className="font-semibold text-navy-900 text-sm">On-demand</p>
              <p className="text-xs text-gray-500 mt-1">
                Starting dose 10mg at least 30 minutes before sexual activity; 5mg to 20mg on efficacy and tolerability.{" "}
                {rule72
                  ? "With a potent CYP3A4 inhibitor: NOT MORE THAN 10mg IN ANY 72 HOURS. Up to 4 tablets."
                  : "Maximum one dose in any 24 hours. Up to 8 tablets."}
              </p>
              {rule72 && (
                <p className="text-xs text-red-700 mt-1 font-medium">
                  Potent CYP3A4 inhibitor (ritonavir, cobicistat, ketoconazole, itraconazole, clarithromycin): one 10mg dose in any 72 hour period.
                </p>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleRegimenChange("daily")}
              disabled={!dailyAllowed}
              className={`
                p-3 rounded-lg border-2 text-left transition-all
                ${
                  selection.dosingRegimen === "daily"
                    ? "border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${!dailyAllowed ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <p className="font-semibold text-navy-900 text-sm">Once daily</p>
              <p className="text-xs text-gray-500 mt-1">
                2.5mg at about the same time each day, increased to 5mg on tolerability. For men anticipating sexual activity at least twice per week. Up to 28 tablets. Do not use both regimens.
              </p>
              {!dailyAllowed && (
                <p className="text-xs text-red-700 mt-1">Excluded: severe renal impairment.</p>
              )}
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
                      ? "border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10 text-[color:var(--tenant-primary)]"
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
            Quantity to supply (tablets) <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Maximum {maxQty} tablets per supply
            {selection.dosingRegimen === "daily"
              ? " (once daily, one month)"
              : rule72 && selection.medicine === "tadalafil"
                ? " (10mg in any 72 hours: about one month)"
                : " (about one month at twice-weekly use)"}
            . Decide the quantity on individual need and record the decision.
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
            className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
          />
        </div>
      )}

      {selection.dose && (
        <div>
          <label className="block text-sm font-semibold text-navy-900 mb-1">
            Brand supplied <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">The PGD record requires name, brand, form and strength.</p>
          <input
            type="text"
            value={selection.brand}
            onChange={(e) => onChange("brand", e.target.value)}
            placeholder="e.g. generic manufacturer, Viagra, Cialis"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
          />
        </div>
      )}

      {/* A choice between authorised regimens that differs from the
          recommendation: the reason is required, not optional (adversarial
          review, 11 Sep 2026). */}
      {differsFromRecommendation && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            You have chosen a different medicine, regimen or dose from the recommendation
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Only the document's authorised doses are offered. Record why this
            one was chosen; the reason is printed on the record.
          </p>
          <textarea
            value={selection.overrideReason}
            onChange={(e) => {
              onChange("overrideReason", e.target.value);
              onChange("pharmacistOverride", e.target.value.trim().length > 0);
            }}
            placeholder="Reason for this choice (required)..."
            rows={2}
            className="mt-3 w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
}
