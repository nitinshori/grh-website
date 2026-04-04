import type { AlcoholReductionConsultationState } from "./alcohol-reduction-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: AlcoholReductionConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Hard stops
  if (state.contraindications.opioidUse || state.contraindications.opioidDependence) {
    alerts.push({
      severity: "stop",
      code: "ALCO_OPIOID",
      message: "Patient on opioids or opioid dependent — nalmefene contraindicated",
      detail: "Nalmefene precipitates withdrawal in opioid users. Patient must cease opioids before treatment.",
    });
  }

  if (state.contraindications.severeHepaticImpairment) {
    alerts.push({
      severity: "stop",
      code: "ALCO_LIVER",
      message: "Severe hepatic impairment (Child-Pugh C) — refer to specialist",
      detail: "Nalmefene not suitable. Requires specialist assessment.",
    });
  }

  if (state.contraindications.severeRenalImpairment) {
    alerts.push({
      severity: "stop",
      code: "ALCO_KIDNEY",
      message: "Severe renal impairment — refer to specialist",
      detail: "Nalmefene clearance significantly impaired. Specialist assessment needed.",
    });
  }

  if (state.contraindications.activeWithdrawal) {
    alerts.push({
      severity: "stop",
      code: "ALCO_WITHDRAWAL",
      message: "Active alcohol withdrawal — refer for medical support",
      detail: "Nalmefene is for reduction in non-dependent or mildly dependent patients without withdrawal. Specialist detoxification required.",
    });
  }

  if (state.contraindications.childUnder18) {
    alerts.push({
      severity: "stop",
      code: "ALCO_AGE",
      message: "Patient under 18 years old",
      detail: "Nalmefene is not licensed for use in patients under 18 years.",
    });
  }

  // Caution
  if (state.medicalHistory.hepaticImpairment) {
    alerts.push({
      severity: "caution",
      code: "ALCO_MILD_LIVER",
      message: "Mild–moderate hepatic impairment — monitor closely",
      detail: "Dose adjustment may be required. Ensure adequate monitoring.",
    });
  }

  if (state.medicalHistory.renalImpairment) {
    alerts.push({
      severity: "caution",
      code: "ALCO_MILD_KIDNEY",
      message: "Mild–moderate renal impairment — monitor closely",
      detail: "Ensure adequate hydration. Consider reduced dosing if necessary.",
    });
  }

  if (state.medicalHistory.psychiatricComorbidity) {
    alerts.push({
      severity: "caution",
      code: "ALCO_PSYCH",
      message: "Psychiatric comorbidity — ensure specialist involvement",
      detail: "Mental health support alongside medication is important.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: AlcoholReductionConsultationState): DoseRecommendation | null {
  return {
    medicine: "Nalmefene 18mg",
    dose: "18mg",
    frequency: "PRN (as needed)",
    duration: "Ongoing PRN",
    dosingRegimen: "Take 1–2 hours before anticipated drinking occasion. Maximum 1 tablet per day. Not for daily use.",
    reason: "Opioid receptor antagonist to reduce craving and reward from alcohol",
  };
}
