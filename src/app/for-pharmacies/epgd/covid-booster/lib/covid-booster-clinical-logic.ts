import type { CovidBoosterConsultationState } from "./covid-booster-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: CovidBoosterConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Anaphylaxis to previous COVID vaccine
  if (state.assessment.anaphylaxisToPreviousDose) {
    alerts.push({
      severity: "stop",
      code: "COVID_ANAPHYLAXIS_PREV",
      message: "Anaphylaxis to previous COVID-19 vaccine",
      detail: "Contraindicated. Do not administer booster.",
    });
  }

  // Anaphylaxis to PEG/polysorbate
  if (state.assessment.anaphylaxisToPEG || state.assessment.anaphylaxisToPolysorbate) {
    alerts.push({
      severity: "stop",
      code: "COVID_ANAPHYLAXIS_COMPONENT",
      message: "Anaphylaxis to vaccine component (PEG/polysorbate)",
      detail: "Contraindicated. Do not administer booster.",
    });
  }

  // Severe febrile illness
  if (state.assessment.severeFebrilIllness) {
    alerts.push({
      severity: "stop",
      code: "COVID_FEBRILE",
      message: "Severe febrile illness present",
      detail: "Defer vaccination until patient has recovered and is afebrile.",
    });
  }

  // Caution: Anticoagulants
  if (state.assessment.onAnticoagulants) {
    alerts.push({
      severity: "caution",
      code: "COVID_ANTICOAGULANT",
      message: "Patient on anticoagulant therapy",
      detail:
        "Increased bleeding risk at injection site. Apply firm pressure for 2-3 minutes post-injection. Counsel on bruising risk.",
    });
  }

  // Caution: Myocarditis history
  if (state.assessment.myocarditisHistory) {
    alerts.push({
      severity: "caution",
      code: "COVID_MYOCARDITIS",
      message: "History of myocarditis",
      detail:
        "May require individualised risk assessment. Ensure patient has 15-min observation post-injection. Counsel on chest pain warning signs.",
    });
  }

  return alerts;
}

export function hasHardStops(state: CovidBoosterConsultationState): boolean {
  const alerts = getAllAlerts(state);
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: CovidBoosterConsultationState): DoseRecommendation | null {
  if (!state.assessment.adultConfirmed || !state.assessment.previousCovidVaccine) {
    return null;
  }

  return {
    medicine: "COVID-19 mRNA Booster (XBB.1.5 or current variant-updated formulation)",
    dose: "0.3 mL",
    frequency: "Single dose",
    duration: "One-time booster",
    reason: `Adult with prior COVID-19 vaccination; meets criteria for variant-updated booster under PGD.`,
  };
}
