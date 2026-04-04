import type { HPVConsultationState } from "./hpv-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: HPVConsultationState, step: number): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, {
        requireFemale: true,
        femaleConfirmed: state.patient.femaleConfirmed,
        minAge: 9,
      });

    case 1: // Vaccine Assessment
      if (!state.assessment.pregnancyStatus.trim()) {
        return "Pregnancy status must be specified";
      }
      return null;

    case 2: // Red Flags & Exclusions
      return null;

    case 3: // Counselling
      if (
        !state.counselling.explainedDoseSchedule ||
        !state.counselling.explainedProtection ||
        !state.counselling.discussedCommonReactions ||
        !state.counselling.explainedNotTreatment
      ) {
        return "All counselling items must be completed";
      }
      return null;

    case 4: // Vaccine Supply
      return null;

    case 5: // Summary & Declaration
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);

    case 6: // Consultation Complete
      return null;

    case 7: // Review
      return null;

    default:
      return null;
  }
}
