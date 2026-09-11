import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

// Minor Wound Care PGD v007 (11 September 2026): flucloxacillin arm from
// 2 years; co-amoxiclav arm (bites and heavily contaminated wounds) from 12.
export function validatePatient(patient: BasePatientDetails): string | null {
  return validatePatientStep(patient, { minAge: 2 });
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
