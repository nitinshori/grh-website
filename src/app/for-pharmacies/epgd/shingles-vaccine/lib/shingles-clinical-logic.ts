// Aligned to the Shingrix PGD version 007, issued 11 September 2026, as amended by
// the signatories' decisions 13, 14 and 15 of 11 September 2026 (two arms: aged 50
// and over, and aged 18 to 49 severely immunosuppressed; late second dose given
// without restarting; NHS-eligible patients told before a private supply).
import type { ShinglesConsultationState, ShinglesArm } from "./shingles-types";
import { SEVERE_IMMUNOSUPPRESSION_QUALIFYING } from "./shingles-types";
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

/**
 * Minimum interval between doses: 2 months in Arm 1 (SmPC) and 8 weeks in Arm 2
 * (Green Book chapter 28a), both taken as 56 days. Intended maximum: 6 months.
 * A second dose after 6 months is still given, as soon as possible, and the
 * course is not restarted (Green Book, previous incomplete vaccination).
 */
export const MIN_INTERVAL_DAYS = 56;
export const MAX_INTERVAL_DAYS = 183;

/** Which arm of the PGD the patient falls under, or "" when neither applies. */
export function getArm(state: ShinglesConsultationState): ShinglesArm {
  const age = state.patient.age;
  if (age === null) return "";
  if (age >= 50) return "50-plus";
  if (
    age >= 18 &&
    state.assessment.immunosuppressed &&
    SEVERE_IMMUNOSUPPRESSION_QUALIFYING.has(state.assessment.severeImmunosuppressionCategory)
  ) {
    return "18-49-immunosuppressed";
  }
  return "";
}

/** Meets the Green Book Box 1 definition of severe immunosuppression (any age). */
export function severelyImmunosuppressed(state: ShinglesConsultationState): boolean {
  return (
    state.assessment.immunosuppressed &&
    SEVERE_IMMUNOSUPPRESSION_QUALIFYING.has(state.assessment.severeImmunosuppressionCategory)
  );
}

/**
 * NHS-eligible for Shingrix (Green Book chapter 28a, from 1 September 2025):
 * routine cohorts at 65 and 70 with the 66 to 70 catch-up, anyone previously
 * eligible until their 80th birthday, and severely immunosuppressed adults aged
 * 18 and over with no upper age limit. Returns the group, or "" if not eligible.
 */
export function nhsEligibleGroup(state: ShinglesConsultationState): string {
  const age = state.patient.age;
  if (age === null) return "";
  if (age >= 18 && severelyImmunosuppressed(state)) {
    return "severely immunosuppressed, aged 18 or over";
  }
  if (age >= 65 && age <= 79) {
    return "aged 65 to 79 (routine and catch-up cohorts, eligible until the 80th birthday)";
  }
  return "";
}

export function getAllAlerts(state: ShinglesConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const age = state.patient.age;
  const arm = getArm(state);

  if (age !== null && age < 18) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_AGE",
      message: "Patient is under 18 years",
      detail:
        "Shingrix is not licensed under 18 and is not indicated for the prevention of chickenpox. Not covered by this PGD.",
    });
  }

  if (age !== null && age >= 18 && age < 50) {
    if (!state.assessment.immunosuppressed) {
      alerts.push({
        severity: "stop",
        code: "SHINGLES_UNDER_50_NOT_IMMUNOSUPPRESSED",
        message: "Aged 18 to 49 and not immunosuppressed",
        detail:
          "Arm 1 of this PGD covers adults aged 50 and over. Arm 2 covers adults aged 18 to 49 only where they are severely immunosuppressed as defined in Green Book chapter 28a, Box 1. Not covered: refer to the GP.",
      });
    } else if (state.assessment.severeImmunosuppressionCategory === "not-severe") {
      alerts.push({
        severity: "stop",
        code: "SHINGLES_UNDER_50_NOT_SEVERE",
        message: "Immunosuppression does not meet the Green Book Box 1 definition",
        detail:
          "Arm 2 requires severe immunosuppression as defined in Green Book chapter 28a, Box 1. Short high-dose steroid courses of up to 40mg prednisolone a day for acute asthma, COPD or COVID-19, replacement corticosteroids, topical or inhaled corticosteroids, and primary humoral immunodeficiency without a T-cell defect do not qualify. Refer to the GP.",
      });
    } else if (state.assessment.severeImmunosuppressionCategory === "anticipating") {
      alerts.push({
        severity: "stop",
        code: "SHINGLES_UNDER_50_ANTICIPATING",
        message: "Not yet immunosuppressed: immunosuppressive therapy planned",
        detail:
          "Arm 2 covers patients who currently meet the Box 1 definition. A patient about to start immunosuppressive therapy is referred to the treating specialist or GP, who can start the course before treatment on the Green Book timing (ideally one month, at least 14 days, before therapy).",
      });
    } else if (state.assessment.immunosuppressionDoubt === "unresolved") {
      alerts.push({
        severity: "stop",
        code: "SHINGLES_UNDER_50_DOUBT",
        message: "Doubt whether the Box 1 definition is met has not been resolved",
        detail:
          "Where there is any doubt, the treating specialist or GP must confirm that the patient is severely immunosuppressed as defined in Green Book chapter 28a, Box 1, before vaccination under Arm 2. Refer.",
      });
    }
  }

  const nhsGroup = nhsEligibleGroup(state);
  if (nhsGroup && !state.assessment.nhsEntitlementExplained) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_NHS_ENTITLEMENT",
      message: "Patient is eligible for Shingrix on the NHS and has not yet been told",
      detail: `This patient is NHS-eligible (${nhsGroup}). The PGD requires that they are told Shingrix is free of charge on the NHS before any private supply proceeds, and that this is recorded.`,
    });
  }

  if (state.assessment.anaphylaxisToComponent === "yes") {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_ANAPHYLAXIS",
      message: "Hypersensitivity to any component of the vaccine",
      detail: "Excluded. Do not administer Shingrix. Refer to the GP.",
    });
  }

  if (state.assessment.severeAcuteIllness === "yes") {
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
    // Pregnancy or breastfeeding is an exclusion; an unestablished status
    // cannot satisfy it (adversarial review, 11 Sep 2026).
    alerts.push({
      severity: "stop",
      code: "SHINGLES_PREGNANCY_UNKNOWN",
      message: "Pregnancy or breastfeeding status not established",
      detail: "Pregnancy or breastfeeding is an exclusion under this PGD. Establish the status before vaccinating; do not proceed until it is recorded as not pregnant and not breastfeeding.",
    });
  }

  if (state.assessment.completedCourse) {
    alerts.push({
      severity: "stop",
      code: "SHINGLES_COURSE_COMPLETE",
      message: "Two-dose course of Shingrix already completed",
      detail: "Not eligible: the PGD covers individuals who have not completed a two-dose course. No further dose; a completed course is not repeated if the patient later becomes immunosuppressed (Green Book).",
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

  if (state.assessment.immunosuppressed && !alerts.some((a) => a.code.startsWith("SHINGLES_UNDER_50"))) {
    alerts.push({
      severity: "caution",
      code: "SHINGLES_IMMUNOSUPPRESSED",
      message: arm === "18-49-immunosuppressed" ? "Arm 2: severely immunosuppressed, aged 18 to 49" : "Patient is immunosuppressed",
      detail:
        arm === "18-49-immunosuppressed"
          ? "Shingrix is non-live. Give the second dose 8 weeks to 6 months after the first so that protection is not delayed (Green Book chapter 28a). The immune response may be reduced: advise that protection may be limited. Record the Box 1 category and the condition or therapy relied on."
          : "Shingrix is non-live and is the preferred vaccine for immunocompromised individuals. Advise that the response may be reduced.",
    });
  }

  // Dose 2 interval. Decision 13 (11 Sep 2026): a second dose more than 6 months
  // after the first is given as soon as possible and the course is not restarted
  // (Green Book chapter 28a, previous incomplete vaccination). No longer a stop.
  if (state.supply.doseNumber === "2" && state.assessment.previousShingrixDate && state.supply.vaccinationDate) {
    const days = daysBetween(state.assessment.previousShingrixDate, state.supply.vaccinationDate);
    if (days !== null && days > MAX_INTERVAL_DAYS) {
      alerts.push({
        severity: "caution",
        code: "SHINGLES_INTERVAL_LONG",
        message: "More than 6 months since dose 1",
        detail: `${days} days since dose 1. Give dose 2 now, as soon as possible; do not repeat dose 1 or restart the course (Green Book). Record the interval and that the late dose completes the course.`,
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
  const arm = getArm(state);
  if (!state.assessment.ageEligible || state.patient.age === null || !arm) {
    return null;
  }

  const dose2 = state.supply.doseNumber === "2";
  const interval = arm === "50-plus" ? "2 to 6 months" : "8 weeks to 6 months";
  const late =
    dose2 && state.assessment.previousShingrixDate && state.supply.vaccinationDate
      ? (daysBetween(state.assessment.previousShingrixDate, state.supply.vaccinationDate) ?? 0) > MAX_INTERVAL_DAYS
      : false;
  return {
    medicine: "Shingrix (recombinant zoster vaccine, non-live)",
    dose: "0.5 mL intramuscular, preferably in the deltoid",
    dosingRegimen: dose2
      ? `Dose 2 of 2 (dose 1 given ${state.assessment.previousShingrixDate || "date not recorded"})${late ? ", more than 6 months after dose 1: given as soon as possible, course not restarted (Green Book)" : ""}. Course complete.`
      : `Dose 1 of 2. Second dose ${interval} after the first${state.supply.nextDoseDue ? `, due ${state.supply.nextDoseDue}` : ""}. A late second dose is still given as soon as possible without restarting.`,
    reason:
      arm === "50-plus"
        ? `Arm 1: aged ${state.patient.age} years, within the licensed indication (50 and over); meets the Shingrix PGD inclusion criteria.`
        : `Arm 2: aged ${state.patient.age} years and severely immunosuppressed as defined in Green Book chapter 28a, Box 1 (${state.assessment.severeImmunosuppressionCategory}); meets the Shingrix PGD inclusion criteria.`,
  };
}
