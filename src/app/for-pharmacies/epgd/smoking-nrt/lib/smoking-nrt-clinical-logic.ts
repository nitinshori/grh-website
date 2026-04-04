import type { SmokingNRTConsultationState } from "./smoking-nrt-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: SmokingNRTConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops
  if (state.contraindications.childUnder12) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_AGE",
      message: "Patient under 12 years old",
      detail: "NRT via PGD is for patients aged 12+. Refer to GP for specialist paediatric advice.",
    });
  }

  if (state.contraindications.recentCardiacEvent) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_CARDIAC",
      message: "Recent MI/stroke/unstable angina (within 2 weeks)",
      detail: "Patches contraindicated. Patient needs urgent cardiology/GP assessment.",
    });
  }

  if (state.contraindications.pheochromocytoma) {
    alerts.push({
      severity: "stop",
      code: "SMOKING_PHEO",
      message: "Pheochromocytoma — NRT contraindicated",
      detail: "Nicotine can precipitate hypertensive crisis. Refer to specialist.",
    });
  }

  // Cautions
  if (state.medicalHistory.cardiovascularDisease) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_CVD",
      message: "Cardiovascular disease — monitor closely",
      detail: "NRT may be used but requires careful assessment. Discuss risk-benefit with patient.",
    });
  }

  if (state.medicalHistory.diabetes) {
    alerts.push({
      severity: "caution",
      code: "SMOKING_DM",
      message: "Diabetes — monitor glucose levels",
      detail: "Smoking cessation may improve insulin sensitivity. Monitor glucose and adjust medications if needed.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: SmokingNRTConsultationState): DoseRecommendation | null {
  if (!state.nrtSelection.usePatches && !state.nrtSelection.useOralForm) return null;

  const components: string[] = [];
  if (state.nrtSelection.usePatches) {
    components.push(`Nicotine patches ${state.nrtSelection.patchStrength || "—"} (16-hour or 24-hour)`);
  }
  if (state.nrtSelection.useOralForm) {
    components.push(`${state.nrtSelection.oralFormType || "Oral form"}`);
  }

  return {
    medicine: components.join(" + "),
    dose: "As per product",
    frequency: "See product guidance",
    duration: "8–12 weeks total course",
    dosingRegimen: state.nrtSelection.combinationTherapy
      ? "Combination therapy recommended (patch + oral form): more effective than single form."
      : "Single form: consider combination for better efficacy.",
    reason: "Nicotine replacement for smoking cessation",
  };
}
