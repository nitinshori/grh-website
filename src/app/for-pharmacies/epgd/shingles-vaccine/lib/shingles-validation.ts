import type { ShinglesConsultationState } from "./shingles-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: ShinglesConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 });

    case 1:
      if (!state.assessment.ageEligible) {
        return "Please confirm patient meets age eligibility (50+ or 18+ if immunosuppressed)";
      }
      if (!state.assessment.pregnancyStatus) {
        return "Pregnancy status must be specified";
      }
      return null;

    case 2:
      return null;

    case 3:
      if (
        !state.counselling.explainedDoseSchedule ||
        !state.counselling.explainedLocalReactions ||
        !state.counselling.explainedEffectiveness ||
        !state.counselling.explainedNotLiveVaccine
      ) {
        return "All key counselling items must be completed";
      }
      return null;

    case 4:
    case 5:
      return null;

    case 5:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);

    case 6:
    case 7:
      return null;

    default:
      return null;
  }
}
