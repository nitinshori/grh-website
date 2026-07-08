import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validatePatient(patient: BasePatientDetails): string | null {
  return validatePatientStep(patient, { minAge: 18 }) // age gate per signed PGD (consistency review Jul 2026);
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
    case 5:
      return validateSummary(state.summary);
    default:
      return null;
  }
}
