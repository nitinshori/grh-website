import type { CovidBoosterConsultationState } from "./covid-booster-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: CovidBoosterConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 });

    case 1:
      if (!state.assessment.adultConfirmed) {
        return "Please confirm patient is 18 years or older";
      }
      if (!state.assessment.previousCovidVaccine) {
        return "Patient must have received a previous COVID-19 vaccine";
      }
      if (!state.assessment.timelinessEligible) {
        return "Please confirm patient meets timelines for booster eligibility";
      }
      return null;

    case 2:
      return null;

    case 3:
      if (
        !state.counselling.explainedBoosterRationale ||
        !state.counselling.discussedCommonReactions ||
        !state.counselling.explainedObservationPeriod
      ) {
        return "All key counselling items must be completed";
      }
      return null;

    case 4:
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
