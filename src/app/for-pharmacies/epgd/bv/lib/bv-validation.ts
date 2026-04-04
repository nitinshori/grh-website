import type { BVConsultationState } from "./bv-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(step: number, state: BVConsultationState): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient);
    case 1:
      return validateConsentStep(state.consent);
    case 2:
      const symptomsCount = Object.values(state.assessment).filter((v) => v === true).length;
      if (symptomsCount === 0) return "At least one symptom must be selected";
      return null;
    case 3:
      return null;
    case 4:
      return null;
    case 5:
      if (!state.medicineSelection.medicineChoice) return "Medicine must be selected";
      return null;
    case 6:
      const counsellingCount = Object.values(state.counselling).filter((v) => v === true).length;
      if (counsellingCount === 0) return "At least one counselling point must be confirmed";
      return null;
    case 7:
      return validateSummaryStep(state.summary);
    default:
      return null;
  }
}
