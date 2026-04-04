import type { GonorrhoeaConsultationState } from "./gonorrhoea-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: GonorrhoeaConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient);
    case 1:
      if (!state.assessment.neatPositive) return "NAAT-confirmed gonorrhoea diagnosis required";
      if (state.assessment.pharyngealGonorrhoea) return "Pharyngeal gonorrhoea requires specialist referral (not in this PGD)";
      return null;
    case 5:
      return null;
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
