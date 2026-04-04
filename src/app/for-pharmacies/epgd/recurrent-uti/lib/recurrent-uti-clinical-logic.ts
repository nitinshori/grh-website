// ─── Recurrent UTI Clinical Logic ───

import type { RecurrentUTIConsultationState } from "./recurrent-uti-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: RecurrentUTIConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Female only requirement
  if (state.patient.age !== null && state.patient.age < 16) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_YOUNG",
      message: "Patient under 16 years old",
      detail: "This PGD is for females aged 16-65.",
    });
  }

  if (state.patient.age !== null && state.patient.age > 65) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_OLD",
      message: "Patient over 65 years old",
      detail: "This PGD is for females aged 16-65.",
    });
  }

  // Pregnancy contraindication
  if (state.medicalHistory.pregnancy) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: "Patient is pregnant",
      detail: "Nitrofurantoin and trimethoprim are contraindicated in pregnancy.",
    });
  }

  // Breastfeeding with nitrofurantoin
  if (state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "BREASTFEEDING",
      message: "Patient is breastfeeding",
      detail: "Nitrofurantoin can be used with caution. Trimethoprim preferred if possible.",
    });
  }

  // Renal impairment (eGFR &lt; 45)
  if (state.medicalHistory.renalImpairment && state.medicines.medicine === "Nitrofurantoin") {
    alerts.push({
      severity: "stop",
      code: "RENAL_IMPAIRMENT",
      message: "Renal impairment with eGFR &lt; 45",
      detail: "Nitrofurantoin is contraindicated. Use trimethoprim if eGFR allows.",
    });
  }

  // G6PD deficiency with nitrofurantoin
  if (state.medicalHistory.g6pdDeficiency && state.medicines.medicine === "Nitrofurantoin") {
    alerts.push({
      severity: "stop",
      code: "G6PD_DEFICIENCY",
      message: "G6PD deficiency",
      detail: "Nitrofurantoin is contraindicated. Use trimethoprim instead.",
    });
  }

  // Hepatic disease
  if (state.medicalHistory.hepaticDisease) {
    alerts.push({
      severity: "caution",
      code: "HEPATIC_DISEASE",
      message: "Hepatic disease",
      detail: "Assess risk/benefit with hepatologist advice if severe.",
    });
  }

  // UTI criteria not met
  if (state.utiHistory.utiInPast12Months < 3 && state.utiHistory.utiInPast6Months < 2) {
    alerts.push({
      severity: "red-flag",
      code: "UTI_CRITERIA_NOT_MET",
      message: "UTI criteria not met",
      detail: "Requires 3+ UTIs in past 12 months OR 2+ in past 6 months. Confirm with patient/records.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}
