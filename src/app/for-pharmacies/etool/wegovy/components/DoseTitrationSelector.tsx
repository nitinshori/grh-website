"use client";

import { SelectInput, NumberInput } from "../../shared/components/FormInputs";

const DOSE_STAGES = [
  {
    stage: "initiation",
    label: "Initiation (Weeks 1-4)",
    dose: "0.25mg",
    frequency: "Once weekly",
    description: "Starting dose, first month of treatment",
  },
  {
    stage: "escalation",
    label: "Escalation (Weeks 5-16)",
    dose: "0.5mg, 1mg, 1.7mg",
    frequency: "Escalating weekly dose",
    description: "Gradual dose increase every 4 weeks",
  },
  {
    stage: "maintenance",
    label: "Maintenance (Week 17+)",
    dose: "2.4mg",
    frequency: "Once weekly",
    description: "Target maintenance dose",
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
}) {
  const doseOptions = [
    { value: "0.25mg", label: "0.25mg" },
    { value: "0.5mg", label: "0.5mg" },
    { value: "1mg", label: "1mg" },
    { value: "1.7mg", label: "1.7mg" },
    { value: "2.4mg", label: "2.4mg (maintenance)" },
  ];

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
                <p className="text-gray-700">{s.dose} — {s.frequency}</p>
                <p className="text-gray-500 text-[11px]">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-4 border-t border-blue-100 pt-3">
          Each step = 4 pens (1 month supply). Inject once weekly on the same day.
        </p>
      </div>

      {/* Current Stage Selection */}
      <SelectInput
        label="Current dose stage"
        value={currentStage}
        onChange={onStageChange}
        options={[
          { value: "initiation", label: "Initiation (0.25mg)" },
          { value: "escalation", label: "Escalation (0.5mg - 1.7mg)" },
          { value: "maintenance", label: "Maintenance (2.4mg)" },
        ]}
        required
      />

      {/* Specific Dose */}
      <SelectInput
        label="Specific dose"
        value={dose}
        onChange={onDoseChange}
        options={doseOptions}
        required
      />

      {/* Weeks at Current Dose */}
      <NumberInput
        label="Weeks at current dose"
        value={weeksAtCurrentDose}
        onChange={onWeeksChange}
        min={0}
        max={52}
        unit="weeks"
      />

      {/* Previous Dose (for tracking) */}
      <SelectInput
        label="Previous dose (if escalating)"
        value={previousDose}
        onChange={onPreviousDoseChange}
        options={[
          { value: "", label: "None (new patient)" },
          { value: "0.25mg", label: "0.25mg" },
          { value: "0.5mg", label: "0.5mg" },
          { value: "1mg", label: "1mg" },
          { value: "1.7mg", label: "1.7mg" },
          { value: "2.4mg", label: "2.4mg" },
        ]}
      />

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
          Advise patient to rotate injection sites each week to minimize local reactions and
          lipodystrophy. Use abdomen, thigh, or upper arm, spacing injections at least 1 inch
          apart.
        </p>
      </div>
    </div>
  );
}
