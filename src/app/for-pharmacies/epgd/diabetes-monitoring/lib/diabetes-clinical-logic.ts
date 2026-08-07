// ─── Diabetes Clinical Logic ───

import type { DiabetesConsultationState } from "./diabetes-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: DiabetesConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Only assert this once the pharmacist has worked past the assessment
  // step where the box is ticked. Before then the consultation has not
  // reached the question, and firing a hard stop on step 0 blocked the
  // tool outright (pattern reported by Rachel on Wegovy tablets, Aug 2026).
  if (state.currentStep > 2 && !state.assessment.hasExistingT2DM) {
    alerts.push({
      severity: "stop",
      code: "NO_T2DM",
      message: "No existing Type 2 diabetes diagnosis",
      detail: "Continuation supply only. Patient requires GP diagnosis and initiation.",
    });
  }

  if (state.redFlags.egfrBelow30) {
    alerts.push({
      severity: "stop",
      code: "EGFR_LOW",
      message: "eGFR &lt;30 mL/min/1.73m²",
      detail: "Metformin is contraindicated. STOP and refer to GP.",
    });
  }

  if (state.medicalHistory.dka || state.medicalHistory.otherConditions) {
    alerts.push({
      severity: "stop",
      code: "DKA",
      message: "DKA or acute conditions present",
      detail: "Metformin contraindicated. Refer to GP urgently.",
    });
  }

  if (state.redFlags.hbA1cPoorControl) {
    alerts.push({
      severity: "red-flag",
      code: "POOR_CONTROL",
      message: "HbA1c &gt;75 mmol/mol (poor control)",
      detail: "Patient requires GP review for therapy optimization.",
    });
  }

  if (state.redFlags.lacticAcidosisSymptoms) {
    alerts.push({
      severity: "red-flag",
      code: "LACTIC_ACIDOSIS",
      message: "Symptoms of lactic acidosis",
      detail: "Nausea, abdominal pain, hyperventilation. STOP metformin and refer urgently.",
    });
  }

  if (state.assessment.lastEgfrValue && state.assessment.lastEgfrValue >= 30 && state.assessment.lastEgfrValue < 45) {
    alerts.push({
      severity: "caution",
      code: "EGFR_CAUTION",
      message: "eGFR 30-45 (dose adjustment needed)",
      detail: "Max dose 1g daily. Monitor eGFR every 6 months.",
    });
  }

  if (state.assessment.lastEgfrValue && state.assessment.lastEgfrValue >= 45 && state.assessment.lastEgfrValue < 60) {
    alerts.push({
      severity: "caution",
      code: "EGFR_REVIEW",
      message: "eGFR 45-60 (review dose)",
      detail: "Consider dose reduction. Monitor eGFR annually.",
    });
  }

  return alerts;
}

export function hasHardStops(state: DiabetesConsultationState): boolean {
  return (
    !state.assessment.hasExistingT2DM ||
    state.redFlags.egfrBelow30 ||
    state.medicalHistory.dka ||
    !!state.medicalHistory.otherConditions
  );
}

export function calculateDoseRecommendation(
  state: DiabetesConsultationState
): DoseRecommendation | null {
  if (!state.medicineSupply.doseSelected) return null;

  const format = state.medicineSupply.metforminFormatSelected === "mr" ? "Modified-Release" : "Standard";

  return {
    medicine: `Metformin ${format} ${state.medicineSupply.doseSelected}mg`,
    dose: `${state.medicineSupply.doseSelected}mg daily`,
    frequency: "Taken with or after food (standard) or as directed (MR)",
    duration: "28-day supply (continuation)",
    reason: "Continuation of existing Type 2 diabetes management",
  };
}
