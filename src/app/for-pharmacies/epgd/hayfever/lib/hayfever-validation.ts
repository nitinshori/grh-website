// ─── Hayfever Validation ───

import type { HayfeverConsultationState } from "./hayfever-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(state: HayfeverConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient);

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.symptomSeverity) {
        return "Please select symptom severity";
      }
      if (!state.assessment.seasonalOrPerennial) {
        return "Please specify seasonal or perennial symptoms";
      }
      return null;

    case 3:
      return null; // Optional

    case 4:
      return null; // Optional

    case 5:
      if (!state.medicineSupply.medicineSelected) {
        return "Please select medicine to supply";
      }
      if (!state.medicineSupply.dosageConfirmed) {
        return "Please confirm dosage with patient";
      }
      return null;

    case 6:
      if (!state.counselling.allergenAvoidance) {
        return "Please confirm allergen avoidance counselling";
      }
      return null;

    case 7:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
