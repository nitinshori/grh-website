// ─── MMR Validation ───

import type { MMRConsultationState } from "./mmr-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(step: number, state: MMRConsultationState): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient);

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Eligibility
      if (
        !state.eligibility.bornAfter1970 &&
        !state.eligibility.healthcareWorker &&
        !state.eligibility.travelToEndemicArea
      ) {
        return "At least one eligibility criterion must be met";
      }
      return null;

    case 3: // Medical History
      return null;

    case 4: // Contraindications Review
      return null;

    case 5: // Vaccine Admin
      if (!state.vaccineAdmin.vaccine.trim()) {
        return "Vaccine type must be specified";
      }
      if (!state.vaccineAdmin.vaccinationDate) {
        return "Vaccination date is required";
      }
      if (!state.vaccineAdmin.injectionSite.trim()) {
        return "Injection site is required";
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
