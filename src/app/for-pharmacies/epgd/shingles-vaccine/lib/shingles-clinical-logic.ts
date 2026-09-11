// Aligned to the Shingrix PGD version 005, issued 11 September 2026.
import type { ShinglesConsultationState } from "./shingles-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Days between two ISO dates, or null when either is missing or invalid. */
export function daysBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

/** Minimum interval between doses: 2 months (taken as 56 days). Maximum in the PGD: 6 months. */
export const MIN_INTERVAL_DAYS = 56;
export const MAX_INTERVAL_DAYS = 183;

export function getAllAlerts(state: ShinglesConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (state.patient.age !== null && state.patient.age < 50) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_AGE",
      message: "Patient is under 50 years",
      detail:
        "This PGD covers individuals aged 50 years and over only. An immunosuppressed adult aged 18 to 49 is eligible for Shingrix under the Green Book and SmPC but is not covered by this PGD: refer to the GP.",
    });
  }

  if (state.assessment.anaphylaxisToComponent) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_ANAPHYLAXIS",
      message: "Hypersensitivity to any component of the vaccine",
      detail: "Excluded. Do not administer Shingrix. Refer to the GP.",
    });
  }

  if (state.assessment.severeAcuteIllness) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_ACUTE_ILLNESS",
      message: "Acute illness with fever",
      detail: "Delay vaccination until the patient has recovered.",
    });
  }

  if (state.assessment.pregnancyStatus === "confirmed") {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_PREGNANCY",
      message: "Patient is pregnant",
      detail: "Pregnancy is an exclusion under this PGD (not routinely recommended). Refer to the GP.",
    });
  }

  if (state.assessment.pregnancyStatus === "breastfeeding") {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_BREASTFEEDING",
      message: "Patient is breastfeeding",
      detail: "Breastfeeding is an exclusion under this PGD (not routinely recommended). Refer to the GP.",
    });
  }

  if (state.assessment.pregnancyStatus === "unknown") {
    alerts.push({
      severity: "caution",
      code: "SHINGLES_PREGNANCY_UNKNOWN",
      message: "Pregnancy status unknown",
      detail: "Pregnancy or breastfeeding excludes. Establish status before vaccinating a patient of childbearing potential.",
    });
  }

  if (state.assessment.completedCourse) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_COURSE_COMPLETE",
      message: "Two-dose course of Shingrix already completed",
      detail: "Not eligible: the PGD covers individuals who have not completed a two-dose course. No further dose.",
    });
  }

  if (state.assessment.previousShinglesHistory) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_RECENT_EPISODE",
      message: "Shingles in the past 12 months",
      detail: "Inclusion requires no history of shingles in the past 12 months. Not for treatment of acute shingles. Advise to return once 12 months have passed.",
    });
  }

  if (state.assessment.recentOtherVaccine) {
    alerts.push({
      severity: "caution",
      code: "SHINGLES_OTHER_VACCINE",
      message: "Other vaccine given recently or today",
      detail: "Allow appropriate spacing from other vaccines (e.g. COVID-19 or influenza) based on clinical judgement. Record the decision.",
    });
  }

  if (state.assessment.immunosuppressed) {
    alerts.push({
      severity: "caution",
      code: "SHINGLES_IMMUNOSUPPRESSED",
      message: "Patient is immunosuppressed",
      detail: "Shingrix is non-live and is the preferred vaccine for immunocompromised individuals aged 50 and over. Advise that the response may be reduced.",
    });
  }

  // Dose 2 interval (PGD v005 dose row: second dose 2 to 6 months after the first)
  if (state.supply.doseNumber === "2" && state.assessment.previousShingrixDate && state.supply.vaccinationDate) {
    const days = daysBetween(state.assessment.previousShingrixDate, state.supply.vaccinationDate);
    if (days !== null && days > MAX_INTERVAL_DAYS) {
      alerts.push({
        severity: "caution",
        code: "SHINGLES_INTERVAL_LONG",
        message: "More than 6 months since dose 1",
        detail: "The PGD schedules dose 2 at 2 to 6 months after dose 1. Green Book advice is to complete the course without restarting; use clinical judgement and record the reason.",
      });
    }
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

  const dose2 = state.supply.doseNumber === "2";
  return {
    medicine: "Shingrix (recombinant zoster vaccine, non-live)",
    dose: "0.5 mL intramuscular, preferably in the deltoid",
    dosingRegimen: dose2
      ? `Dose 2 of 2 (dose 1 given ${state.assessment.previousShingrixDate || "date not recorded"}). Course complete.`
      : `Dose 1 of 2. Second dose 2 to 6 months after the first${state.supply.nextDoseDue ? `, due ${state.supply.nextDoseDue}` : ""}.`,
    reason: `Aged ${state.patient.age} years, eligible under national immunisation guidelines; meets the Shingrix PGD v005 inclusion criteria.`,
  };
}
