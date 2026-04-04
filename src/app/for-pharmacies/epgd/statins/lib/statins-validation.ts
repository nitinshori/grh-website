// ─── Statins Validation ───

import type { StatinsConsultationState } from "./statins-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(state: StatinsConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient);

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.hasExistingPrescription) {
        return "Patient must have existing statin prescription";
      }
      if (state.assessment.lastLipidProfileMonths === null) {
        return "Date of last lipid profile required";
      }
      return null;

    case 3:
    case 4:
    case 5:
      return null; // Optional steps

    case 6:
      if (!state.medicineSupply.doseSelected) {
        return "Please select statin dose";
      }
      if (!state.medicineSupply.dosageConfirmed) {
        return "Please confirm dosage";
      }
      return null;

    case 7:
      if (!state.counselling.annualBloodTest) {
        return "Annual blood test counselling required";
      }
      return null;

    case 8:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
