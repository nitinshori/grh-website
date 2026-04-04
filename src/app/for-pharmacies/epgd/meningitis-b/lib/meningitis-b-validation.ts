// ─── Meningitis B Validation ───

import type { MeningitiBConsultationState } from "./meningitis-b-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(step: number, state: MeningitiBConsultationState): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient);

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Risk Assessment
      if (
        !state.riskAssessment.closeContactOfCase &&
        !state.riskAssessment.complementDeficiency &&
        !state.riskAssessment.asplenia &&
        !state.riskAssessment.universityFresher &&
        !state.riskAssessment.hyperendemicArea
      ) {
        return "At least one risk factor should be present";
      }
      return null;

    case 3: // Medical History
      return null;

    case 4: // Contraindications Review
      return null;

    case 5: // Vaccine Admin
      if (!state.vaccineAdmin.vaccinationDate1) {
        return "Dose 1 date is required";
      }
      if (!state.vaccineAdmin.injectionSite1.trim()) {
        return "Dose 1 injection site is required";
      }
      if (!state.vaccineAdmin.vaccinationDate2) {
        return "Dose 2 date is required";
      }
      if (!state.vaccineAdmin.injectionSite2.trim()) {
        return "Dose 2 injection site is required";
      }
      if (!state.vaccineAdmin.administeredBy.trim()) {
        return "Administered by (name/credentials) is required";
      }
      return null;

    case 6: // Post-Vaccine
      return null;

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
