// ─── COPD Symptom Management Clinical Logic ───

import type { COPDConsultationState } from "./copd-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: COPDConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Only assert this once the pharmacist has worked past the assessment
  // step where the box is ticked. Before then the consultation has not
  // reached the question, and firing a hard stop on step 0 blocked the
  // tool outright (pattern reported by Rachel on Wegovy tablets, Aug 2026).
  if (state.currentStep > 2 && !state.assessment.hasExistingDiagnosis) {
    alerts.push({
      severity: "stop",
      code: "NO_COPD_DX",
      message: "No existing COPD diagnosis recorded",
      detail: "Patient must have a documented COPD diagnosis. Refer to GP.",
    });
  }

  if (state.redFlags.mrcGrade5) {
    alerts.push({
      severity: "stop",
      code: "MRC_GRADE_5",
      message: "MRC Grade 5 (housebound, breathless at rest)",
      detail: "Urgent referral required. Do not supply — refer to GP/respiratory services.",
    });
  }

  if (state.redFlags.suspectedExacerbation) {
    alerts.push({
      severity: "stop",
      code: "EXACERBATION",
      message: "Suspected acute exacerbation",
      detail: "Symptoms of exacerbation present. Refer to GP or A&E — do not supply.",
    });
  }

  if (state.redFlags.newHaemoptysis) {
    alerts.push({
      severity: "red-flag",
      code: "HAEMOPTYSIS",
      message: "New haemoptysis",
      detail: "Urgent referral to GP. May indicate serious underlying condition.",
    });
  }

  if (state.redFlags.weightLoss) {
    alerts.push({
      severity: "red-flag",
      code: "WEIGHT_LOSS",
      message: "Unintentional weight loss",
      detail: "Urgent referral to GP for investigation.",
    });
  }

  if (state.redFlags.recurrentInfections) {
    alerts.push({
      severity: "red-flag",
      code: "RECURRENT_INFECTIONS",
      message: "Recurrent respiratory infections",
      detail: "May require prophylaxis or vaccination review. Advise GP review.",
    });
  }

  return alerts;
}

export function hasHardStops(state: COPDConsultationState): boolean {
  return (
    (state.currentStep > 2 && !state.assessment.hasExistingDiagnosis) ||
    state.redFlags.mrcGrade5 ||
    state.redFlags.suspectedExacerbation
  );
}

export function calculateDoseRecommendation(
  state: COPDConsultationState
): DoseRecommendation | null {
  if (!state.medicineSupply.medicinePrescribed) return null;

  const medicineType = state.medicineSupply.medicineType;

  if (medicineType === "salbutamol") {
    return {
      medicine: "Salbutamol (Albuterol) 100mcg pressurised metered-dose inhaler",
      dose: "1-2 puffs",
      frequency: "As needed for symptom relief",
      duration: "2-week supply",
      reason: "Short-acting bronchodilator for COPD symptom management",
    };
  } else if (medicineType === "ipratropium") {
    return {
      medicine: "Ipratropium 20mcg pressurised metered-dose inhaler",
      dose: "1-2 puffs",
      frequency: "3 times daily",
      duration: "2-week supply",
      reason: "Anticholinergic bronchodilator for COPD maintenance",
    };
  }

  return null;
}
