// ─── Recurrent UTI Validation ───

import type { RecurrentUTIConsultationState } from "./recurrent-uti-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(step: number, state: RecurrentUTIConsultationState): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 16, maxAge: 65 });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // UTI History
      if (state.utiHistory.utiInPast12Months === 0 && state.utiHistory.utiInPast6Months === 0) {
        return "At least one documented UTI must be recorded";
      }
      if (!state.utiHistory.confirmedByRecords) {
        return "UTIs must be confirmed by clinical records";
      }
      return null;

    case 3: // Medical History
      return null;

    case 4: // Current Medications
      return null;

    case 5: // Contraindications Review
      return null;

    case 6: // Medicine Selection
      if (!state.medicines.medicine) {
        return "Medicine must be selected";
      }
      if (!state.medicines.dose) {
        return "Dose must be specified";
      }
      if (!state.medicines.frequency) {
        return "Frequency must be specified";
      }
      if (!state.medicines.duration) {
        return "Duration must be specified";
      }
      return null;

    case 7: // Counselling & Supply
      return null;

    case 8: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
