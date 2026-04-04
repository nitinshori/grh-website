import type { HPVConsultationState } from "./hpv-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: HPVConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Age check (9+)
  if (state.patient.age !== null && state.patient.age < 9) {
    alerts.push({
      severity: "stop",
      code: "HPV_AGE_CRITERIA",
      message: "Patient age &lt; 9 years",
      detail: "Gardasil 9 is approved from age 9 years. This patient does not meet criteria.",
    });
  }

  // Pregnancy
  if (state.assessment.pregnancyStatus === "confirmed") {
    alerts.push({
      severity: "stop",
      code: "HPV_PREGNANCY",
      message: "Patient is pregnant",
      detail:
        "Vaccination should be deferred until after pregnancy completion. Counsel on avoiding conception during course.",
    });
  }

  // Severe febrile illness
  if (state.assessment.currentFebrileIllness) {
    alerts.push({
      severity: "stop",
      code: "HPV_FEBRILE",
      message: "Severe febrile illness present",
      detail:
        "Vaccination should be deferred until patient is fully recovered and afebrile.",
    });
  }

  // Anaphylaxis to yeast
  if (state.assessment.anaphylaxisToYeast) {
    alerts.push({
      severity: "stop",
      code: "HPV_YEAST_ALLERGY",
      message: "Anaphylaxis to yeast reported",
      detail:
        "Contraindicated. Gardasil 9 contains yeast. Do not administer.",
    });
  }

  // Anaphylaxis to previous HPV dose
  if (state.assessment.anaphylaxisToPreviousDose) {
    alerts.push({
      severity: "stop",
      code: "HPV_PREVIOUS_ANAPHYLAXIS",
      message: "Anaphylaxis to previous HPV vaccine dose",
      detail:
        "Contraindicated. Do not give further HPV vaccine doses.",
    });
  }

  return alerts;
}

export function hasHardStops(state: HPVConsultationState): boolean {
  const alerts = getAllAlerts(state);
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: HPVConsultationState): DoseRecommendation | null {
  if (!state.patient.femaleConfirmed || state.patient.age === null || state.patient.age < 9) {
    return null;
  }

  return {
    medicine: "Gardasil 9 (HPV 6, 11, 16, 18, 31, 33, 45, 52, 58 vaccine)",
    dose: "0.5 mL",
    dosingRegimen: "3-dose schedule: Dose 1 today, Dose 2 in 2 months, Dose 3 in 6 months from Dose 1",
    reason: `Female, age ${state.patient.age} years; meets inclusion criteria for HPV vaccination under PGD.`,
  };
}

export function calculateScheduleSummary(currentDose: number): string {
  const doseDates = [
    "Today (Dose 1)",
    "2 months from today (Dose 2)",
    "6 months from today (Dose 3)",
  ];
  return doseDates.slice(currentDose - 1).join("; ");
}
