"use client";

import type { CounsellingChecklist } from "../lib/ed-types";

interface EDCounsellingChecklistProps {
  checklist: CounsellingChecklist;
  medicineName: string;
  onChange: (field: keyof CounsellingChecklist, value: boolean) => void;
}

const counsellingItems: {
  field: keyof CounsellingChecklist;
  label: string;
  detail: string;
}[] = [
  {
    field: "sexualStimulationRequired",
    label: "Sexual stimulation is required",
    detail:
      "The medication does not cause automatic erections. Sexual stimulation is needed for it to work.",
  },
  {
    field: "timingAdvice",
    label: "Timing of administration",
    detail:
      "Sildenafil: take approximately 1 hour before activity (effective 30 mins to 4 hours). Tadalafil on-demand: take at least 30 minutes before (effective up to 36 hours). Tadalafil daily: take at the same time each day.",
  },
  {
    field: "foodInteractions",
    label: "Food interactions",
    detail:
      "Sildenafil: efficacy may be reduced if taken after a high-fat meal. Tadalafil: absorption not affected by food.",
  },
  {
    field: "priapismWarning",
    label: "Priapism warning",
    detail:
      "Seek immediate medical attention if an erection lasts longer than 4 hours. This is a medical emergency.",
  },
  {
    field: "visionHearingWarning",
    label: "Vision and hearing warning",
    detail:
      "Seek urgent medical attention if there is a sudden loss of vision in one or both eyes, or a sudden decrease or loss of hearing.",
  },
  {
    field: "noSTIProtection",
    label: "No STI protection",
    detail:
      "This medication does not protect against sexually transmitted infections. Advise on appropriate barrier methods.",
  },
  {
    field: "grapefruitAvoidance",
    label: "Grapefruit avoidance",
    detail:
      "Avoid grapefruit juice while taking the medication as it may increase side effects.",
  },
  {
    field: "alcoholModeration",
    label: "Alcohol moderation",
    detail:
      "Excessive alcohol can reduce the effectiveness of the medication and worsen side effects such as dizziness.",
  },
  {
    field: "sideEffectsExplained",
    label: "Side effects explained",
    detail:
      "Common side effects include headache, flushing, nasal congestion, dyspepsia, and dizziness. These are usually mild and transient.",
  },
  {
    field: "reviewAdvice",
    label: "Review and follow-up advice",
    detail:
      "Trial the medication on at least 6-8 separate occasions with sexual stimulation before concluding treatment failure. Review annually.",
  },
];

export function EDCounsellingChecklist({
  checklist,
  medicineName,
  onChange,
}: EDCounsellingChecklistProps) {
  const allChecked = counsellingItems.every(
    (item) => checklist[item.field]
  );
  const checkedCount = counsellingItems.filter(
    (item) => checklist[item.field]
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">
          Confirm each counselling point has been discussed with the patient
          regarding <span className="font-medium text-navy-900">{medicineName}</span>.
        </p>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            allChecked
              ? "bg-teal-100 text-teal-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {checkedCount}/{counsellingItems.length}
        </span>
      </div>

      <div className="space-y-3">
        {counsellingItems.map((item) => (
          <label
            key={item.field}
            className={`
              flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
              ${
                checklist[item.field]
                  ? "border-teal-200 bg-teal-50/50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <input
              type="checkbox"
              checked={checklist[item.field]}
              onChange={(e) => onChange(item.field, e.target.checked)}
              className="mt-1 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
            />
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  checklist[item.field] ? "text-teal-800" : "text-navy-900"
                }`}
              >
                {item.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
            </div>
            {checklist[item.field] && (
              <svg
                className="w-4 h-4 text-teal-500 flex-shrink-0 mt-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </label>
        ))}
      </div>

      {/* GP review recommendation */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={checklist.gpReviewRecommended}
            onChange={(e) =>
              onChange("gpReviewRecommended", e.target.checked)
            }
            className="mt-1 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
          />
          <div>
            <p className="text-sm font-medium text-navy-900">
              GP cardiovascular review recommended (optional)
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              If the patient is not already under regular GP review, recommend a
              cardiovascular risk assessment. Tick to confirm this was discussed.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
