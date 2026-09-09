import type { AnxietyPropranololConsultationState } from "./anxiety-propranolol-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: AnxietyPropranololConsultationState): string | null {
  switch (stepIndex) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 12 });

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.anxietyType) return "Please select anxiety type";
      if (!state.assessment.triggerSituation.trim()) return "Please describe trigger situation";
      if (!state.assessment.physicalSymptoms.trim()) return "Please describe physical symptoms";
      return null;

    case 3:
      return null;

    case 4:
      return null;

    case 5:
      return null;

    case 6: {
      const q = state.medicineSupply.quantity;
      if (q === null) return "Please enter quantity to supply";
      // PGD v002: the same total of propranolol whichever strength, 560mg.
      const cap = state.medicineSupply.strength === "40mg" ? 14 : 56;
      if (q > cap) return `Maximum ${cap} tablets of ${state.medicineSupply.strength} under this PGD (560mg in total)`;
      return null;
    }

    case 7:
      if (
        !state.counselling.prnUseOnly ||
        !state.counselling.physicalSymptoms ||
        !state.counselling.noDependence ||
        !state.counselling.noSuddenWithdrawal ||
        !state.counselling.avoidVerapamil
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
