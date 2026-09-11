"use client";

import { SelectInput, NumberInput } from "../../shared/components/FormInputs";

const DOSE_STAGES = [
  {
    stage: "initiation",
    label: "Initiation (weeks 1 to 4)",
    dose: "0.25 mg",
    frequency: "Once weekly",
    description: "Starting dose, first month of treatment",
  },
  {
    stage: "escalation",
    label: "Escalation (weeks 5 to 16)",
    dose: "0.5 mg (weeks 5 to 8), 1.0 mg (weeks 9 to 12), 1.7 mg (weeks 13 to 16)",
    frequency: "Escalating once-weekly dose",
    description:
      "Dose increase every 4 weeks. If significant GI symptoms occur, consider delaying escalation or lowering to the previous dose until symptoms improve.",
  },
  {
    stage: "maintenance",
    label: "Maintenance (week 17 onwards)",
    dose: "2.4 mg",
    frequency: "Once weekly",
    description:
      "Maintenance dose. If needed, 7.2 mg once weekly after a minimum of 4 weeks on 2.4 mg, permitted only where the STARTING BMI was 30 kg/m² or above. Patients who started at BMI 27 to below 30 remain at a maximum of 2.4 mg.",
  },
];

export function DoseTitrationSelector({
  currentStage,
  dose,
  weeksAtCurrentDose,
  previousDose,
  injectionSite,
  onStageChange,
  onDoseChange,
  onWeeksChange,
  onPreviousDoseChange,
  onInjectionSiteChange,
  visitType = "",
  allowedDoses,
}: {
  currentStage: string;
  dose: string;
  weeksAtCurrentDose: number | null;
  previousDose: string;
  injectionSite: string;
  onStageChange: (v: string) => void;
  onDoseChange: (v: string) => void;
  onWeeksChange: (v: number | null) => void;
  onPreviousDoseChange: (v: string) => void;
  onInjectionSiteChange: (v: string) => void;
  /** From the Weight Assessment step: new, continuing or restart. */
  visitType?: string;
  /** The doses the document allows at this visit; only these are offered. */
  allowedDoses?: string[];
}) {
  void onStageChange;
  const continuing = visitType === "continuing";
  const stageLabel =
    currentStage === "initiation"
      ? "Initiation (0.25 mg, weeks 1 to 4)"
      : currentStage === "escalation"
        ? "Escalation (0.5 mg to 1.7 mg, weeks 5 to 16)"
        : currentStage === "maintenance"
          ? "Maintenance (2.4 mg, or 7.2 mg if needed)"
          : "Set by the dose selected";
  const allDoseOptions = [
    { value: "0.25mg", label: "0.25 mg (FlexTouch pen, 4 doses)" },
    { value: "0.5mg", label: "0.5 mg (FlexTouch pen, 4 doses)" },
    { value: "1mg", label: "1.0 mg (FlexTouch pen, 4 doses)" },
    { value: "1.7mg", label: "1.7 mg (FlexTouch pen, 4 doses)" },
    { value: "2.4mg", label: "2.4 mg (FlexTouch pen, 4 doses; maintenance)" },
    {
      value: "7.2mg",
      label: "7.2 mg (four single use pens; starting BMI 30 or above only, after 4 weeks on 2.4 mg)",
    },
  ];
  // Only the document's schedule is offered: 0.25 mg for a new patient or a
  // restart; for a continuing patient the same dose, one step up after 4
  // weeks, or a lower step (adversarial review, 11 Sep 2026).
  const doseOptions = allowedDoses
    ? allDoseOptions.filter((o) => allowedDoses.includes(o.value))
    : allDoseOptions;

  const injectionSiteOptions = [
    { value: "abdomen", label: "Abdomen" },
    { value: "thigh", label: "Thigh" },
    { value: "upper_arm", label: "Upper arm" },
  ];

  return (
    <div className="space-y-6">
      {/* Titration Schedule Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-navy-900 mb-3">
          Wegovy Titration Schedule
        </p>
        <div className="space-y-2">
          {DOSE_STAGES.map((s) => (
            <div key={s.stage} className="flex items-start gap-3 text-xs">
              <div className="w-24 flex-shrink-0">
                <p className="font-medium text-navy-900">{s.label}</p>
              </div>
              <div className="flex-1">
                <p className="text-gray-700">{s.dose}, {s.frequency}</p>
                <p className="text-gray-500 text-[11px]">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4 border-t border-blue-100 pt-3">
          Wegovy FlexTouch solution for injection in pre-filled pen: one pen contains 4 doses
          (0.25 mg, 0.5 mg, 1.0 mg, 1.7 mg or 2.4 mg) with 4 disposable needles, one month of
          treatment. Wegovy 7.2 mg solution for injection in pre-filled pen: four single use
          pens, one month of treatment. Supply one month of treatment per patient appointment;
          no additional supply to stock up. Inject once weekly at any time of day, with or
          without meals; the dosing day can be changed as long as at least 3 days (more than 72
          hours) separate doses. Maximum treatment period under this PGD: 2 years of continuous
          treatment.
        </p>
      </div>

      {/* Previous dose first, for a continuing patient: it decides what may be supplied */}
      {continuing && (
        <>
          <SelectInput
            label="Dose the patient has been on"
            value={previousDose === "none" ? "" : previousDose}
            onChange={onPreviousDoseChange}
            options={[
              { value: "0.25mg", label: "0.25 mg" },
              { value: "0.5mg", label: "0.5 mg" },
              { value: "1mg", label: "1.0 mg" },
              { value: "1.7mg", label: "1.7 mg" },
              { value: "2.4mg", label: "2.4 mg" },
              { value: "7.2mg", label: "7.2 mg" },
            ]}
            required
          />
          <NumberInput
            label="Weeks on that dose"
            value={weeksAtCurrentDose}
            onChange={onWeeksChange}
            min={0}
            max={104}
            unit="weeks"
            required
          />
          {previousDose && previousDose !== "none" && weeksAtCurrentDose !== null && weeksAtCurrentDose < 4 && (
            <p className="text-xs text-amber-800 -mt-3">
              Fewer than 4 weeks on the current dose: the next step up is not yet available.
            </p>
          )}
        </>
      )}

      {!continuing && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
          {visitType === "restart"
            ? "Restart after a break: titrate again from 0.25 mg."
            : visitType === "new"
              ? "New patient: 0.25 mg once weekly for weeks 1 to 4."
              : "Select the visit type on the Weight Assessment step."}
        </div>
      )}

      {/* Specific Dose */}
      <SelectInput
        label="Dose to supply this visit"
        value={dose}
        onChange={onDoseChange}
        options={doseOptions}
        required
      />

      <div className="text-xs text-gray-600 -mt-3">
        Dose stage: <span className="font-medium text-navy-900">{stageLabel}</span>
      </div>

      {dose === "7.2mg" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-gray-700">
          <p className="font-semibold text-navy-900 mb-1">7.2 mg administration</p>
          <p>
            Using the single use pen: press the pen firmly against the skin until the yellow
            bar has stopped moving; the injection takes about 5 to 10 seconds. Where 7.2 mg is
            given using 2.4 mg FlexTouch pens, inject three doses of 2.4 mg one after another;
            injections can be given in the same body area but at least 5 cm apart, changing
            the needle between each dose.
          </p>
        </div>
      )}

      {/* Injection Site */}
      <SelectInput
        label="Injection site"
        value={injectionSite}
        onChange={onInjectionSiteChange}
        options={injectionSiteOptions}
        required
      />

      {/* Injection Site Rotation Advice */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded">
        <p className="text-xs font-semibold text-navy-900 mb-1">
          Injection Site Rotation
        </p>
        <p className="text-xs text-gray-600">
          Injected subcutaneously in the abdomen, thigh or upper arm; the injection site can be
          changed. Rotate injection sites to reduce local irritation. Do not administer
          intravenously or intramuscularly. Patients should read the instructions for use in
          the package leaflet carefully before administering.
        </p>
      </div>
    </div>
  );
}
