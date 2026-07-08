// ─── COPD Validation ───

import type { COPDConsultationState } from "./copd-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";

export function validateStep(state: COPDConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 }) // age gate per signed PGD (consistency review Jul 2026);

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.hasExistingDiagnosis) {
        return "Please confirm patient has existing COPD diagnosis";
      }
      if (state.assessment.mrcBreathlessnessScale === null) {
        return "MRC breathlessness scale is required";
      }
      if (!state.assessment.exacerbationFrequency) {
        return "Please specify exacerbation frequency";
      }
      return null;

    case 3:
      return null; // Optional step

    case 4:
      return null; // Optional step

    case 5:
      return null; // Red flags step

    case 6:
      if (!state.medicineSupply.medicinePrescribed) {
        return "Please confirm medicine to supply";
      }
      if (!state.medicineSupply.medicineType) {
        return "Please select medicine type";
      }
      if (!state.medicineSupply.dosageConfirmed) {
        return "Please confirm dosage";
      }
      return null;

    case 7:
      if (!state.counselling.notReplacementForMaintenance) {
        return "Please confirm counselling on non-replacement status";
      }
      return null;

    case 8:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
