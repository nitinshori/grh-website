// ─── Chickenpox Clinical Logic ───

import type { ChickenpoxConsultationState } from "./chickenpox-types";
import type { ClinicalAlert } from "../../shared/types";

/** Minimum interval between doses in days, per product (PGD dose row). */
export function getMinimumIntervalDays(vaccine: string): number {
  if (vaccine === "Varilrix") return 42; // at least 6 weeks, never less than 4
  return 28; // Varivax: at least 4 weeks (13 years and over: 4 to 8 weeks)
}

export function getScheduleText(vaccine: string, ageYears: number | null): string {
  if (vaccine === "Varilrix") {
    return "Varilrix: two 0.5 mL doses, subcutaneous or intramuscular. Second dose at least 6 weeks after the first, and never less than 4 weeks.";
  }
  if (vaccine === "Varivax") {
    if (ageYears !== null && ageYears >= 13) {
      return "Varivax: two 0.5 mL doses, subcutaneous, usually in the upper arm. 13 years and over: second dose 4 to 8 weeks after the first.";
    }
    return "Varivax: two 0.5 mL doses, subcutaneous, usually in the upper arm. Second dose at least 4 weeks after the first (13 years and over: 4 to 8 weeks).";
  }
  return "Two 0.5 mL doses. Varivax: second dose at least 4 weeks after the first (13 years and over: 4 to 8 weeks). Varilrix: second dose at least 6 weeks after the first, and never less than 4 weeks.";
}

/** Days between two ISO dates, or null when either is missing or invalid. */
export function daysBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function getAllAlerts(state: ChickenpoxConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // Age check (12 months+)
  if (state.patient.age !== null && state.patient.age < 1) {
    alerts.push({
      severity: "stop",
      code: "AGE_TOO_YOUNG",
      message: "Patient under 12 months old",
      detail: "This PGD covers individuals aged 12 months and older.",
    });
  }

  // Exclusion: history of chickenpox infection
  if (state.eligibility.historyOfChickenpox) {
    alerts.push({
      severity: "stop",
      code: "HISTORY_OF_CHICKENPOX",
      message: "History of chickenpox infection",
      detail: "Exclusion. The PGD is for individuals who are susceptible with no history of chickenpox infection.",
    });
  }

  // Exclusion: completed two-dose course
  if (state.eligibility.completedTwoDoseCourse) {
    alerts.push({
      severity: "stop",
      code: "COURSE_COMPLETE",
      message: "Completed two-dose varicella course",
      detail: "Exclusion. No further dose is authorised under this PGD.",
    });
  }

  // Exclusion: pregnancy or planning pregnancy within one month
  if (state.medicalHistory.pregnancy) {
    alerts.push({
      severity: "stop",
      code: "PREGNANCY",
      message: "Pregnant or planning pregnancy within one month",
      detail: "Exclusion: live vaccine. Pregnancy must be avoided for one month post-vaccination.",
    });
  }

  // Exclusion: immunosuppression of any cause (SmPC list)
  if (state.medicalHistory.immunosuppressed) {
    alerts.push({
      severity: "stop",
      code: "IMMUNOSUPPRESSED",
      message: "Immunosuppression of any cause",
      detail: "Exclusion: immunosuppressive therapy or high-dose systemic corticosteroids; blood dyscrasias, leukaemia, lymphoma or other malignancy of the blood or lymphatic system; family history of congenital or hereditary immunodeficiency unless immune competence has been demonstrated. Refer.",
    });
  }

  // Exclusion: acute febrile illness (postpone)
  if (state.medicalHistory.severeFebrilIllness) {
    alerts.push({
      severity: "stop",
      code: "FEBRILE_ILLNESS",
      message: "Acute febrile illness",
      detail: "Exclusion: postpone in the case of moderate or severe illness with fever. Vaccinate after recovery.",
    });
  }

  // Exclusion: hypersensitivity to neomycin, gelatin or any component
  if (state.medicalHistory.anaphylaxisNeomycin) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_NEOMYCIN",
      message: "Hypersensitivity to neomycin",
      detail: "Exclusion: varicella vaccine contains neomycin.",
    });
  }

  if (state.medicalHistory.anaphylaxisGelatin) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_GELATIN",
      message: "Hypersensitivity to gelatin",
      detail: "Exclusion: varicella vaccine contains gelatin.",
    });
  }

  if (state.medicalHistory.hypersensitivityComponent) {
    alerts.push({
      severity: "stop",
      code: "HYPERSENSITIVITY_COMPONENT",
      message: "Hypersensitivity to any component of the vaccine",
      detail: "Exclusion. Refer.",
    });
  }

  // Exclusion: active untreated tuberculosis
  if (state.medicalHistory.activeTB) {
    alerts.push({
      severity: "stop",
      code: "ACTIVE_TB",
      message: "Active untreated tuberculosis",
      detail: "Exclusion: live vaccine should not be given. Refer for specialist advice.",
    });
  }

  // Exclusion: MMR or another live vaccine within the previous 4 weeks, unless same day
  if (state.medicalHistory.liveVaccineWithin4Weeks) {
    alerts.push({
      severity: "stop",
      code: "LIVE_VACCINE_4_WEEKS",
      message: "MMR or another live vaccine within the previous 4 weeks",
      detail: "Exclusion unless given on the same day. Give on the same day as MMR or other live vaccines, or 4 weeks apart.",
    });
  }

  // Caution: immunoglobulin or blood products in the previous 3 months
  if (state.medicalHistory.bloodProductsWithin3Months) {
    alerts.push({
      severity: "caution",
      code: "BLOOD_PRODUCTS_3_MONTHS",
      message: "Immunoglobulin or blood products in the previous 3 months",
      detail: "May reduce the response. Where protection is needed vaccinate now and consider a further dose after 3 months (Green Book); record the reason.",
    });
  }

  // Dose 2: interval check against dose 1
  if (state.vaccineAdmin.doseNumber === "2nd") {
    const dose1 = state.eligibility.dose1GivenElsewhere ? state.eligibility.dose1ElsewhereDate : "";
    const interval = daysBetween(dose1, state.vaccineAdmin.dose1Date);
    if (interval !== null && interval < 28) {
      alerts.push({
        severity: "stop",
        code: "DOSE_INTERVAL_TOO_SHORT",
        message: "Second dose less than 4 weeks after the first",
        detail: "Varivax: at least 4 weeks after the first. Varilrix: at least 6 weeks, and never less than 4 weeks.",
      });
    } else if (interval !== null && state.vaccineAdmin.vaccine === "Varilrix" && interval < 42) {
      alerts.push({
        severity: "caution",
        code: "VARILRIX_INTERVAL_SHORT",
        message: "Varilrix second dose less than 6 weeks after the first",
        detail: "The PGD gives at least 6 weeks after the first, and never less than 4 weeks. Record the reason if given between 4 and 6 weeks.",
      });
    }
  }

  // Post-vaccination rash with immunosuppressed contact
  if (state.postVaccine.rashDeveloped && state.postVaccine.contactWithImmunosuppressed) {
    alerts.push({
      severity: "red-flag",
      code: "RASH_IMMUNOSUPPRESSED_CONTACT",
      message: "Rash developed and contact with immunosuppressed person",
      detail: "Avoid contact with high-risk individuals (e.g. immunosuppressed) for 4 to 6 weeks if a rash develops post-vaccination.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}
