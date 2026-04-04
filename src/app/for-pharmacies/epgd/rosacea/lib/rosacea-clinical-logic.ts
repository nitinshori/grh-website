import type { ClinicalAlert } from "../../shared/types";
import type { RosaceaAssessment, RosaceaContraindications } from "./rosacea-types";

export function getSubtypeAlerts(assessment: RosaceaAssessment): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  if (assessment.subtype === "phymatous") {
    alerts.push({ severity: "red-flag", code: "PHYMATOUS_REFER", message: "Phymatous rosacea — refer to GP/dermatology", detail: "Phymatous subtype requires specialist assessment." });
  }
  return alerts;
}

export function getContraindicationAlerts(contraindications: RosaceaContraindications): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  if (contraindications.pregnancy) {
    alerts.push({ severity: "stop", code: "PREGNANCY_CI", message: "STOP: Pregnancy is contraindication to ivermectin", detail: "Use non-pharmacological measures or metronidazole (safer in pregnancy)." });
  }
  if (contraindications.underEighteen) {
    alerts.push({ severity: "stop", code: "UNDER_18_CI", message: "STOP: Age &lt; 18 — refer to specialist", detail: "Rosacea treatment should be under specialist supervision in children." });
  }
  return alerts;
}

export function getAllAlerts(assessment: RosaceaAssessment, contraindications: RosaceaContraindications): ClinicalAlert[] {
  return [...getSubtypeAlerts(assessment), ...getContraindicationAlerts(contraindications)];
}

export function hasHardStops(contraindications: RosaceaContraindications): boolean {
  return contraindications.pregnancy || contraindications.underEighteen;
}
