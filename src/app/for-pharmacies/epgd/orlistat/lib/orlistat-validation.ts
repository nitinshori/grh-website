import type { OrlistatConsultationState } from "./orlistat-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(step: number, state: OrlistatConsultationState): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 });
    case 1:
      return validateConsentStep(state.consent);
    case 2:
      if (state.weightAssessment.height === null) return "Height is required";
      if (state.weightAssessment.weight === null) return "Weight is required";
      if (state.weightAssessment.bmi === null) return "BMI must be calculated";
      const meetsWeightCriteria =
        state.weightAssessment.bmi >= 30 ||
        (state.weightAssessment.bmi >= 28 && state.weightAssessment.comorbidities.length > 0);
      if (!meetsWeightCriteria)
        return "Patient must have BMI ≥30 or ≥28 with comorbidity";
      return null;
    case 3:
      return null;
    case 4:
      return null;
    case 5:
      return null;
    case 6:
      if (!state.medicineSupply.quantity || state.medicineSupply.quantity <= 0)
        return "Quantity must be specified";
      return null;
    case 7:
      const counsellingItems = Object.values(state.counselling).filter((v) => v === true).length;
      if (counsellingItems === 0) return "At least one counselling point must be confirmed";
      return null;
    case 8:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}

export function calculateBMI(height: number | null, weight: number | null): number | null {
  if (height === null || weight === null || height <= 0 || weight <= 0) return null;
  const heightM = height / 100;
  return Math.round((weight / (heightM * heightM)) * 10) / 10;
}
