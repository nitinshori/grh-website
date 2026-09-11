import type { ThrushConsultationState } from "./thrush-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";
import { getMedicineSelectionError } from "./thrush-clinical-logic";

export function validateStep(step: number, state: ThrushConsultationState): string | null {
  switch (step) {
    case 0:
      // PGD v003: women aged 16 to 60 (exclusion row: under 16 or over 60)
      return validatePatientStep(state.patient, {
        minAge: 16,
        maxAge: 60,
        requireFemale: true,
        femaleConfirmed: state.medicalHistory.femaleConfirmed,
      });
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
      return getMedicineSelectionError(state);
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
