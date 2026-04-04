import type { AlcoholReductionConsultationState } from "./alcohol-reduction-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: AlcoholReductionConsultationState): string | null {
  switch (stepIndex) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 });

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (state.assessment.auditScore === null) return "Please enter AUDIT score";
      if (state.assessment.unitPerWeek === null) return "Please enter units per week";
      if (!state.assessment.dependenceLevel) return "Please select dependence level";
      return null;

    case 3:
      return null;

    case 4:
      return null;

    case 5:
      return null;

    case 6:
      if (!state.medicineSupply.quantity) return "Please enter quantity to supply";
      if (!state.medicineSupply.psychosocialSupport) return "Please confirm psychosocial support arranged";
      return null;

    case 7:
      if (
        !state.counselling.prnDosing ||
        !state.counselling.beforeDrinking ||
        !state.counselling.rewardMechanism ||
        !state.counselling.noDisulfiramReaction ||
        !state.counselling.avoidOpioids ||
        !state.counselling.psychosocialSupport
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
