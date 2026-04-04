// ─── Chickenpox Validation ───

import type { ChickenpoxConsultationState } from "./chickenpox-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(step: number, state: ChickenpoxConsultationState): string | null {
  switch (step) {
    case 0: // Patient Details
      return validatePatientStep(state.patient, { minAge: 1 });

    case 1: // Consent
      return validateConsentStep(state.consent);

    case 2: // Eligibility
      if (
        !state.eligibility.noPriorVaricella &&
        !state.eligibility.seronegative &&
        !state.eligibility.healthcareWorker &&
        !state.eligibility.closeContactImmunosuppressed
      ) {
        return "At least one eligibility criterion must be met";
      }
      return null;

    case 3: // Medical History
      return null; // All fields are optional checkboxes

    case 4: // Contraindications Review
      return null; // Review step, no validation needed

    case 5: // Vaccine Admin
      if (!state.vaccineAdmin.vaccine.trim()) {
        return "Vaccine type must be specified";
      }
      if (!state.vaccineAdmin.dose1Date) {
        return "Dose 1 date is required";
      }
      if (!state.vaccineAdmin.dose1Site.trim()) {
        return "Injection site is required";
      }
      if (!state.vaccineAdmin.administeredBy.trim()) {
        return "Administered by (name/credentials) is required";
      }
      return null;

    case 6: // Post-Vaccine
      return null; // Optional checkboxes and observations

    case 7: // Summary
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
