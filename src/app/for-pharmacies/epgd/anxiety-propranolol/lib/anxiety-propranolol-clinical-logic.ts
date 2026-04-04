import type { AnxietyPropranololConsultationState } from "./anxiety-propranolol-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: AnxietyPropranololConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops
  if (state.contraindications.asthmaWithBronchospasm) {
    alerts.push({
      severity: "stop",
      code: "ANX_ASTHMA",
      message: "Asthma/COPD with bronchospasm — propranolol contraindicated",
      detail: "Beta-blockers can precipitate bronchoconstriction. Patient should be referred to GP for alternative.",
    });
  }

  if (state.contraindications.heartBlock) {
    alerts.push({
      severity: "stop",
      code: "ANX_BLOCK",
      message: "2nd or 3rd degree heart block — propranolol contraindicated",
      detail: "Beta-blockers worsen conduction delay. Refer to cardiology.",
    });
  }

  if (state.contraindications.severeBradycardia) {
    alerts.push({
      severity: "stop",
      code: "ANX_BRADY",
      message: "Bradycardia (HR &lt;50 bpm) — propranolol contraindicated",
      detail: "Further heart rate reduction may be dangerous. Refer to GP.",
    });
  }

  if (state.contraindications.uncontrolledHeartFailure) {
    alerts.push({
      severity: "stop",
      code: "ANX_HF",
      message: "Uncontrolled heart failure — propranolol contraindicated",
      detail: "May decompensate heart failure. Specialist assessment needed.",
    });
  }

  if (state.contraindications.prinzmetalsAngina) {
    alerts.push({
      severity: "stop",
      code: "ANX_PRINZ",
      message: "Prinzmetal's angina — propranolol contraindicated",
      detail: "Non-selective beta-blocker can worsen coronary vasospasm. Refer to cardiology.",
    });
  }

  if (state.contraindications.pheochromocytoma) {
    alerts.push({
      severity: "stop",
      code: "ANX_PHEO",
      message: "Pheochromocytoma (unless alpha-blocked) — propranolol contraindicated",
      detail: "Risk of hypertensive crisis. Refer to endocrinology.",
    });
  }

  if (state.contraindications.childUnder12) {
    alerts.push({
      severity: "stop",
      code: "ANX_AGE",
      message: "Patient under 12 years old",
      detail: "Propranolol via PGD is for adults and older children. Refer to GP.",
    });
  }

  // Red flags
  if (state.assessment.anxietyType === "generalized") {
    alerts.push({
      severity: "red-flag",
      code: "ANX_GAD",
      message: "Generalised anxiety disorder — refer to GP",
      detail: "This PGD is for situational anxiety only. GAD requires psychological therapy &plusmn; SSRIs. Refer to primary care.",
    });
  }

  // Cautions
  if (state.medicalHistory.diabetes) {
    alerts.push({
      severity: "caution",
      code: "ANX_DM",
      message: "Diabetes — propranolol may mask hypoglycaemia symptoms",
      detail: "Beta-blockers can hide tremor &amp; palpitations of low blood sugar. Patient must be aware.",
    });
  }

  if (state.medicalHistory.raynauds) {
    alerts.push({
      severity: "caution",
      code: "ANX_RAYNAUD",
      message: "Raynaud's syndrome — may worsen peripheral vasospasm",
      detail: "Monitor for worsening symptoms.",
    });
  }

  if (state.medicalHistory.hepaticImpairment) {
    alerts.push({
      severity: "caution",
      code: "ANX_LIVER",
      message: "Hepatic impairment — propranolol metabolism reduced",
      detail: "Consider dose reduction. Monitor patient closely.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: AnxietyPropranololConsultationState): DoseRecommendation | null {
  return {
    medicine: "Propranolol tablet",
    dose: "10–40mg",
    frequency: "PRN (as needed)",
    duration: "Single dose before anxiety-provoking situation",
    dosingRegimen: "Take 10–40mg tablet 30–60 minutes before anticipated anxiety-provoking situation (exam, presentation, public speaking). Not for daily use.",
    reason: "Beta-blocker reduces physical anxiety symptoms (tremor, palpitations, sweating) in situational anxiety",
  };
}
