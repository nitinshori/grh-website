// ─── COPD Validation (PGD v002, 11 September 2026) ───

import type { COPDConsultationState } from "./copd-types";
import {
  validatePatientStep,
  validateConsentStep,
  validateSummaryStep,
} from "../../shared/types";
import { salbutamolArmBlockers, amoxicillinArmBlockers } from "./copd-clinical-logic";

export function validateStep(state: COPDConsultationState, step: number): string | null {
  switch (step) {
    case 0:
      return validatePatientStep(state.patient, { minAge: 18 }); // adults aged 18 years and over

    case 1:
      return validateConsentStep(state.consent);

    case 2:
      if (!state.assessment.hasExistingDiagnosis) {
        return "Confirm the patient has a confirmed COPD diagnosis (documented spirometry and GOLD classification)";
      }
      if (!state.assessment.presentation) {
        return "Record the presentation: acute exacerbation, or breathlessness requiring symptom relief";
      }
      if (state.assessment.spo2 === null) {
        return "Record the oxygen saturation (SpO2 below 88% is an exclusion)";
      }
      if (state.assessment.salbutamolSuppliesLast12Months === null) {
        return "Record how many salbutamol supplies the patient has had under this PGD in the last 12 months";
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

    case 6: {
      const ms = state.medicineSupply;
      if (!ms.medicinePrescribed) {
        return "Please confirm medicine to supply";
      }
      if (!ms.supplySalbutamol && !ms.supplyAmoxicillin) {
        return "Select at least one medicine to supply (salbutamol and/or amoxicillin)";
      }
      if (ms.supplySalbutamol && salbutamolArmBlockers(state).length > 0) {
        return "Salbutamol is excluded for this patient: " + salbutamolArmBlockers(state).join("; ");
      }
      if (ms.supplyAmoxicillin && amoxicillinArmBlockers(state).length > 0) {
        return "Amoxicillin is excluded for this patient: " + amoxicillinArmBlockers(state).join("; ");
      }
      if (!ms.dosageConfirmed) {
        return "Please confirm dosage";
      }
      return null;
    }

    case 7: {
      const c = state.counselling;
      const ms = state.medicineSupply;
      if (!c.notReplacementForMaintenance) {
        return "Please confirm counselling on non-replacement status";
      }
      if (ms.supplySalbutamol && !c.relieverUseAndLimits) {
        return "Confirm the reliever use limits were explained (maximum 8 puffs in 24 hours, referral and 999 thresholds)";
      }
      if (ms.supplyAmoxicillin && !c.completeCourse) {
        return "Confirm the patient was told to complete the full course of amoxicillin";
      }
      if (!c.seekUrgentAssessment) {
        return "Confirm the urgent assessment advice was given (worsening breathlessness, difficulty speaking in sentences, confusion, cyanosis)";
      }
      return null;
    }

    case 8:
      return validateSummaryStep(state.summary);

    default:
      return null;
  }
}
