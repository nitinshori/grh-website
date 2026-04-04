// ─── Asthma Rescue (Salbutamol) Clinical Logic ───

import type { AsthmaConsultationState, AsthmaRedFlags } from "./asthma-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// ─── Alert generation ───

export function getAllAlerts(state: AsthmaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops (STOP severity)
  if (state.redFlags.noExistingDiagnosis) {
    alerts.push({
      severity: "stop",
      code: "NO_ASTHMA_DX",
      message: "No existing asthma diagnosis recorded",
      detail:
        "Patient must have an existing asthma diagnosis. Refer to GP for evaluation.",
    });
  }

  if (state.redFlags.neverUsedSalbutamolBefore) {
    alerts.push({
      severity: "stop",
      code: "NEVER_USED_SABA",
      message: "Patient has never used salbutamol before",
      detail:
        "Patient must normally use SABA for asthma. Refer to GP for initial diagnosis and treatment.",
    });
  }

  if (state.redFlags.increasingUse) {
    alerts.push({
      severity: "red-flag",
      code: "INCREASING_USE",
      message: "Increasing salbutamol use reported",
      detail: "Refer for GP asthma review. May indicate poor control or need for preventer therapy.",
    });
  }

  if (state.redFlags.nocturnalWakenings) {
    alerts.push({
      severity: "red-flag",
      code: "NOCTURNAL_SYMPTOMS",
      message: "Night-time symptoms present",
      detail: "Refer for GP asthma review. May indicate need for additional therapy.",
    });
  }

  if (state.redFlags.activityLimitation) {
    alerts.push({
      severity: "red-flag",
      code: "ACTIVITY_LIMITATION",
      message: "Activity limitation due to symptoms",
      detail: "Refer for GP asthma review. May indicate inadequate control.",
    });
  }

  // Frequent use caution
  if (state.assessment.frequentUse) {
    alerts.push({
      severity: "caution",
      code: "FREQUENT_USE",
      message: "Frequent salbutamol use (&gt;3 days/week)",
      detail: "Patient may benefit from preventer therapy. Advise GP review.",
    });
  }

  return alerts;
}

// ─── Check for hard stops ───

export function hasHardStops(state: AsthmaConsultationState): boolean {
  return (
    state.redFlags.noExistingDiagnosis ||
    state.redFlags.neverUsedSalbutamolBefore
  );
}

// ─── Dose recommendation ───

export function calculateDoseRecommendation(
  state: AsthmaConsultationState
): DoseRecommendation | null {
  if (!state.medicineSupply.salbutamol100mcgPMDI) return null;

  return {
    medicine: "Salbutamol (Albuterol) 100mcg pressurised metered-dose inhaler",
    dose: "2 puffs (200mcg per dose)",
    frequency: "As needed, maximum 8 puffs in 24 hours",
    duration: "2-week emergency supply",
    reason:
      "Emergency/interim supply for known asthmatic with existing diagnosis",
  };
}
