// ─── Statins Clinical Logic ───

import type { StatinsConsultationState } from "./statins-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: StatinsConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (!state.assessment.hasExistingPrescription) {
    alerts.push({
      severity: "stop",
      code: "NO_PRESCRIPTION",
      message: "No existing statin prescription",
      detail: "Continuation supply only. Patient must have GP-initiated treatment.",
    });
  }

  if (state.medicalHistory.activeLiverDisease) {
    alerts.push({
      severity: "stop",
      code: "LIVER_DISEASE",
      message: "Active liver disease",
      detail: "Statins contraindicated. Refer to GP.",
    });
  }

  if (state.medicalHistory.elevatedTransaminases) {
    alerts.push({
      severity: "stop",
      code: "ELEVATED_LFT",
      message: "Unexplained persistent elevated transaminases (&gt;3x ULN)",
      detail: "Statin therapy contraindicated. Refer to GP.",
    });
  }

  if (state.medicalHistory.pregnant || state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: "Pregnant or breastfeeding",
      detail: "Statins contraindicated in pregnancy/breastfeeding.",
    });
  }

  if (state.redFlags.unexplainedMusclePain) {
    alerts.push({
      severity: "red-flag",
      code: "MUSCLE_PAIN",
      message: "Unexplained muscle pain/weakness",
      detail: "Rhabdomyolysis risk. Stop statin and refer urgently.",
    });
  }

  if (state.redFlags.myopathy) {
    alerts.push({
      severity: "red-flag",
      code: "MYOPATHY",
      message: "History of statin-induced myopathy",
      detail: "Contraindication to rechallenge. Refer to GP.",
    });
  }

  if (state.redFlags.newDiabetesSymptoms) {
    alerts.push({
      severity: "red-flag",
      code: "DIABETES",
      message: "New-onset diabetes symptoms",
      detail: "Refer to GP for evaluation.",
    });
  }

  if (state.redFlags.yellowing) {
    alerts.push({
      severity: "red-flag",
      code: "JAUNDICE",
      message: "Yellowing of skin/eyes",
      detail: "Hepatotoxicity concern. Stop statin and refer urgently.",
    });
  }

  return alerts;
}

export function hasHardStops(state: StatinsConsultationState): boolean {
  return (
    !state.assessment.hasExistingPrescription ||
    state.medicalHistory.activeLiverDisease ||
    state.medicalHistory.elevatedTransaminases ||
    state.medicalHistory.pregnant ||
    state.medicalHistory.breastfeeding ||
    state.redFlags.myopathy
  );
}

export function calculateDoseRecommendation(
  state: StatinsConsultationState
): DoseRecommendation | null {
  if (!state.medicineSupply.doseSelected) return null;

  return {
    medicine: `Atorvastatin ${state.medicineSupply.doseSelected}mg tablets`,
    dose: `${state.medicineSupply.doseSelected}mg`,
    frequency: "Once daily (any time)",
    duration: "28-day supply (continuation)",
    reason: "Continuation of existing statin therapy for lipid management",
  };
}
