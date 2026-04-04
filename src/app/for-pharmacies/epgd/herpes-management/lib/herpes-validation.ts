import type { HerpesConsultationState } from "./herpes-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: HerpesConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient);
    case 1:
      if (!state.assessment.herpesDiagnosed) return "Herpes diagnosis confirmation required";
      return null;
    case 4:
      return null;
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
