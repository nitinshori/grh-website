import type { MySimbaConsultationState } from "./mysimba-types";
import type { ClinicalAlert } from "../../shared/types";

export function getAllAlerts(state: MySimbaConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (!state.assessment.bmiEligible) {
    alerts.push({
      severity: "stop",
      code: "MYSIMBA_BMI",
      message: "BMI does not meet eligibility",
      detail: "BMI must be 30 or more, or 27 or more with at least one weight-related comorbidity",
    });
  }

  if (state.assessment.uncontrolledHypertension) {
    alerts.push({
      severity: "stop",
      code: "MYSIMBA_HTN",
      message: "Uncontrolled hypertension",
      detail: "Blood pressure must be controlled before starting Mysimba",
    });
  }

  if (state.assessment.seizureDisorders) {
    alerts.push({
      severity: "stop",
      code: "MYSIMBA_SEIZURE",
      message: "Seizure disorder history",
      detail: "Bupropion component lowers seizure threshold; contraindicated",
    });
  }

  if (state.assessment.currentOpioidUse) {
    alerts.push({
      severity: "stop",
      code: "MYSIMBA_OPIOID",
      message: "Current opioid use or dependence, or within 7 to 10 days of opioid discontinuation",
      detail: "Do not use within 7 to 10 days of opioid discontinuation",
    });
  }

  if (state.assessment.anorexiaBulimia) {
    alerts.push({
      severity: "stop",
      code: "MYSIMBA_EATING",
      message: "Anorexia or bulimia history",
      detail: "Contraindicated due to seizure risk",
    });
  }

  if (state.assessment.onMAOIs) {
    alerts.push({
      severity: "stop",
      code: "MYSIMBA_MAOI",
      message: "On MAOI therapy",
      detail: "Risk of hypertensive crisis; must discontinue MAOI 2 weeks before",
    });
  }

  return alerts;
}

export function hasHardStops(state: MySimbaConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}
