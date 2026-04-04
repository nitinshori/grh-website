"use client";

import type { WeightRelatedComorbidity } from "../lib/wegovy-types";
import { calculateBMI, getBMICategory } from "../lib/wegovy-clinical-logic";
import { NumberInput, Checkbox } from "../../shared/components/FormInputs";

const COMORBIDITIES = [
  { value: "hypertension" as const, label: "Hypertension" },
  { value: "type2diabetes" as const, label: "Type 2 Diabetes" },
  { value: "sleepApnoea" as const, label: "Sleep Apnoea" },
  { value: "osteoarthritis" as const, label: "Osteoarthritis" },
  { value: "pcos" as const, label: "PCOS (Polycystic Ovary Syndrome)" },
  { value: "dyslipidaemia" as const, label: "Dyslipidaemia" },
];

export function BMICalculator({
  height,
  weight,
  waistCircumference,
  comorbidities,
  onHeightChange,
  onWeightChange,
  onWaistChange,
  onComorbidityToggle,
}: {
  height: number | null;
  weight: number | null;
  waistCircumference: number | null;
  comorbidities: WeightRelatedComorbidity[];
  onHeightChange: (v: number | null) => void;
  onWeightChange: (v: number | null) => void;
  onWaistChange: (v: number | null) => void;
  onComorbidityToggle: (c: WeightRelatedComorbidity, checked: boolean) => void;
}) {
  const bmi = calculateBMI(height, weight);
  const category = getBMICategory(bmi);

  const getBMIColor = () => {
    switch (category) {
      case "underweight":
        return "bg-gray-100 border-gray-300 text-gray-700";
      case "normal":
        return "bg-green-50 border-green-300 text-green-700";
      case "overweight":
        return "bg-amber-50 border-amber-300 text-amber-700";
      case "obese-i":
        return "bg-orange-50 border-orange-300 text-orange-700";
      case "obese-ii":
        return "bg-red-50 border-red-300 text-red-700";
      case "obese-iii":
        return "bg-red-100 border-red-400 text-red-800";
      default:
        return "bg-gray-50 border-gray-300 text-gray-600";
    }
  };

  const getBMICategoryLabel = () => {
    switch (category) {
      case "underweight":
        return "Underweight (BMI <18.5)";
      case "normal":
        return "Normal weight (BMI 18.5-24.9)";
      case "overweight":
        return "Overweight (BMI 25-29.9)";
      case "obese-i":
        return "Obese Class I (BMI 30-34.9)";
      case "obese-ii":
        return "Obese Class II (BMI 35-39.9)";
      case "obese-iii":
        return "Obese Class III (BMI ≥40)";
      default:
        return "Enter height and weight to calculate BMI";
    }
  };

  const isEligible =
    bmi !== null &&
    ((bmi >= 30) || (bmi >= 27 && bmi < 30 && comorbidities.length > 0));

  return (
    <div className="space-y-6">
      {/* Measurements */}
      <div className="grid sm:grid-cols-3 gap-4">
        <NumberInput
          label="Height"
          value={height}
          onChange={onHeightChange}
          min={50}
          max={250}
          unit="cm"
        />
        <NumberInput
          label="Weight"
          value={weight}
          onChange={onWeightChange}
          min={20}
          max={300}
          unit="kg"
        />
        <NumberInput
          label="Waist circumference"
          value={waistCircumference}
          onChange={onWaistChange}
          min={50}
          max={200}
          unit="cm"
        />
      </div>

      {/* BMI Result */}
      {bmi !== null && (
        <div className={`p-4 border-2 rounded-lg ${getBMIColor()}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                BMI
              </p>
              <p className="text-2xl font-bold">{bmi.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{getBMICategoryLabel()}</p>
              {isEligible && (
                <p className="text-xs mt-1 font-medium opacity-75">
                  Eligible for Wegovy
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comorbidities Checklist */}
      <div>
        <h3 className="text-sm font-semibold text-navy-900 mb-3">
          Weight-Related Comorbidities
          <span className="text-xs text-gray-500 font-normal ml-2">
            {bmi !== null && bmi >= 27 && bmi < 30
              ? "(Required for BMI 27-29.9)"
              : "(Optional for BMI ≥30)"}
          </span>
        </h3>
        <p className="text-xs text-gray-600 mb-3">
          Select any weight-related comorbidities present:
        </p>
        <div className="space-y-2">
          {COMORBIDITIES.map((c) => (
            <Checkbox
              key={c.value}
              label={c.label}
              checked={comorbidities.includes(c.value)}
              onChange={(checked) => onComorbidityToggle(c.value, checked)}
            />
          ))}
        </div>
      </div>

      {/* Eligibility Summary */}
      {bmi !== null && (
        <div
          className={`p-4 border-l-4 rounded ${
            isEligible
              ? "bg-green-50 border-green-400"
              : "bg-amber-50 border-amber-400"
          }`}
        >
          <p className="text-sm font-semibold text-navy-900 mb-1">
            {isEligible ? "Eligibility Confirmed" : "Does Not Meet Eligibility Criteria"}
          </p>
          <p className="text-xs text-gray-700">
            {bmi >= 30
              ? "BMI ≥30: Patient meets weight criteria for Wegovy"
              : bmi >= 27 && bmi < 30 && comorbidities.length > 0
                ? "BMI 27-29.9 with comorbidity: Patient meets weight criteria for Wegovy"
                : bmi >= 27 && bmi < 30
                  ? "BMI 27-29.9: Add comorbidities to meet eligibility"
                  : "BMI <27: Does not meet minimum threshold"}
          </p>
        </div>
      )}
    </div>
  );
}
