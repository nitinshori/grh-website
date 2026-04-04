"use client";

import { Checkbox } from "../../shared/components/FormInputs";

interface FeverPAINScoreProps {
  fever: boolean;
  purulence: boolean;
  attendRapidly: boolean;
  inflamedTonsils: boolean;
  noCoughCoryza: boolean;
  onFeverChange: (v: boolean) => void;
  onPurulenceChange: (v: boolean) => void;
  onAttendRapidlyChange: (v: boolean) => void;
  onInflamedTonselsChange: (v: boolean) => void;
  onNoCoughCorynaChange: (v: boolean) => void;
}

export function FeverPAINScore({
  fever,
  purulence,
  attendRapidly,
  inflamedTonsils,
  noCoughCoryza,
  onFeverChange,
  onPurulenceChange,
  onAttendRapidlyChange,
  onInflamedTonselsChange,
  onNoCoughCorynaChange,
}: FeverPAINScoreProps) {
  const totalScore = (fever ? 1 : 0) +
    (purulence ? 1 : 0) +
    (attendRapidly ? 1 : 0) +
    (inflamedTonsils ? 1 : 0) +
    (noCoughCoryza ? 1 : 0);

  const getRiskBadge = (score: number) => {
    if (score <= 1) {
      return {
        label: "Low Risk — Self-care",
        color: "bg-green-50 border-green-200 text-green-700",
        icon: "✓",
      };
    }
    if (score <= 3) {
      return {
        label: "Moderate Risk — Consider Back-up Antibiotic",
        color: "bg-amber-50 border-amber-200 text-amber-700",
        icon: "⚠",
      };
    }
    return {
      label: "High Risk — Consider Immediate Antibiotic",
      color: "bg-red-50 border-red-200 text-red-700",
      icon: "!",
    };
  };

  const badge = getRiskBadge(totalScore);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">FeverPAIN:</span> Score helps predict likelihood of streptococcal throat infection.
          A higher score suggests greater risk of bacterial infection.
        </p>
      </div>

      <div className="space-y-3">
        <Checkbox
          label="Fever"
          checked={fever}
          onChange={onFeverChange}
          description="Temperature &gt;38°C in the last 24 hours"
        />

        <Checkbox
          label="Purulence"
          checked={purulence}
          onChange={onPurulenceChange}
          description="Tonsillar exudate (pus on tonsils)"
        />

        <Checkbox
          label="Attend rapidly"
          checked={attendRapidly}
          onChange={onAttendRapidlyChange}
          description="Symptoms onset <3 days ago"
        />

        <Checkbox
          label="Inflamed tonsils"
          checked={inflamedTonsils}
          onChange={onInflamedTonselsChange}
          description="Severely inflamed/enlarged tonsils"
        />

        <Checkbox
          label="No cough or runny nose (Coryza)"
          checked={noCoughCoryza}
          onChange={onNoCoughCorynaChange}
          description="Absence of cough and runny nose symptoms"
        />
      </div>

      {/* Score Display */}
      <div className={`border-2 rounded-lg p-4 ${badge.color}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">
              FeverPAIN Score: {totalScore}/5
            </p>
            <p className="text-sm font-semibold mt-1">{badge.label}</p>
          </div>
          <div className="text-3xl font-bold">{badge.icon}</div>
        </div>
      </div>
    </div>
  );
}
