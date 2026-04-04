import type { HRTConsultationState } from "./hrt-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(step: number, state: HRTConsultationState): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18, maxAge: 85 });
    case 1:
      return validateConsentStep(state.consent);
    case 2:
      if (!state.assessment.menopauseStatus) return "Menopause status is required";
      return null;
    case 3:
      return null;
    case 4:
      return null;
    case 5:
      return null;
    case 6:
      if (!state.hrtSelection.hrtType) return "HRT type must be selected";
      if (!state.hrtSelection.oestroaddressRoute) return "Oestrogen route must be selected";
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
