import type { HPVConsultationState } from "./hpv-types";
import type { ClinicalAlert, DoseRecommendation } from "../../shared/types";

// ─────────────────────────────────────────────────────────────────────────
// Clinical logic for the HPV PGD, aligned to signed document v005
// (11 Sep 2026), Green Book chapter 18a (June 2023) and the Gardasil 9
// SPC (text revised 13 Sep 2024).
//
// Schedule, which is chosen from age at first dose and immune status:
//   immunosuppressed or known HIV positive, any age  -> 3 doses, 0/1/4-6 mo
//   immunocompetent, under 25 at vaccination         -> 1 dose, course done
//   immunocompetent, 25 and over                     -> 2 doses, 6-24 mo apart
//                                                       (min 5 mo, Gardasil 9)
//
// The 1-dose and 2-dose courses are OFF-LABEL: the SPC has no 1-dose
// schedule at all and specifies 3 doses from 15 years of age. Documented
// consent to off-label use is required for both.
// ─────────────────────────────────────────────────────────────────────────

export type HPVScheduleKey = "one-dose" | "two-dose" | "three-dose" | "complete";

export interface HPVSchedule {
  key: HPVScheduleKey;
  doses: number;
  label: string;
  intervals: string;
  offLabel: boolean;
  basis: string;
}

/** Number of previous HPV vaccine doses recorded, 0 where none or unknown. */
export function priorDoseCount(state: HPVConsultationState): number {
  switch (state.assessment.priorDoses) {
    case "one":
      return 1;
    case "two":
      return 2;
    case "three":
      return 3;
    default:
      return 0;
  }
}

/** Selects the schedule. Returns null while age or immune status is unknown. */
export function selectSchedule(state: HPVConsultationState): HPVSchedule | null {
  const age = state.patient.age;
  if (age === null || age < 9) return null;

  if (state.assessment.doseBefore25) {
    return {
      key: "complete",
      doses: 0,
      label: "No further doses required",
      intervals:
        "A single dose given before the 25th birthday completes the course, whatever the patient's age now.",
      offLabel: false,
      basis: "Green Book chapter 18a.",
    };
  }

  const schedule = selectCourse(state, age);

  // Exclusion (PGD v005): has already completed a full course of HPV vaccine
  // appropriate to their age and immune status.
  if (priorDoseCount(state) >= schedule.doses) {
    return {
      key: "complete",
      doses: 0,
      label: "No further doses required",
      intervals: `The patient has already received ${priorDoseCount(state)} dose${
        priorDoseCount(state) === 1 ? "" : "s"
      }, which completes the ${schedule.doses}-dose course appropriate to their age and immune status.`,
      offLabel: false,
      basis: "PGD exclusion: full course already completed for age and immune status.",
    };
  }

  return schedule;
}

/** The course that applies from age at first dose and immune status, ignoring prior doses. */
function selectCourse(state: HPVConsultationState, age: number): HPVSchedule {
  if (state.assessment.immunosuppressedOrHIV) {
    return {
      key: "three-dose",
      doses: 3,
      label: "Three doses",
      intervals:
        "0, 1 month, and 4 to 6 months. All three ideally within 12 months. If the second dose is late and the patient is unlikely to return after three months, the third may be given at least one month after the second.",
      offLabel: false,
      basis:
        "Immunosuppressed or known HIV positive. Green Book chapter 18a; within the Gardasil 9 SPC minimum intervals.",
    };
  }

  if (age < 25) {
    return {
      key: "one-dose",
      doses: 1,
      label: "One dose. That is the whole course.",
      intervals:
        "Single dose. Do not book further doses and do not charge for any.",
      offLabel: true,
      basis:
        "Immunocompetent and under 25. JCVI single-dose schedule in force since 1 September 2023. The Gardasil 9 SPC contains no one-dose schedule, so this is off-label.",
    };
  }

  return {
    key: "two-dose",
    doses: 2,
    label: "Two doses",
    intervals:
      "Second dose 6 to 24 months after the first. The minimum interval for Gardasil 9 is 5 months. Any gap between 6 and 24 months is clinically acceptable.",
    offLabel: true,
    basis:
      "Immunocompetent and 25 or over. JCVI two-dose schedule. The Gardasil 9 SPC specifies three doses from 15 years of age, so this is off-label.",
  };
}

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
 * Minimum interval in days before the given dose number under the schedule
 * (PGD v005 guidance summary): two-dose course, dose 2 at least 5 months
 * after dose 1; three-dose course, dose 2 at least 1 month after dose 1 and
 * dose 3 at least 3 months after dose 2. Returns null where no interval applies.
 */
export function minimumIntervalDays(schedule: HPVSchedule | null, doseNumber: string): number | null {
  if (!schedule) return null;
  if (schedule.key === "two-dose" && doseNumber === "2") return 152;
  if (schedule.key === "three-dose" && doseNumber === "2") return 28;
  if (schedule.key === "three-dose" && doseNumber === "3") return 90;
  return null;
}

/** Plain-English label for a minimum interval. */
export function minimumIntervalLabel(schedule: HPVSchedule | null, doseNumber: string): string {
  const d = minimumIntervalDays(schedule, doseNumber);
  if (d === 152) return "5 months";
  if (d === 28) return "1 month";
  if (d === 90) return "3 months";
  return "";
}

export function getAllAlerts(state: HPVConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const age = state.patient.age;
  const schedule = selectSchedule(state);

  // ── Hard stops ────────────────────────────────────────────────────────
  if (age !== null && age < 9) {
    alerts.push({
      severity: "stop",
      code: "HPV_AGE_CRITERIA",
      message: "Patient is under 9 years of age",
      detail:
        "Gardasil 9 is licensed from 9 years. Safety and efficacy below 9 years have not been established. Do not vaccinate under this PGD.",
    });
  }

  if (state.assessment.pregnancyStatus === "confirmed") {
    alerts.push({
      severity: "stop",
      code: "HPV_PREGNANCY",
      message: "Known to be pregnant: postpone, do not vaccinate today",
      detail:
        "The SPC advises postponing until after the pregnancy because the data are considered insufficient, not because harm has been shown. Agree when the patient should return. Do NOT recommend avoiding conception and do NOT suggest any concern about a pregnancy that has already happened: Green Book chapter 18a states that termination must not be recommended after inadvertent immunisation.",
    });
  }

  if (state.assessment.currentFebrileIllness) {
    alerts.push({
      severity: "stop",
      code: "HPV_FEBRILE",
      message: "Acute severe febrile illness: postpone",
      detail:
        "Defer until fully recovered, so that symptoms of the illness are not misattributed to the vaccine. A minor illness without fever is NOT a reason to defer.",
    });
  }

  if (state.assessment.anaphylaxisToPreviousDose === "yes") {
    alerts.push({
      severity: "stop",
      code: "HPV_PREVIOUS_ANAPHYLAXIS",
      message: "Confirmed anaphylaxis to a previous HPV vaccine dose",
      detail:
        "Contraindicated. Do not give further HPV vaccine. Refer to the GP or an allergy service rather than simply declining.",
    });
  }

  if (state.assessment.anaphylaxisToComponent === "yes") {
    alerts.push({
      severity: "stop",
      code: "HPV_COMPONENT_ANAPHYLAXIS",
      message:
        "Confirmed anaphylaxis to a component of Gardasil 9, or hypersensitivity after previous Gardasil 9, Gardasil or Silgard",
      detail:
        "Contraindicated. Excipients are sodium chloride, histidine, polysorbate 80, borax and water for injections, with amorphous aluminium hydroxyphosphate sulfate adjuvant. Refer to the GP or an allergy service rather than simply declining.",
    });
  }

  if (schedule?.key === "complete") {
    alerts.push({
      severity: "stop",
      code: "HPV_COURSE_COMPLETE",
      message: "Course already complete: no further dose required",
      detail: `${schedule.intervals} Do not give, and do not charge for, a further dose. Explain this to the patient.`,
    });
  }

  // ── Off-label consent, required before an off-label schedule is used ──
  if (schedule?.offLabel && !state.consent16.offLabelConsentGiven) {
    alerts.push({
      severity: "red-flag",
      code: "HPV_OFFLABEL_CONSENT",
      message: `${schedule.label} is an off-label schedule: consent must be taken and recorded`,
      detail: `${schedule.basis} Explain that the number of doses follows current UK national recommendations, that this differs from the manufacturer's licence which specifies more doses, and that the patient may choose the licensed schedule instead. Record the consent naming the schedule; a general consent to vaccination is not sufficient.`,
    });
  }

  // ── Consent in children and young people ─────────────────────────────
  if (age !== null && age >= 9 && age < 16 && !state.consent16.basis) {
    alerts.push({
      severity: "red-flag",
      code: "HPV_UNDER16_CONSENT",
      message: "Patient is under 16: record the basis of consent",
      detail:
        "Consent must come from a person with parental responsibility, or from the young person where you assess them as Gillick competent. Record which, and where Gillick, the basis of that assessment.",
    });
  }

  // ── Cautions ─────────────────────────────────────────────────────────
  if (state.assessment.immunosuppressedOrHIV) {
    alerts.push({
      severity: "caution",
      code: "HPV_IMMUNOSUPPRESSION",
      message: "Immunosuppressed or HIV positive: three-dose schedule applies",
      detail:
        "Vaccinate. Eligible GBMSM known to be HIV positive should be offered the vaccine regardless of CD4 count, antiretroviral therapy or viral load. The response may be suboptimal; in transplant recipients additional doses after treatment are a specialist decision, not one for this PGD.",
    });
  }

  if (state.assessment.bleedingDisorderOrAnticoagulated) {
    alerts.push({
      severity: "caution",
      code: "HPV_BLEEDING",
      message: "Bleeding disorder or anticoagulation: adjust technique",
      detail:
        "Intramuscular vaccination is generally acceptable. Use a 23 gauge or finer needle and apply firm pressure without rubbing for at least two minutes. For haemophilia treatment, vaccinate shortly after a dose of that treatment. A patient on stable warfarin, up to date with INR testing and with a latest INR below the top of their therapeutic range, may be vaccinated intramuscularly. If in doubt, contact the clinician responsible for the anticoagulation.",
    });
  }

  if (state.assessment.bloodProductsLast3Months) {
    alerts.push({
      severity: "caution",
      code: "HPV_BLOOD_PRODUCTS",
      message: "Immunoglobulin or blood products within the previous three months: record it",
      detail:
        "Not studied with Gardasil 9. Not a contraindication. Vaccinate and record it on the consultation record.",
    });
  }

  if (age !== null && age >= 9 && age <= 25) {
    alerts.push({
      severity: "caution",
      code: "HPV_SYNCOPE",
      message: "Vaccinate seated and observe for 15 minutes",
      detail:
        "Fainting, sometimes with tonic-clonic movements on recovery, can occur before or after any injection and is commonest in adolescents. It is a response to the needle, not the vaccine. Have procedures in place to prevent injury from a faint.",
    });
  }

  if (age !== null && age >= 9 && age < 12) {
    alerts.push({
      severity: "caution",
      code: "HPV_9_TO_11",
      message: "Aged 9 to 11: licensed, but outside the national programme",
      detail:
        "Gardasil 9 is licensed from 9 years, so this patient may be vaccinated under this PGD. They are not covered by the NHS programme, which starts in school year 8, so a private supply is their only route. Say so to the parent.",
    });
  }

  if (!state.assessment.nhsEligibilityDiscussed) {
    alerts.push({
      severity: "caution",
      code: "HPV_NHS_ELIGIBILITY",
      message: "Tell the patient whether they could have this free on the NHS",
      detail:
        "NHS eligibility: adolescents of any sex from 11 years, offered in school year 8; anyone in an eligible cohort until their 25th birthday (England: females born after 1 Sep 1991, males after 1 Sep 2006); all GBMSM up to and including 45 at specialist sexual health or HIV services. This conversation must happen and must be recorded.",
    });
  }

  return alerts;
}

export function hasHardStops(state: HPVConsultationState): boolean {
  return getAllAlerts(state).some((a) => a.severity === "stop");
}

export function calculateDoseRecommendation(
  state: HPVConsultationState
): DoseRecommendation | null {
  const schedule = selectSchedule(state);
  if (!schedule || schedule.key === "complete") return null;

  return {
    medicine: "Gardasil 9 (HPV 6, 11, 16, 18, 31, 33, 45, 52, 58 vaccine)",
    dose: "0.5 mL intramuscular, deltoid or higher anterolateral thigh",
    dosingRegimen: `${schedule.label} ${schedule.intervals}${
      schedule.offLabel ? " OFF-LABEL: documented consent required." : ""
    }`,
    reason: schedule.basis,
  };
}

/** Human-readable summary of the remaining course, for the patient record. */
export function calculateScheduleSummary(state: HPVConsultationState): string {
  const schedule = selectSchedule(state);
  if (!schedule) return "Schedule not yet determined.";
  if (schedule.key === "complete") return schedule.intervals;
  return `${schedule.doses} dose${schedule.doses === 1 ? "" : "s"}. ${schedule.intervals}`;
}
