// ─── Hypertension Clinical Logic ───

import type { HypertensionConsultationState } from "./hypertension-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: HypertensionConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Only assert this once the pharmacist has worked past the assessment
  // step where the box is ticked. Before then the consultation has not
  // reached the question, and firing a hard stop on step 0 blocked the
  // tool outright (pattern reported by Rachel on Wegovy tablets, Aug 2026).
  if (state.currentStep > 2 && !state.assessment.hasExistingDiagnosis) {
    alerts.push({
      severity: "stop",
      code: "NO_HTN_DX",
      message: "No existing hypertension diagnosis",
      detail: "This is continuation supply only. GP initiation required.",
    });
  }

  if (state.redFlags.bpGreater180110) {
    alerts.push({
      severity: "stop",
      code: "BP_CRITICAL",
      message: "BP &gt;180/110 mmHg",
      detail: "Urgent GP referral required. Do not supply.",
    });
  }

  if (state.redFlags.newChestPain) {
    alerts.push({
      severity: "red-flag",
      code: "CHEST_PAIN",
      message: "New chest pain",
      detail: "Urgent GP review required.",
    });
  }

  if (state.redFlags.severeHeadache) {
    alerts.push({
      severity: "red-flag",
      code: "SEVERE_HEADACHE",
      message: "Severe headache",
      detail: "May indicate hypertensive crisis. GP review required.",
    });
  }

  if (state.redFlags.visualChanges) {
    alerts.push({
      severity: "red-flag",
      code: "VISUAL_CHANGES",
      message: "Visual changes",
      detail: "May indicate hypertensive emergency. Urgent GP review.",
    });
  }

  if (state.medicineSupply.amlodipineDoseSelected && state.assessment.stableOnTreatmentMonths && state.assessment.stableOnTreatmentMonths < 3) {
    alerts.push({
      severity: "caution",
      code: "RECENT_CHANGE",
      message: "Less than 3 months on current treatment",
      detail: "Ensure adequate stability before continuation supply.",
    });
  }

  return alerts;
}

export function hasHardStops(state: HypertensionConsultationState): boolean {
  return (
    !state.assessment.hasExistingDiagnosis ||
    state.redFlags.bpGreater180110
  );
}

export function calculateDoseRecommendation(
  state: HypertensionConsultationState
): DoseRecommendation | null {
  if (!state.medicineSupply.amlodipineDoseSelected) return null;

  const dose = state.medicineSupply.amlodipineDoseSelected;

  return {
    medicine: `Amlodipine ${dose}mg tablets`,
    dose: `${dose}mg`,
    frequency: "Once daily",
    duration: "28-day supply (continuation)",
    reason: "Continuation of existing hypertension treatment",
  };
}
