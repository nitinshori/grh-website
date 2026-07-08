// ─── Hypertension Validation ───

import type { HypertensionConsultationState } from "./hypertension-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(state: HypertensionConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 }) // age gate per signed PGD (consistency review Jul 2026);

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.hasExistingDiagnosis) {
        return "Patient must have existing hypertension diagnosis";
      }
      if (state.assessment.stableOnTreatmentMonths === null) {
        return "Duration on treatment is required";
      }
      if (state.assessment.clinicSystolic === null || state.assessment.clinicDiastolic === null) {
        return "Current BP readings required";
      }
      return null;

    case 3:
      return null; // Optional

    case 4:
      return null; // Optional

    case 5:
      return null; // Optional

    case 6:
      if (!state.monitoring.homeMonitoringDone) {
        return "Please confirm home monitoring has been done or not available";
      }
      return null;

    case 7:
      if (!state.medicineSupply.amlodipineDoseSelected) {
        return "Please select amlodipine dose";
      }
      if (!state.medicineSupply.dosageConfirmed) {
        return "Please confirm dosage";
      }
      return null;

    case 8:
      if (!state.counselling.grapefruitmInteractionWarned) {
        return "Grapefruit interaction must be discussed";
      }
      return null;

    case 9:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
