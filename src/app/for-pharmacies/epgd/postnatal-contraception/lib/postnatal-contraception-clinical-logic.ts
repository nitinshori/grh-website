// ─── Postnatal Contraception Clinical Logic ───

import type { PostnatalContraceptionState } from "./postnatal-contraception-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: PostnatalContraceptionState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Current breast cancer contraindication
  if (state.medicalHistory.currentBreastCancer) {
    alerts.push({
      severity: "stop",
      code: "CURRENT_BREAST_CANCER",
      message: "Current breast cancer",
      detail: "POP is contraindicated in current breast cancer. Refer to specialist.",
    });
  }

  // Severe hepatic disease
  if (state.medicalHistory.severeLiverDisease) {
    alerts.push({
      severity: "stop",
      code: "SEVERE_HEPATIC_DISEASE",
      message: "Severe active hepatic disease",
      detail: "POP is contraindicated in severe hepatic disease.",
    });
  }

  // Unexplained vaginal bleeding
  if (state.medicalHistory.unexplainedVaginalBleeding) {
    alerts.push({
      severity: "stop",
      code: "UNEXPLAINED_BLEEDING",
      message: "Unexplained vaginal bleeding",
      detail: "Assess before starting POP; may indicate pathology requiring investigation.",
    });
  }

  // Porphyria
  if (state.medicalHistory.porphyria) {
    alerts.push({
      severity: "stop",
      code: "PORPHYRIA",
      message: "Porphyria",
      detail: "POP is contraindicated in porphyria.",
    });
  }

  // Past breast cancer (caution if &lt; 5 years)
  if (state.medicalHistory.pastBreastCancer) {
    alerts.push({
      severity: "caution",
      code: "PAST_BREAST_CANCER",
      message: "History of breast cancer",
      detail: "Assess if 5 years or more clear. Specialist advice recommended if &lt; 5 years.",
    });
  }

  // Liver tumours
  if (state.medicalHistory.liverTumours) {
    alerts.push({
      severity: "caution",
      code: "LIVER_TUMOURS",
      message: "Benign or malignant liver tumours",
      detail: "Caution; assess benefit/risk. Specialist advice may be needed.",
    });
  }

  // SLE with antiphospholipid antibodies
  if (state.medicalHistory.sleWithAntiphospholipidAntibodies) {
    alerts.push({
      severity: "caution",
      code: "SLE_ANTIPHOSPHOLIPID",
      message: "SLE with antiphospholipid antibodies",
      detail: "Caution due to thrombotic risk. Specialist evaluation recommended.",
    });
  }

  // Check timing: Can start any time postpartum
  if (state.assessment.weeksPostpartum > 0 && state.assessment.weeksPostpartum > 52) {
    alerts.push({
      severity: "red-flag",
      code: "NOT_POSTNATAL",
      message: "More than 1 year postpartum",
      detail: "This PGD is for postnatal women. Standard contraception PGD may be more appropriate.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}
