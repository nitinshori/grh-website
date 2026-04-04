import type { ClinicalAlert } from "../../shared/types";
import type { SleepMelatoninAssessment, SleepMelatoninContraindications } from "./sleep-melatonin-types";

export function getAssessmentAlerts(assessment: SleepMelatoninAssessment): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  if (!assessment.sleepHygieneAttempted) {
    alerts.push({
      severity: "caution",
      code: "SLEEP_HYGIENE_FIRST",
      message: "Sleep hygiene measures should be first-line",
      detail: "Behavioural interventions are recommended before pharmacological treatment.",
    });
  }
  return alerts;
}

export function getContraindicationAlerts(contraindications: SleepMelatoninContraindications): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  if (contraindications.autoimmuneDiseaseActive) {
    alerts.push({ severity: "stop", code: "AUTOIMMUNE_CI", message: "STOP: Active autoimmune disease is contraindication", detail: "Melatonin is contraindicated in active autoimmune disease." });
  }
  if (contraindications.hepaticImpairment) {
    alerts.push({ severity: "stop", code: "HEPATIC_CI", message: "STOP: Hepatic impairment is contraindication", detail: "Melatonin is contraindicated in significant liver disease." });
  }
  if (contraindications.pregnancy) {
    alerts.push({ severity: "stop", code: "PREGNANCY_CI", message: "STOP: Pregnancy is contraindication", detail: "Melatonin is contraindicated in pregnancy." });
  }
  if (contraindications.breastfeeding) {
    alerts.push({ severity: "stop", code: "BREASTFEEDING_CI", message: "STOP: Breastfeeding is contraindication", detail: "Melatonin is contraindicated during breastfeeding." });
  }
  return alerts;
}

export function getAllAlerts(assessment: SleepMelatoninAssessment, contraindications: SleepMelatoninContraindications): ClinicalAlert[] {
  return [...getAssessmentAlerts(assessment), ...getContraindicationAlerts(contraindications)];
}

export function hasHardStops(contraindications: SleepMelatoninContraindications): boolean {
  return contraindications.autoimmuneDiseaseActive || contraindications.hepaticImpairment || contraindications.pregnancy || contraindications.breastfeeding;
}
