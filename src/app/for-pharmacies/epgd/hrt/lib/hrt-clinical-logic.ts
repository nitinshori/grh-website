import type { HRTConsultationState } from "./hrt-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: HRTConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.medicalHistory.undiagnosedVaginalBleeding) {
    alerts.push({
      severity: "stop",
      code: "UNDIAG_BLEEDING",
      message: "Undiagnosed vaginal bleeding",
      detail: "Absolute contraindication. Refer for investigation before HRT.",
    });
  }

  if (state.medicalHistory.currentBreastCancer) {
    alerts.push({
      severity: "stop",
      code: "CURRENT_BC",
      message: "Current breast cancer",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.recentBreastCancer) {
    alerts.push({
      severity: "stop",
      code: "RECENT_BC",
      message: "Recent breast cancer history (within 5 years)",
      detail: "Relative contraindication. Specialist assessment required.",
    });
  }

  if (state.medicalHistory.activeLiverDisease) {
    alerts.push({
      severity: "stop",
      code: "LIVER_DISEASE",
      message: "Active liver disease",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.activeVTE) {
    alerts.push({
      severity: "stop",
      code: "ACTIVE_VTE",
      message: "Active VTE/DVT/PE",
      detail: "Absolute contraindication. Do not supply.",
    });
  }

  if (state.medicalHistory.untreatEndometrialHyperplasia) {
    alerts.push({
      severity: "stop",
      code: "ENDOMETRIAL",
      message: "Untreated endometrial hyperplasia",
      detail: "Absolute contraindication. Refer for specialist assessment.",
    });
  }

  if (state.medicalHistory.familyHistBreastCancer) {
    alerts.push({
      severity: "caution",
      code: "FAMILY_BC",
      message: "Family history of breast cancer",
      detail: "Increased risk. Consider specialist assessment; annual breast screening.",
    });
  }

  if (state.medicalHistory.bmiOver30) {
    alerts.push({
      severity: "caution",
      code: "BMI_30",
      message: "BMI >30",
      detail: "Increased VTE risk. Prefer transdermal route; annual review.",
    });
  }

  if (state.medicalHistory.migraineWithAura) {
    alerts.push({
      severity: "caution",
      code: "MIGRAINE_AURA",
      message: "Migraine with aura",
      detail: "Avoid oral oestrogens; use transdermal route. Monitor closely.",
    });
  }

  if (state.medicalHistory.historyVTE) {
    alerts.push({
      severity: "caution",
      code: "VTE_HISTORY",
      message: "History of VTE/DVT/PE",
      detail: "Prefer transdermal route. Specialist assessment recommended.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: HRTConsultationState): DoseRecommendation | null {
  const hrtType = state.hrtSelection.hrtType;
  const route = state.hrtSelection.oestroaddressRoute;

  let recommendation = "";
  if (hrtType === "seq-combined") {
    recommendation = "Sequential combined HRT (peri/early postmenopause)";
  } else if (hrtType === "cont-combined") {
    recommendation = "Continuous combined HRT (12+ months postmenopause)";
  } else if (hrtType === "oestrogen-only") {
    recommendation = "Oestrogen-only HRT (post-hysterectomy)";
  } else if (hrtType === "local-vag") {
    recommendation = "Local vaginal oestrogen (symptomatic urogenital atrophy)";
  }

  return {
    medicine: "Hormone Replacement Therapy (HRT)",
    dose: state.hrtSelection.doseRec || "Standard dose",
    frequency: "Continuous",
    dosingRegimen: `Route: ${route}. Type: ${recommendation}`,
    reason: "Menopausal symptom relief",
  };
}
