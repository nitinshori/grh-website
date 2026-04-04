import type { MySimbaConsultationState } from "./mysimba-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: MySimbaConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 });
    case 1:
      if (!state.assessment.weight || !state.assessment.bmi) return "Weight and BMI required";
      return null;
    case 2:
      return !state.assessment.bmiEligible ? "Please confirm BMI eligibility" : null;
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
