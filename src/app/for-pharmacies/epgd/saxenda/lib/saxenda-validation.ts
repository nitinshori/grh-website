import type { SaxendaConsultationState } from "./saxenda-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: SaxendaConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 });
    case 1:
      if (state.assessment.weight === null || state.assessment.weight <= 0) {
        return "Valid weight is required";
      }
      if (state.assessment.bmi === null || state.assessment.bmi < 20) {
        return "Valid BMI is required (BMI >= 20)";
      }
      return null;
    case 2:
      if (!state.assessment.bmiEligible) {
        return "Please confirm BMI eligibility";
      }
      if (!state.assessment.pregnancyStatus) {
        return "Pregnancy status must be specified";
      }
      return null;
    case 3:
    case 4:
    case 5:
      return null;
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    case 7:
    case 8:
      return null;
    default:
      return null;
  }
}
