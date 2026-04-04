import type { MounjaroConsultationState } from "./mounjaro-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(step: number, state: MounjaroConsultationState): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 18 });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Weight Assessment
      if (state.weightAssessment.height === null) return "Height is required";
      if (state.weightAssessment.weight === null) return "Weight is required";
      if (state.weightAssessment.bmi === null) return "BMI must be calculated";
      // Must meet BMI criteria: >= 30 OR (>= 27 AND has comorbidity)
      const meetsWeightCriteria =
        state.weightAssessment.bmi >= 30 ||
        (state.weightAssessment.bmi >= 27 && state.weightAssessment.comorbidities.length > 0);
      if (!meetsWeightCriteria)
        return "Patient must have BMI ≥30 or ≥27 with comorbidity (T2DM, hypertension, dyslipidaemia, OSA)";
      return null;

    case 3: // Medical History
      return null; // No specific validation

    case 4: // Current Medications
      return null; // No specific validation

    case 5: // Contraindications Review
      return null; // Review only

    case 6: // Dose Selection
      if (!state.doseSelection.dose) return "Dose selection is required";
      if (state.doseSelection.pharmacistOverride && !state.doseSelection.overrideReason.trim())
        return "Reason for override is required";
      return null;

    case 7: // Counselling
      const counsellingItems = Object.values(state.counselling).filter((v) => v === true).length;
      if (counsellingItems === 0) return "At least one counselling point must be confirmed";
      return null;

    case 8: // Summary
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
