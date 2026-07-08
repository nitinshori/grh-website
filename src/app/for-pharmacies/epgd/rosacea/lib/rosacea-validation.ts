import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validatePatient(patient: BasePatientDetails): string | null {
  return validatePatientStep(patient, { minAge: 18 }) // age gate per signed PGD (consistency review Jul 2026);
}

export function validateAssessment(assessment: { subtype: string }): string | null {
  if (!assessment.subtype) return "Rosacea subtype must be identified";
  return null;
}

export function validateContraindications(contraindicated: boolean): string | null {
  if (contraindicated) return "Patient meets exclusion criteria — cannot proceed";
  return null;
}

export function validateConsent(consent: BaseConsent): string | null {
  return validateConsentStep(consent);
}

export function validateSummary(summary: BaseSummary): string | null {
  return validateSummaryStep(summary);
}

export function validateStep(step: number, state: any): string | null {
  switch (step) {
    case 0:
      return validatePatient(state.patient);
    case 1:
      return validateConsent(state.consent);
    case 2:
      return validateAssessment(state.assessment);
    case 3:
      return validateContraindications(state.contraindications.contraindicated);
    case 6:
      return validateSummary(state.summary);
    default:
      return null;
  }
}
