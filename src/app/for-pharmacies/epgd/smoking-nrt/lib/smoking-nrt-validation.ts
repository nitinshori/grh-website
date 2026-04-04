import type { SmokingNRTConsultationState } from "./smoking-nrt-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: SmokingNRTConsultationState): string | null {
  switch (stepIndex) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (state.assessment.cigarettesPerDay === null) return "Please enter cigarettes per day";
      if (!state.assessment.timeToFirstCigarette) return "Please select time to first cigarette";
      if (!state.assessment.quitDate) return "Please set a quit date";
      return null;

    case 3:
      return null;

    case 4:
      return null;

    case 5:
      return null;

    case 6:
      if (!state.nrtSelection.usePatches && !state.nrtSelection.useOralForm) {
        return "Please select at least one form of NRT";
      }
      if (!state.nrtSelection.behavioralSupport) {
        return "Please confirm behavioral support arranged";
      }
      return null;

    case 7:
      if (
        !state.counselling.combinationBetter ||
        !state.counselling.quitDate ||
        !state.counselling.behavioralSupport ||
        !state.counselling.sideEffects ||
        !state.counselling.courseDuration
      ) {
        return "Please confirm all counselling points have been covered";
      }
      return null;

    case 8:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
