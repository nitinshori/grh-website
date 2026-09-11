import type { AnxietyPropranololConsultationState } from "./anxiety-propranolol-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(stepIndex: number, state: AnxietyPropranololConsultationState): string | null {
  switch (stepIndex) {
    case 0:
      // PGD v004: adults aged 18 years and over.
      return validatePatientStep(state.patient, { minAge: 18 });

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
      if (!state.medicineSupply.regimen) return "Please select the dosing regimen";
      const q = state.medicineSupply.quantity;
      if (q === null) return "Please enter quantity to supply";
      if (q < 1) return "Please enter quantity to supply";
      // PGD v002: 10mg tablets only, and the whole supply must stay below
      // 320mg. 28 x 10mg is 280mg.
      if (q > 28) return "Maximum 28 tablets of 10mg under this PGD (280mg in total)";
      return null;
    }

    case 7:
      if (
        !state.counselling.prnUseOnly ||
        !state.counselling.physicalSymptoms ||
        !state.counselling.noDependence ||
        !state.counselling.noSuddenWithdrawal ||
        !state.counselling.avoidVerapamil ||
        !state.counselling.reportWheeze ||
        !state.counselling.coldExtremities ||
        !state.counselling.notACure ||
        !state.counselling.avoidAlcohol
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
