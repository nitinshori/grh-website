import type { GenitalWartsConsultationState } from "./genital-warts-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: GenitalWartsConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient);
    case 1:
      if (!state.assessment.wartCount) return "Wart count required";
      return null;
    case 2:
      if (state.assessment.internalWartsPresent || state.assessment.analWarts || state.assessment.cervicalWarts) {
        return "Internal/anal/cervical warts require specialist referral";
      }
      if (!state.assessment.externalWartsOnly) return "Confirm warts are external only";
      return null;
    case 5:
      return null;
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
