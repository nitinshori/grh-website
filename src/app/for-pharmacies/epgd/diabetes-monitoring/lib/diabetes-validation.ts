// ─── Diabetes Validation ───

import type { DiabetesConsultationState } from "./diabetes-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(state: DiabetesConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient);

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.hasExistingT2DM) {
        return "Patient must have existing Type 2 DM diagnosis";
      }
      if (state.assessment.stableOnMetforminMonths === null) {
        return "Duration on metformin required";
      }
      if (state.assessment.lastHbA1cMonths === null) {
        return "Last HbA1c date required";
      }
      if (state.assessment.lastEgfrMonths === null) {
        return "Last eGFR date required";
      }
      return null;

    case 3:
    case 4:
      return null; // Optional

    case 5:
      if (state.assessment.lastEgfrValue === null) {
        return "Last eGFR value required";
      }
      return null;

    case 6:
      return null; // Optional

    case 7:
      if (!state.medicineSupply.metforminFormatSelected) {
        return "Please select metformin format";
      }
      if (!state.medicineSupply.doseSelected) {
        return "Please select dose";
      }
      if (!state.medicineSupply.eGFRBasedDoseAdjustment) {
        return "eGFR-based dose adjustment confirmation required";
      }
      return null;

    case 8:
      if (!state.counselling.sickDayRules) {
        return "Sick day rules must be discussed";
      }
      return null;

    case 9:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
