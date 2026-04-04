import type { GLP1ConsultationState } from "./glp1-monitoring-types";
import { validatePatientStep, validateConsentStep, validateSummaryStep } from "../../shared/types";

export function validateStep(state: GLP1ConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient);
    case 1:
      if (!state.assessment.patientOnGLP1) return "Confirm patient is on GLP-1 therapy";
      if (!state.assessment.medicationName.trim()) return "GLP-1 medication name required";
      return null;
    case 6:
      return validateConsentStep(state.consent) || validateSummaryStep(state.summary);
    default:
      return null;
  }
}
