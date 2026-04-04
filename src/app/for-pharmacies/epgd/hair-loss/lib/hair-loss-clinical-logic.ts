// ─── Hair Loss (Finasteride) Clinical Logic ───

import type { ClinicalAlert, DoseRecommendation, AlertSeverity } from "../../shared/types";
import type { HLConsultationState } from "./hair-loss-types";

// ─── Get all clinical alerts ───

export function getAllAlerts(state: HLConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stop: Not male
  if (!state.patient.maleConfirmed) {
    alerts.push({
      severity: "stop",
      code: "HL_GENDER",
      message: "This PGD is for male patients only",
      detail: "Finasteride is teratogenic and contraindicated in women (pregnancy risk).",
    });
  }

  // Hard stop: Age <18 or >65
  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "HL_AGE_MIN",
      message: "Patient must be 18 years or older",
      detail: "Finasteride is not recommended in patients under 18.",
    });
  }

  if (state.patient.age !== null && state.patient.age > 65) {
    alerts.push({
      severity: "stop",
      code: "HL_AGE_MAX",
      message: "This PGD is for patients 65 years or younger",
      detail: "Finasteride may be used in older men but this PGD recommends age <65.",
    });
  }

  // Hard stop: Liver disease
  if (state.medicalHistory.liverDisease) {
    alerts.push({
      severity: "stop",
      code: "HL_LIVER",
      message: "Severe liver disease is a contraindication",
      detail: "Finasteride is metabolised by hepatic cytochrome P450. Refer to GP.",
    });
  }

  // Hard stop: Prostate cancer
  if (state.medicalHistory.prostateCancer) {
    alerts.push({
      severity: "stop",
      code: "HL_PROSTATE_CANCER",
      message: "History of prostate cancer is a contraindication",
      detail: "Finasteride is not suitable. Refer to urology.",
    });
  }

  // Hard stop: PSA abnormalities
  if (state.medicalHistory.psaAbnormalities) {
    alerts.push({
      severity: "stop",
      code: "HL_PSA",
      message: "PSA abnormalities are a contraindication",
      detail: "Refer to GP for further assessment before considering finasteride.",
    });
  }

  // Hard stop: Hypersensitivity
  if (state.medicalHistory.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "HL_HYPERSENS",
      message: "Known hypersensitivity to finasteride or other 5-alpha reductase inhibitors",
      detail: "Do not supply. Document allergy in patient record.",
    });
  }

  // Caution: Depressive mood
  if (state.contraindications.depressiveMood) {
    alerts.push({
      severity: "caution",
      code: "HL_MOOD",
      message: "Patient reports depressive mood or mood changes",
      detail: "Finasteride may affect mood. Counsel patient to report mood changes and liaise with GP.",
    });
  }

  // Caution: Partner not notified (teratogenic)
  if (
    state.medicineSupply.finasteride1mgOd &&
    !state.medicineSupply.partnerNotified
  ) {
    alerts.push({
      severity: "caution",
      code: "HL_PARTNER",
      message: "Partner should be made aware of teratogenic risk",
      detail: "Women should not handle crushed tablets. If partner may be pregnant, advise caution.",
    });
  }

  // Caution: PSA effect awareness
  if (
    state.medicineSupply.finasteride1mgOd &&
    !state.medicineSupply.understandsPSAEffect
  ) {
    alerts.push({
      severity: "caution",
      code: "HL_PSA_EFFECT",
      message: "Patient should understand PSA effect",
      detail: "Finasteride lowers PSA by ~50%. Inform GP and ensure patient understands when checking PSA.",
    });
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: HLConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// ─── Calculate dose recommendation ───

export function calculateDoseRecommendation(
  state: HLConsultationState
): DoseRecommendation | null {
  if (!state.patient.maleConfirmed) return null;
  if (state.patient.age === null || state.patient.age < 18) return null;
  if (hasHardStops(state)) return null;

  return {
    medicine: "Finasteride",
    dose: "1 mg",
    frequency: "Once daily",
    dosingRegimen: "1mg OD (oral daily)",
    reason: "Male-pattern baldness (androgenetic alopecia). Standard indication for finasteride.",
  };
}
