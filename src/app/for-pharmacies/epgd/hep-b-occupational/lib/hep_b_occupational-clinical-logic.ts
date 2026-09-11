import type { ClinicalAlert } from "../../shared/types";
import type { HepBState, Schedule, DoseNumber } from "./hep_b_occupational-types";
import { formatLocalDate } from "./hep_b_occupational-types";

// ─── Date helpers (calendar days, local midnight) ───

export function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export function addMonths(n: number, from: Date = todayLocal()): string {
  return formatLocalDate(new Date(from.getFullYear(), from.getMonth() + n, from.getDate()));
}

export function isExpired(expiry: string): boolean {
  const d = parseLocalDate(expiry);
  return d !== null && daysBetween(todayLocal(), d) < 0;
}

// ─── Schedules from the signed PGD (v005) ───
// Standard: 0, 1 and 6 months. Accelerated: 0, 1, 2 and 12 months. The
// guidance summary adds a booster at 5 years for ongoing risk after a
// standard course.

export interface DoseRule {
  /** Minimum days since the previous dose (null: first dose). */
  minDays: number | null;
  /** Months from today to the next dose (null: course complete with this dose). */
  nextMonths: number | null;
  nextLabel: string;
}

const MONTH = 30;

export const SCHEDULE_RULES: Record<Exclude<Schedule, "">, Record<Exclude<DoseNumber, "">, DoseRule>> = {
  standard: {
    "1st": { minDays: null, nextMonths: 1, nextLabel: "2nd dose due 1 month after the 1st" },
    "2nd": { minDays: 28, nextMonths: 5, nextLabel: "3rd dose due 6 months after the 1st (5 months after the 2nd)" },
    "3rd": { minDays: 5 * MONTH, nextMonths: null, nextLabel: "Primary course complete. A booster at 5 years may be given for ongoing risk" },
    booster: { minDays: 5 * 365, nextMonths: null, nextLabel: "Booster given; no further routine dose" },
  },
  accelerated: {
    "1st": { minDays: null, nextMonths: 1, nextLabel: "2nd dose due 1 month after the 1st" },
    "2nd": { minDays: 28, nextMonths: 1, nextLabel: "3rd dose due 2 months after the 1st (1 month after the 2nd)" },
    "3rd": { minDays: 28, nextMonths: 10, nextLabel: "Booster due at 12 months from the 1st dose (10 months after the 3rd)" },
    booster: { minDays: 10 * MONTH, nextMonths: null, nextLabel: "Course complete with the 12-month booster" },
  },
};

export const DOSE_LABEL: Record<Exclude<DoseNumber, "">, string> = {
  "1st": "1st dose",
  "2nd": "2nd dose",
  "3rd": "3rd dose",
  booster: "Booster",
};

export function doseOptionsFor(schedule: Schedule): { value: DoseNumber; label: string }[] {
  if (!schedule) return [];
  return [
    { value: "1st", label: "1st dose" },
    { value: "2nd", label: "2nd dose" },
    { value: "3rd", label: "3rd dose" },
    { value: "booster", label: schedule === "accelerated" ? "Booster (12 months after the 1st dose)" : "Booster (5 years after the course, for ongoing risk)" },
  ];
}

export function getDoseRule(schedule: Schedule, dose: DoseNumber): DoseRule | null {
  if (!schedule || !dose) return null;
  return SCHEDULE_RULES[schedule][dose];
}

/** Next dose date computed from the schedule and dose number ("" when the course is complete). */
export function computeNextDoseDate(schedule: Schedule, dose: DoseNumber): string {
  const rule = getDoseRule(schedule, dose);
  if (!rule || rule.nextMonths === null) return "";
  return addMonths(rule.nextMonths);
}

export function getAllAlerts(state: HepBState): ClinicalAlert[] {
  const a: ClinicalAlert[] = [];
  const { assessment, treatment, patient } = state;
  const isUnder16 = patient.age !== null && patient.age < 16;

  if (isUnder16) {
    a.push({ severity: "stop", code: "AGE_UNDER_16", message: "Aged under 16 years", detail: "Children under 16 are not vaccinated under this PGD. Refer to the GP or an appropriate immunisation service." });
  }
  if (assessment.knownHBPositive) {
    a.push({ severity: "stop", code: "HBV_POSITIVE", message: "Known Hepatitis B Positive", detail: "Do not vaccinate. Refer for specialist care." });
  }
  if (assessment.allergyVaccineComponent) {
    a.push({ severity: "stop", code: "VACCINE_ALLERGY", message: "Known hypersensitivity to the active substance or any excipient", detail: "Excluded. Do not administer. Advise on alternatives and inform or refer to the GP." });
  }
  if (assessment.previousSevereReaction) {
    a.push({ severity: "stop", code: "SEVERE_REACTION", message: "Previous allergic reaction to any hepatitis B vaccine", detail: "Excluded. Do not vaccinate. Inform or refer to the GP." });
  }
  if (assessment.currentAcuteIllness) {
    a.push({ severity: "stop", code: "ACUTE_ILLNESS", message: "Acute severe febrile illness", detail: "Excluded: postpone until recovered. Advise when to return." });
  }

  // Previous vaccination status against today's dose number
  const prev = assessment.previousVaccination;
  const dose = treatment.doseNumber;
  if (prev === "none" && dose && dose !== "1st") {
    a.push({ severity: "stop", code: "DOSE_MISMATCH", message: `No previous hepatitis B vaccination recorded, but today's dose is the ${DOSE_LABEL[dose]}`, detail: "The first dose of a course is the 1st dose. Correct the previous vaccination status or the dose number." });
  }
  if (prev === "partial-course" && dose === "1st") {
    a.push({ severity: "stop", code: "RESTART", message: "A partial course is recorded, but today's dose is the 1st dose", detail: "An interrupted course is resumed, not restarted. Record the dose number that continues the course (2nd or 3rd) with the date of the previous dose." });
  }
  if (prev === "full-course" && dose && dose !== "booster") {
    const nonResponder = assessment.antiHBsLevelChecked && assessment.antiHBsLevel === "below-10";
    if (nonResponder) {
      a.push({ severity: "caution", code: "NON_RESPONDER_REPEAT", message: "Full course with anti-HBs below 10 IU/L: repeat course", detail: "A documented non-responder may need a repeat course; the Green Book advises specialist input for persistent non-responders. Record the reasoning." });
    } else {
      a.push({ severity: "stop", code: "COURSE_COMPLETE", message: `A full course is recorded, but today's dose is the ${DOSE_LABEL[dose]}`, detail: "A completed primary course is not repeated. Immunocompetent adults do not need a reinforcing dose unless at ongoing risk (booster at 5 years). Record a booster, or do not vaccinate." });
    }
  }
  if (prev === "full-course" && assessment.antiHBsLevelChecked && assessment.antiHBsLevel === "above-10") {
    a.push({ severity: "caution", code: "GOOD_IMMUNITY", message: "Good immunity documented", detail: "Anti-HBs above 10 IU/L. Revaccination may not be necessary. Consider workplace exposure risk." });
  }

  // Interval since the previous dose
  const rule = getDoseRule(treatment.schedule, dose);
  if (rule && rule.minDays !== null) {
    const prevDate = parseLocalDate(treatment.previousDoseDate);
    if (prevDate) {
      const gap = daysBetween(prevDate, todayLocal());
      if (gap < 0) {
        a.push({ severity: "stop", code: "PREV_DOSE_FUTURE", message: "The previous dose date is in the future", detail: "Check the date of the previous dose." });
      } else if (gap < rule.minDays) {
        a.push({ severity: "stop", code: "INTERVAL_SHORT", message: `Only ${gap} days since the previous dose; the ${treatment.schedule} schedule minimum before the ${DOSE_LABEL[dose as Exclude<DoseNumber, "">]} is ${rule.minDays} days`, detail: "This dose is not due. Giving it early is outside the schedule in the PGD. Rebook for the due date." });
      } else if (gap > rule.minDays * 3) {
        a.push({ severity: "caution", code: "INTERVAL_LONG", message: `${gap} days since the previous dose: late dose`, detail: "An interrupted course is resumed, not restarted. Record the interval; a longer gap does not reduce the final antibody level." });
      }
    }
  }

  if (treatment.vaccine && isExpired(treatment.expiryDate)) {
    a.push({ severity: "stop", code: "EXPIRED", message: "Vaccine batch has expired", detail: "Do not administer. Quarantine the stock and select an in-date batch." });
  }

  // Cautions, worded to the document: it does not authorise the 40
  // microgram presentations, so "consider higher dose" is not an option here.
  if (assessment.knownHCVPositive || assessment.knownHIVPositive) {
    a.push({ severity: "caution", code: "HCV_HIV", message: "HIV or hepatitis C co-infection", detail: "The response may be reduced. Refer for a specialist schedule or post-course serology where indicated. The 40 microgram presentations are not covered by this PGD." });
  }
  if (assessment.immunosuppressed) {
    a.push({ severity: "caution", code: "IMMUNOSUPPRESSED", message: "Immunosuppression", detail: "The response may be reduced. Refer for a specialist schedule or post-course serology; do not assume protection. The 40 microgram presentations are not covered by this PGD." });
  }
  if (assessment.pregnancy) {
    a.push({ severity: "caution", code: "PREGNANCY", message: "Pregnancy", detail: "Not a contraindication: the document states the vaccine is safe in pregnancy and breastfeeding, and the Green Book says it must not be withheld from a pregnant woman in a high-risk category. May be given where indicated; record the decision." });
  }
  if (assessment.bleedingDisorderOrAnticoagulant) {
    a.push({ severity: "caution", code: "BLEEDING", message: "Bleeding disorder or anticoagulant therapy", detail: "Use with caution: fine needle, firm pressure without rubbing for at least 2 minutes, advise on the risk of haematoma." });
  }

  return a;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((x) => x.severity === "stop");
}
