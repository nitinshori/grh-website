// ─── BPH (Tamsulosin) Clinical Logic ───

import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";
import type { BPHConsultationState } from "./bph-types";

// ─── Get all clinical alerts ───

export function getAllAlerts(state: BPHConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stop: Not male
  if (!state.patient.maleConfirmed) {
    alerts.push({
      severity: "stop",
      code: "BPH_GENDER",
      message: "This PGD is for male patients only",
      detail: "Tamsulosin is indicated for BPH in males. Females do not have prostate.",
    });
  }

  // Red flags: Urgent referral
  if (state.redFlags.haematuria) {
    alerts.push({
      severity: "stop",
      code: "BPH_HAEMATURIA",
      message: "Haematuria requires urgent urological assessment",
      detail: "Refer to urology urgently. Do not supply medicine until haematuria is investigated.",
    });
  }

  if (state.redFlags.acuteRetention) {
    alerts.push({
      severity: "stop",
      code: "BPH_RETENTION",
      message: "Acute retention requires urgent referral",
      detail: "Patient requires emergency urological assessment. Do not supply medicine.",
    });
  }

  if (state.redFlags.palpableBladder) {
    alerts.push({
      severity: "stop",
      code: "BPH_PALPABLE",
      message: "Palpable bladder requires urgent assessment",
      detail: "Suggests significant urinary retention. Refer to GP/urology urgently.",
    });
  }

  if (state.redFlags.psa4OrAbove) {
    alerts.push({
      severity: "stop",
      code: "BPH_PSA",
      message: "Elevated PSA (≥4 ng/mL) requires urological assessment",
      detail: "Refer to GP or urology for prostate cancer screening before supply.",
    });
  }

  if (state.redFlags.weightLoss) {
    alerts.push({
      severity: "stop",
      code: "BPH_WEIGHT_LOSS",
      message: "Unexplained weight loss requires investigation",
      detail: "May indicate malignancy. Refer to GP for assessment.",
    });
  }

  if (state.redFlags.bonePain) {
    alerts.push({
      severity: "stop",
      code: "BPH_BONE_PAIN",
      message: "Bone pain requires investigation",
      detail: "May indicate metastatic disease. Refer to GP urgently.",
    });
  }

  // Caution: Orthostasis history
  if (state.medicalHistory.orthostasisHistory) {
    alerts.push({
      severity: "caution",
      code: "BPH_ORTHOSTASIS",
      message: "History of orthostatic hypotension",
      detail: "Tamsulosin can cause first-dose hypotension and syncope. Monitor BP.",
    });
  }

  // Caution: PDE5 inhibitor combination
  if (state.contraindications.takingPde5Inhibitor) {
    alerts.push({
      severity: "caution",
      code: "BPH_PDE5",
      message: "PDE5 inhibitor concomitant use requires caution",
      detail: "Additive hypotensive effect possible. Counsel patient on BP symptoms.",
    });
  }

  // Caution: Cataract surgery planned
  if (state.medicalHistory.plannedCataractSurgery) {
    alerts.push({
      severity: "red-flag",
      code: "BPH_CATARACT",
      message: "Patient planning cataract surgery — inform ophthalmologist",
      detail: "Tamsulosin can cause Intraoperative Floppy Iris Syndrome (IFIS). Patient must inform surgeon.",
    });
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: BPHConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

// ─── Calculate dose recommendation ───

export function calculateDoseRecommendation(
  state: BPHConsultationState
): DoseRecommendation | null {
  if (!state.patient.maleConfirmed) return null;
  if (hasHardStops(state)) return null;

  return {
    medicine: "Tamsulosin",
    dose: "400 micrograms",
    frequency: "Once daily",
    dosingRegimen: "400mcg MR OD (modified-release, after food)",
    reason: "Lower urinary tract symptoms due to benign prostatic hyperplasia.",
  };
}
