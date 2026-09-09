"use client";

import { useEffect, useState } from "react";

/**
 * Pre-vaccination safety checks, shown on every vaccination ePGD.
 *
 * WHY THIS IS SHARED RATHER THAN COPIED
 * -------------------------------------
 * Every vaccination PGD now requires adrenaline to be immediately available,
 * a 15 minute observation period, and the batch number recorded. The
 * documents say so. The tools did not: an audit on 9 September 2026 found
 * that of 18 vaccination tools, only 3 asked the pharmacist to confirm
 * adrenaline was available, only 6 captured the observation period, and 2
 * recorded no batch number at all, which makes a recall unactionable.
 *
 * Retrofitting sixteen tools by hand, each with its own state shape, is how
 * mistakes get made. This mounts once in StepWrapper, which fifteen of the
 * vaccination tools already share, so the requirement cannot be omitted from
 * a tool by forgetting to add it.
 *
 * Four tools do not use StepWrapper (dengue, japanese-encephalitis, flu and
 * rabies) and mount this component directly instead. They are listed in
 * NON_STEPWRAPPER. Note that on those four the adrenaline confirmation is
 * captured and recorded but does NOT block the Next button, because their
 * navigation is their own; on the other fifteen it blocks. Saying which are
 * only partly covered is part of the check.
 */

/** Vaccination PGD slugs. A tool not in this list renders nothing extra. */
export const VACCINE_SLUGS = new Set([
  "covid-booster",
  "flu",
  "hpv",
  "mmr",
  "pneumococcal",
  "rsv",
  "shingles-vaccine",
  "chickenpox",
  "dengue",
  "hep-ab-travel",
  "hep-b-occupational",
  "japanese-encephalitis",
  "junior-travel",
  "meningitis-acwy-travel",
  "meningitis-b",
  "rabies",
  "tetanus",
  "travel-core",
  "typhoid",
  "yellow-fever",
]);

/** Do not use StepWrapper, so this component must be added to them directly. */
export const NON_STEPWRAPPER = ["dengue", "japanese-encephalitis", "flu", "rabies"];

export interface VaccineSafetyState {
  adrenalineAvailable: boolean;
  observedFifteenMinutes: boolean;
  batchNumber: string;
  expiryDate: string;
  site: string;
}

const EMPTY: VaccineSafetyState = {
  adrenalineAvailable: false,
  observedFifteenMinutes: false,
  batchNumber: "",
  expiryDate: "",
  site: "",
};

/**
 * Module-level store, keyed by slug.
 *
 * StepWrapper renders this component and also builds the saved consultation
 * record, but the two do not share React state. Rather than thread a new prop
 * through every tool, the values are readable here so the record can pick
 * them up. Cleared when a new consultation starts.
 */
const store = new Map<string, VaccineSafetyState>();

export function getVaccineSafety(slug: string): VaccineSafetyState {
  return store.get(slug) ?? EMPTY;
}

export function clearVaccineSafety(slug: string): void {
  store.delete(slug);
}

/** True when the supply may proceed: adrenaline must be confirmed present. */
export function vaccineSafetySatisfied(slug: string): boolean {
  if (!VACCINE_SLUGS.has(slug)) return true;
  return getVaccineSafety(slug).adrenalineAvailable;
}

export function VaccineSafetyChecks({ slug }: { slug: string }) {
  const [state, setState] = useState<VaccineSafetyState>(
    () => store.get(slug) ?? EMPTY
  );

  useEffect(() => {
    store.set(slug, state);
  }, [slug, state]);

  if (!VACCINE_SLUGS.has(slug)) return null;

  const set = <K extends keyof VaccineSafetyState>(
    k: K,
    v: VaccineSafetyState[K]
  ) => setState((p) => ({ ...p, [k]: v }));

  return (
    <div className="mx-6 mb-4 rounded-lg border border-red-300 bg-red-50 p-4 print:border-gray-400 print:bg-white">
      <p className="text-sm font-semibold text-red-900">
        Pre-vaccination safety checks
      </p>
      <p className="mt-1 text-xs text-red-900">
        Required by every vaccination PGD in this estate. You cannot proceed
        until adrenaline is confirmed available.
      </p>

      <label className="mt-3 flex items-start gap-2 text-sm text-red-900">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={state.adrenalineAvailable}
          onChange={(e) => set("adrenalineAvailable", e.target.checked)}
        />
        <span>
          <strong>
            Adrenaline (epinephrine) 1 in 1,000 is immediately available in this
            room, in date
          </strong>
          , with a written anaphylaxis protocol and a telephone, and I am
          trained in the recognition and immediate management of anaphylaxis.
        </span>
      </label>

      <label className="mt-3 flex items-start gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={state.observedFifteenMinutes}
          onChange={(e) => set("observedFifteenMinutes", e.target.checked)}
        />
        <span>
          Patient observed, seated, for <strong>15 minutes</strong> after
          vaccination. Tick only once the period has actually been completed.
        </span>
      </label>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-gray-700">
          Batch number
          <input
            type="text"
            value={state.batchNumber}
            onChange={(e) => set("batchNumber", e.target.value)}
            placeholder="e.g. X012345"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs text-gray-700">
          Expiry date
          <input
            type="text"
            value={state.expiryDate}
            onChange={(e) => set("expiryDate", e.target.value)}
            placeholder="MM/YYYY"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs text-gray-700">
          Anatomical site
          <select
            value={state.site}
            onChange={(e) => set("site", e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">Select...</option>
            <option>Left deltoid</option>
            <option>Right deltoid</option>
            <option>Left anterolateral thigh</option>
            <option>Right anterolateral thigh</option>
          </select>
        </label>
      </div>
      <p className="mt-2 text-[11px] text-gray-600">
        The batch number is what makes a recall actionable. Two vaccination
        tools recorded none at all until this was added.
      </p>
    </div>
  );
}
