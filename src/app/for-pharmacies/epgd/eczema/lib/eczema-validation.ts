import type { EczemaConsultationState } from "./eczema-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: EczemaConsultationState): string | null {
  switch (stepIndex) {
    case 0:
      return validatePatientStep(state.patient);

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.severity) return "Please select eczema severity";
      if (
        !state.assessment.isDry &&
        !state.assessment.isRed &&
        !state.assessment.isThickened &&
        !state.assessment.isCracked &&
        !state.assessment.isOozing
      ) {
        return "Please select at least one eczema manifestation";
      }
      if (!state.assessment.affectedSite.trim()) return "Please describe affected site";
      return null;

    case 3:
      if (!state.medicalHistory.allergies.trim()) return "Please record allergy status";
      return null;

    case 4:
      return null;

    case 5:
      if (!state.medicineSelection.emollientFirst) return "Please confirm emollient as base";
      if (!state.assessment.severity.includes("mild") && !state.medicineSelection.steroidChoice) {
        return "Please select steroid strength";
      }
      return null;

    case 6:
      if (
        !state.counselling.emollientFirst ||
        !state.counselling.fingertipUnits ||
        !state.counselling.applyThinly ||
        !state.counselling.stepDownApproach ||
        !state.counselling.avoidTriggers
      ) {
        return "Please confirm all counselling points have been covered";
      }
      return null;

    case 7:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
