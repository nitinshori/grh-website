import type { ShinglesConsultationState } from "./shingles-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

export function getAllAlerts(state: ShinglesConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.patient.age !== null && state.patient.age < 18) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_AGE",
      message: "Patient age &lt; 18 years",
      detail: "Shingrix is approved from age 18 years (standard eligibility age 50+).",
    });
  }

  if (!state.assessment.ageEligible && state.patient.age !== null && state.patient.age < 50 && !state.assessment.immunosuppressed) {
    alerts.push({
      severity: "caution",
      code: "SHINGLES_UNDER_50",
      message: "Patient age &lt; 50 and not immunosuppressed",
      detail: "Standard eligibility is 50+ years. Consider with patient if immunocompromised.",
    });
  }

  if (state.assessment.anaphylaxisToComponent) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_ANAPHYLAXIS",
      message: "Anaphylaxis to vaccine component",
      detail: "Contraindicated. Do not administer Shingrix.",
    });
  }

  if (state.assessment.severeAcuteIllness) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_ACUTE_ILLNESS",
      message: "Severe acute illness present",
      detail: "Defer vaccination until patient has fully recovered.",
    });
  }

  if (state.assessment.pregnancyStatus === "confirmed") {
    alerts.push({
      severity: "caution",
      code: "SHINGLES_PREGNANCY",
      message: "Patient is pregnant",
      detail: "Shingrix can be given to pregnant patients if benefits outweigh risks. Risk assess with patient.",
    });
  }

  return alerts;
}

export function hasHardStops(state: ShinglesConsultationState): boolean {
  const alerts = getAllAlerts(state);
  return alerts.some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(state: ShinglesConsultationState): DoseRecommendation | null {
  if (!state.assessment.ageEligible || state.patient.age === null) {
    return null;
  }

  return {
    medicine: "Shingrix (recombinant zoster vaccine)",
    dose: "0.5 mL",
    dosingRegimen: "2-dose series: Dose 1 today, Dose 2 in 2 months",
    reason: `Age-eligible patient (${state.patient.age} years); meets criteria for shingles vaccination under PGD.`,
  };
}
