// ─── Meningitis B Clinical Logic ───

import type { MeningitiBConsultationState } from "./meningitis-b-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: MeningitiBConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Anaphylaxis contraindication
  if (state.medicalHistory.anaphylaxisHistory) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_HISTORY",
      message: "History of anaphylaxis to previous dose or component",
      detail: "Bexsero vaccine is contraindicated.",
    });
  }

  // Severe febrile illness
  if (state.medicalHistory.severeFebrilIllness) {
    alerts.push({
      severity: "caution",
      code: "FEBRILE_ILLNESS",
      message: "Severe acute febrile illness",
      detail: "Vaccination should be deferred until recovery from acute illness.",
    });
  }

  // Recent other vaccination (may affect spacing)
  if (state.medicalHistory.recentVaccination) {
    alerts.push({
      severity: "caution",
      code: "RECENT_VACCINATION",
      message: "Recent other vaccination",
      detail: "Bexsero can be given concurrently or at any interval with other vaccines.",
    });
  }

  // No risk factors identified
  if (
    !state.riskAssessment.closeContactOfCase &&
    !state.riskAssessment.complementDeficiency &&
    !state.riskAssessment.asplenia &&
    !state.riskAssessment.universityFresher &&
    !state.riskAssessment.hyperendemicArea
  ) {
    alerts.push({
      severity: "red-flag",
      code: "NO_RISK_FACTORS",
      message: "No meningitis B risk factors identified",
      detail: "Bexsero is typically given to high-risk groups. Reconsider indication.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}
