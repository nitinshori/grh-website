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
      "Sildenafil: take about an hour before sex; it can work from 30 minutes up to about 4 hours. Tadalafil on-demand: take at least 30 minutes before; it can still work up to 36 hours later. Tadalafil once daily: take at the same time each day, whether or not you expect to have sex.",
  },
  {
    field: "maxOneDoseIn24Hours",
    label: "One dose in 24 hours. No more",
    detail: "Maximum one dose in any 24 hours, whichever medicine. Do not use tadalafil on-demand and once-daily together.",
  },
  {
    field: "nitrateWarningGiven",
    label: "NEVER with poppers or any nitrate medicine",
    detail:
      "Never take this with poppers, or with any nitrate medicine such as a GTN spray or nicorandil. Together they can drop your blood pressure to a dangerous level. Tadalafil stays in your system for up to two days, so that warning applies for two days after your last dose, not just on the day.",
  },
  {
    field: "foodInteractions",
    label: "Food interactions",
    detail:
      "Sildenafil: a heavy, fatty meal can make it work less well. Tadalafil: absorption is not affected by food.",
  },
  {
    field: "priapismWarning",
    label: "Priapism warning",
    detail:
      "An erection lasting more than 4 hours: go to A&E. This can cause permanent damage.",
  },
  {
    field: "visionHearingWarning",
    label: "Vision and hearing warning",
    detail:
      "Sudden loss of vision in one or both eyes: stop the tablets and seek immediate medical attention (possible NAION). Sudden loss or reduction of hearing: seek immediate medical attention.",
  },
  {
    field: "chestPainAdvice",
    label: "Chest pain during or after sex",
    detail:
      "Seek immediate medical attention. Do not take a GTN spray for it; tell the paramedics you have taken this medicine (and, for tadalafil, that it lasts up to 36 hours).",
  },
  {
    field: "noSTIProtection",
    label: "No STI protection",
    detail:
      "This does not protect you against sexually transmitted infections. Offer testing where appropriate. Recorded on the consultation record.",
  },
  {
    field: "grapefruitAvoidance",
    label: "Grapefruit avoidance",
    detail:
      "Sildenafil: avoid grapefruit juice, which increases exposure.",
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
      "Reassess where there has been no improvement after 6 to 8 attempts at the maximum tolerated dose. Review effectiveness, blood pressure and cardiovascular fitness at least annually; for tadalafil once daily, reassess periodically whether continued daily use remains appropriate.",
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
              ? "bg-[color:var(--tenant-primary)]/15 text-[color:var(--tenant-primary)]"
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
                  ? "border-[color:var(--tenant-primary)]/30 bg-[color:var(--tenant-primary)]/10/50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }
            `}
          >
            <input
              type="checkbox"
              checked={checklist[item.field]}
              onChange={(e) => onChange(item.field, e.target.checked)}
              className="mt-1 rounded border-gray-300 text-[color:var(--tenant-primary)] focus:ring-[color:var(--tenant-primary)]"
            />
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  checklist[item.field] ? "text-[color:var(--tenant-primary)]" : "text-navy-900"
                }`}
              >
                {item.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
            </div>
            {checklist[item.field] && (
              <svg
                className="w-4 h-4 text-[color:var(--tenant-primary)] flex-shrink-0 mt-1"
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
            className="mt-1 rounded border-gray-300 text-[color:var(--tenant-primary)] focus:ring-[color:var(--tenant-primary)]"
          />
          <div>
            <p className="text-sm font-medium text-navy-900">
              Cardiovascular and diabetes check recommended
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              If the patient is not under regular GP review, advise him to arrange a
              cardiovascular and diabetes check: erection problems are often the first
              sign of something else. Tick to record that you recommended it.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
