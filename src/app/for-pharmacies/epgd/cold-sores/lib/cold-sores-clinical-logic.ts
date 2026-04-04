import type { ColdSoresConsultationState } from "./cold-sores-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: ColdSoresConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops
  if (state.contraindications.childUnder12) {
    alerts.push({
      severity: "stop",
      code: "CS_AGE",
      message: "Patient under 12 years old",
      detail: "Oral aciclovir via PGD is for patients aged 12+. Refer to GP for paediatric dosing.",
    });
  }

  if (state.contraindications.renalImpairmentSevere) {
    alerts.push({
      severity: "stop",
      code: "CS_RENAL_SEVERE",
      message: "Severe renal impairment — refer to GP",
      detail: "Aciclovir requires significant dose adjustment. Specialist assessment needed.",
    });
  }

  // Red flags
  if (state.symptomAssessment.isFirstEpisode) {
    alerts.push({
      severity: "red-flag",
      code: "CS_FIRST_EPISODE",
      message: "First episode of herpes labialis — consider GP referral for diagnosis",
      detail: "First presentations should be confirmed by primary care. PGD is for recurrent herpes labialis.",
    });
  }

  // Caution
  if (state.contraindications.immunosuppressed) {
    alerts.push({
      severity: "caution",
      code: "CS_IMMUNOSUPPRESSED",
      message: "Patient immunosuppressed — may need higher dose",
      detail: "Standard dosing may be insufficient. Consider GP/specialist referral for optimised regimen.",
    });
  }

  if (state.contraindications.pregnant) {
    alerts.push({
      severity: "caution",
      code: "CS_PREGNANCY",
      message: "Pregnancy — benefit vs risk discussion required",
      detail: "Aciclovir can be used in pregnancy if benefits outweigh risks. Ensure informed consent documented.",
    });
  }

  if (state.medicalHistory.renalImpairment && !state.contraindications.renalImpairmentSevere) {
    alerts.push({
      severity: "caution",
      code: "CS_RENAL_MILD_MOD",
      message: "Mild–moderate renal impairment — dose adjustment recommended",
      detail: "Consider reduced frequency or dose. Ensure adequate hydration advised.",
    });
  }

  // Red flag for late presentation
  if (state.symptomAssessment.hoursFromProdrome !== null && state.symptomAssessment.hoursFromProdrome > 48) {
    alerts.push({
      severity: "red-flag",
      code: "CS_LATE_START",
      message: "&gt;48 hours since prodrome — reduced efficacy",
      detail: "Aciclovir is most effective if started within 24–48 hours of prodrome onset. Effectiveness diminishes beyond this window.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: ColdSoresConsultationState): DoseRecommendation | null {
  if (!state.medicineSupply.doseChoice) return null;

  const dose = state.medicineSupply.doseChoice;

  return {
    medicine: `Oral Aciclovir ${dose}mg`,
    dose: dose,
    frequency: "5 times daily (6-hourly)",
    duration: "5 days",
    dosingRegimen: `Take ${dose}mg tablet 5 times daily for 5 days. Space doses at least 4 hours apart (6-hour intervals ideal).`,
    reason: "Standard treatment for recurrent herpes labialis (cold sores)",
  };
}
