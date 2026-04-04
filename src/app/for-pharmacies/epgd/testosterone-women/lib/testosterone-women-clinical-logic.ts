import type { ClinicalAlert } from "../../shared/types";
import type { TestosteroneWomenAssessment, TestosteroneWomenContraindications } from "./testosterone-women-types";

export function getAssessmentAlerts(assessment: TestosteroneWomenAssessment): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (assessment.onHRTDuration !== null && assessment.onHRTDuration < 3) {
    alerts.push({
      severity: "stop",
      code: "HRT_DURATION_INSUFFICIENT",
      message: "Patient must be on HRT (oestrogen) for at least 3 months",
      detail: "Testosterone should only be supplied after minimum 3 months of HRT.",
    });
  }

  if (!assessment.libioDysfunction) {
    alerts.push({
      severity: "red-flag",
      code: "NO_LIBIDO_DYSFUNCTION",
      message: "No documented libido dysfunction",
      detail: "Testosterone is only indicated for menopausal libido dysfunction.",
    });
  }

  return alerts;
}

export function getContraindicationAlerts(contraindications: TestosteroneWomenContraindications): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (contraindications.breastCancer) {
    alerts.push({
      severity: "stop",
      code: "BREAST_CANCER_CI",
      message: "STOP: Breast cancer is a contraindication",
      detail: "Do not supply testosterone to patients with history of breast cancer.",
    });
  }

  if (contraindications.endometrialCancer) {
    alerts.push({
      severity: "stop",
      code: "ENDOMETRIAL_CANCER_CI",
      message: "STOP: Endometrial cancer is a contraindication",
      detail: "Do not supply testosterone to patients with history of endometrial cancer.",
    });
  }

  if (contraindications.activeLiverDisease) {
    alerts.push({
      severity: "stop",
      code: "ACTIVE_LIVER_DISEASE_CI",
      message: "STOP: Active liver disease is a contraindication",
      detail: "Do not supply testosterone if hepatic impairment is present.",
    });
  }

  if (contraindications.pregnancy) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY_CI",
      message: "STOP: Pregnancy is a contraindication",
      detail: "Testosterone is contraindicated in pregnancy.",
    });
  }

  return alerts;
}

export function getAllAlerts(assessment: TestosteroneWomenAssessment, contraindications: TestosteroneWomenContraindications): ClinicalAlert[] {
  return [...getAssessmentAlerts(assessment), ...getContraindicationAlerts(contraindications)];
}

export function hasHardStops(contraindications: TestosteroneWomenContraindications): boolean {
  return contraindications.breastCancer || contraindications.endometrialCancer || contraindications.activeLiverDisease || contraindications.pregnancy;
}
