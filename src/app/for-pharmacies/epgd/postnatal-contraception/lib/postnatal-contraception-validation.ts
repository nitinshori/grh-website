// ─── Postnatal Contraception Validation ───

import type { PostnatalContraceptionState } from "./postnatal-contraception-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(step: number, state: PostnatalContraceptionState): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient);

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Postnatal Assessment
      if (state.assessment.weeksPostpartum === 0) {
        return "Weeks postpartum must be specified";
      }
      if (!state.assessment.deliveryType) {
        return "Delivery type must be specified";
      }
      if (!state.assessment.breastfeedingStatus) {
        return "Breastfeeding status must be specified";
      }
      if (!state.assessment.vteRiskAssessment) {
        return "VTE risk assessment must be completed";
      }
      return null;

    case 3: // Medical History
      return null;

    case 4: // Contraindications Review
      return null;

    case 5: // Medicine Supply
      if (state.medicineSupply.quantity === 0) {
        return "Medicine quantity must be specified";
      }
      if (!state.medicineSupply.startDate) {
        return "Start date is required";
      }
      if (!state.medicineSupply.administeredBy.trim()) {
        return "Supplied by (name/credentials) is required";
      }
      return null;

    case 6: // Counselling
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
