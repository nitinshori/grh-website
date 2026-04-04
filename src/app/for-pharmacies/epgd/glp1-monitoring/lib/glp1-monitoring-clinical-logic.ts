import type { GLP1ConsultationState } from "./glp1-monitoring-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: GLP1ConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.assessment.severeVomiting) {
    alerts.push({
      severity: "red-flag",
      code: "GLP1_SEVERE_VOMITING",
      message: "Severe persistent vomiting",
      detail: "Consider dose reduction or cessation; assess for acute pancreatitis",
    });
  }

  if (state.assessment.pancreatitisSymptoms) {
    alerts.push({
      severity: "stop",
      code: "GLP1_PANCREATITIS",
      message: "Acute pancreatitis symptoms (severe abdominal pain)",
      detail: "Discontinue immediately; refer for emergency assessment",
    });
  }

  if (state.assessment.gallbladderSymptoms) {
    alerts.push({
      severity: "caution",
      code: "GLP1_GALLBLADDER",
      message: "Possible gallbladder disease (RUQ pain)",
      detail: "GLP-1s may increase gallstone risk; refer for ultrasound if not done",
    });
  }

  if (state.assessment.weightChangePercent !== null && state.assessment.weightChangePercent < 5) {
    alerts.push({
      severity: "caution",
      code: "GLP1_MINIMAL_LOSS",
      message: "Weight loss &lt;5% at 12+ weeks",
      detail: "If at target maintenance dose and &gt;3 months, consider dose escalation or alternative",
    });
  }

  return alerts;
}

export function hasHardStops(state: GLP1ConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}
