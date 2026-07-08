import type { BasePatientDetails, BaseConsent, BaseSummary } from "../../shared/types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validatePatient(patient: BasePatientDetails): string | null {
  return validatePatientStep(patient, { minAge: 18 }) // age gate per signed PGD (consistency review Jul 2026);
}

export function validateAssessment(assessment: { currentMedication: string; currentDose: string }): string | null {
  if (!assessment.currentMedication.trim()) return "Current medication must be specified";
  if (!assessment.currentDose.trim()) return "Current dose must be documented";
  return null;
}

export function validateMonitoring(monitoring: { currentHR: number | null; currentBP: string; redFlagsPresent: boolean }): string | null {
  if (monitoring.currentHR === null) return "Current heart rate must be recorded";
  if (!monitoring.currentBP.trim()) return "Current blood pressure must be recorded";
  if (monitoring.redFlagsPresent) return "Red flag event detected — cannot proceed without GP escalation";
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
      return validateMonitoring(state.monitoring);
    case 6:
      return validateSummary(state.summary);
    default:
      return null;
  }
}
