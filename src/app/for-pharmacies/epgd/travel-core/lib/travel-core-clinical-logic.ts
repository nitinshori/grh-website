import type { ClinicalAlert } from "../../shared/types";
import type {
  TravelCoreDestinationAssessment,
  TravelCoreMalariaRisk,
  TravelCoreVaccineAdministration,
} from "./travel-core-types";

// ─── Date helpers: calendar days, local midnight to local midnight ───

export function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysUntilDeparture(departureDate: string): number | null {
  const d = parseLocalDate(departureDate);
  if (!d) return null;
  return daysBetween(todayLocal(), d);
}

/** Days from the given date to today, or null when the date is missing or invalid. */
export function daysSince(iso: string): number | null {
  const d = parseLocalDate(iso);
  if (!d) return null;
  return daysBetween(d, todayLocal());
}

export function isExpired(expiry: string): boolean {
  const d = daysUntilDeparture(expiry);
  return d !== null && d < 0;
}

export function addDays(n: number, from: Date = todayLocal()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + n);
  return formatLocalDate(d);
}

export function addMonths(n: number, from: Date = todayLocal()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + n, from.getDate());
  return formatLocalDate(d);
}

export function addYears(n: number, from: Date = todayLocal()): string {
  const d = new Date(from.getFullYear() + n, from.getMonth(), from.getDate());
  return formatLocalDate(d);
}

// ─── Schedule intervals from the signed PGD (v006) ───

/** Hepatitis A booster: 6 to 12 months after the primary dose (Avaxim SPC allows up to 36 months). */
export const HEPA_BOOSTER_MIN_DAYS = 6 * 30;
export const HEPA_BOOSTER_MAX_DAYS_HAVRIX = 12 * 30;
export const HEPA_BOOSTER_MAX_DAYS_AVAXIM = 36 * 30;
/** Dukoral primary course: 2 doses 1 to 6 weeks apart; booster every 2 years. */
export const CHOLERA_DOSE2_MIN_DAYS = 7;
export const CHOLERA_DOSE2_MAX_DAYS = 42;
export const CHOLERA_BOOSTER_MAX_DAYS = 2 * 365;
/** Typhim Vi: revaccination every 3 years. */
export const TYPHOID_REVACCINATION_DAYS = 3 * 365;

export interface BoosterDue {
  vaccine: string;
  due: string;
  note: string;
}

/** Next dose or booster due for each vaccine given today. */
export function getBoosterDueDates(v: TravelCoreVaccineAdministration): BoosterDue[] {
  const out: BoosterDue[] = [];
  if (v.hepAGiven) {
    if (v.hepADose === "primary") {
      out.push({ vaccine: "Hepatitis A", due: addMonths(6), note: "Booster due 6 to 12 months after today's primary dose for long-term protection" });
    } else if (v.hepADose === "booster") {
      out.push({ vaccine: "Hepatitis A", due: "", note: "Course complete: long-term protection (10 years or more); no further routine booster" });
    }
  }
  if (v.typhoidGiven) {
    out.push({ vaccine: "Typhoid", due: addYears(3), note: "Revaccination every 3 years if continuing risk" });
  }
  if (v.choleraGiven) {
    if (v.choleraDose === "1") {
      out.push({ vaccine: "Cholera", due: addDays(7), note: "Dose 2 due 1 to 6 weeks after today (from the date shown, and no later than 6 weeks); complete at least 1 week before exposure" });
    } else if (v.choleraDose === "2" || v.choleraDose === "booster") {
      out.push({ vaccine: "Cholera", due: addYears(2), note: "Booster every 2 years if continuing risk; after 2 years the primary course is repeated" });
    }
  }
  return out;
}

/** Dose text per the signed PGD (v006). */
export function getVaccineDoseText(v: TravelCoreVaccineAdministration): string[] {
  const lines: string[] = [];
  if (v.hepAGiven) {
    const product =
      v.hepAProduct === "havrix"
        ? "Havrix Monodose 1440 EL.U/1.0 mL, 1.0 mL"
        : v.hepAProduct === "avaxim"
        ? "Avaxim 160 U/0.5 mL, 0.5 mL"
        : "Havrix 1.0 mL or Avaxim 0.5 mL";
    lines.push(
      `Hepatitis A: ${product} by intramuscular injection in the deltoid region. ${v.hepADose === "booster" ? "Booster dose at 6 to 12 months after the primary dose for long-term protection (10+ years)." : "Primary course: one dose. Booster required at 6 to 12 months."} Do not give intravenously or intradermally.`
    );
  }
  if (v.typhoidGiven) {
    lines.push(
      "Typhoid: Typhim Vi, typhoid Vi polysaccharide vaccine 25 mcg/0.5 mL, 0.5 mL single dose by intramuscular injection in the deltoid region. Revaccination every 3 years if continuing risk. Not protective against paratyphoid A or B; 70 to 80% protective effect."
    );
  }
  if (v.choleraGiven) {
    lines.push(
      `Cholera: Dukoral oral inactivated cholera vaccine (rCTB and inactivated whole cells). ${v.choleraDose === "booster" ? "Booster: single dose every 2 years if continuing risk." : `Primary course: 2 doses, 1 to 6 weeks apart (this is dose ${v.choleraDose || "?"}).`} Dissolve the buffer sachet in about 150 mL of cool water, add the whole 3 mL vial, drink within 2 hours. No food or drink for 1 hour before and 1 hour after; no other oral medicines within 1 hour either side. Complete the course at least 1 week before potential exposure.`
    );
  }
  return lines;
}

export function getVaccineAlerts(
  v: TravelCoreVaccineAdministration,
  age: number | null,
  departureDate: string
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const anyGiven = v.hepAGiven || v.typhoidGiven || v.choleraGiven;
  const injectable = v.hepAGiven || v.typhoidGiven;

  if (anyGiven && age !== null && age < 18) {
    alerts.push({
      severity: "stop",
      code: "VACC_UNDER_18",
      message: "Under 18: outside this PGD",
      detail: "The Hepatitis A, Typhoid and Cholera PGDs cover adults aged 18 years and over only.",
    });
  }
  if (anyGiven && v.hypersensitivity) {
    alerts.push({
      severity: "stop",
      code: "VACC_HYPERSENSITIVITY",
      message: "Known hypersensitivity to the vaccine or any excipient",
      detail: "Exclusion for every vaccine in this PGD (for Dukoral, including formaldehyde). Do not administer. Advise on alternatives and inform or refer to the GP.",
    });
  }
  if (anyGiven && v.acuteFebrileIllness) {
    alerts.push({
      severity: "stop",
      code: "VACC_FEBRILE",
      message: "Acute illness with fever",
      detail: "Exclusion: defer until recovered.",
    });
  }
  if (anyGiven && v.pregnant) {
    alerts.push({
      severity: "stop",
      code: "VACC_PREGNANCY",
      message: "Pregnancy",
      detail: "Exclusion for every vaccine in this PGD: seek specialist advice. Advise the patient to discuss the timing of vaccinations with the GP before travel.",
    });
  }
  if (v.choleraGiven && v.giSymptoms) {
    alerts.push({
      severity: "stop",
      code: "CHOLERA_GI",
      message: "Acute gastrointestinal symptoms: Dukoral excluded",
      detail: "Acute illness with fever or gastrointestinal symptoms is an exclusion for Dukoral. Defer until recovered.",
    });
  }
  if (v.choleraGiven && v.severeImmunocompromise) {
    alerts.push({
      severity: "stop",
      code: "CHOLERA_IMMUNO",
      message: "Severe immunocompromise: Dukoral excluded",
      detail: "Severe immunocompromise (current chemotherapy or other immunosuppressive therapy for malignancy; solid organ or bone marrow transplant within the previous 6 months; or systemic corticosteroids at 20 mg/day prednisolone or 2 mg/kg/day or more for 2 weeks or longer within the previous 4 weeks) is an exclusion for Dukoral under this PGD. The vaccine is inactivated but the response is likely to be inadequate: refer for specialist advice.",
    });
  }

  // Hepatitis A inclusion and schedule
  if (v.hepAGiven && v.hepAInclusionAnswer === "no") {
    alerts.push({
      severity: "stop",
      code: "HEPA_NO_INDICATION",
      message: "Hepatitis A inclusion criteria not met",
      detail: "Inclusion requires travel to an area of high or intermediate hepatitis A prevalence on current TravelHealthPro guidance. Do not give hepatitis A vaccine under this PGD: deselect it, or record the advice given and save as not supplied.",
    });
  }
  if (v.hepAGiven && v.hepAPreviousCompleteCourse) {
    // The document's inclusion ("no previous complete course") has no
    // exception for a booster: a completed course is primary plus booster.
    alerts.push({
      severity: "stop",
      code: "HEPA_COMPLETE_COURSE",
      message: "Previous complete Hepatitis A course (primary plus booster)",
      detail: "Inclusion requires no previous complete Hepatitis A vaccination course. A completed course gives long-term protection and no further dose is indicated under this PGD. If only the primary dose was given, untick this and record the dose as a booster with the primary dose date.",
    });
  }
  if (v.hepAGiven && v.hepAImmunityDocumented) {
    alerts.push({
      severity: "stop",
      code: "HEPA_IMMUNE",
      message: "Documented Hepatitis A immunity",
      detail: "Inclusion requires no documented evidence of Hepatitis A immunity. Vaccination is not indicated.",
    });
  }
  if (v.hepAGiven && v.hepADose === "booster") {
    const gap = daysSince(v.hepAPrimaryDoseDate);
    if (gap !== null) {
      const maxGap = v.hepAPrimaryProduct === "avaxim" ? HEPA_BOOSTER_MAX_DAYS_AVAXIM : HEPA_BOOSTER_MAX_DAYS_HAVRIX;
      if (gap < 0) {
        alerts.push({ severity: "stop", code: "HEPA_PRIMARY_FUTURE", message: "Hepatitis A primary dose date is in the future", detail: "Check the date of the primary dose." });
      } else if (gap < HEPA_BOOSTER_MIN_DAYS) {
        alerts.push({
          severity: "stop",
          code: "HEPA_BOOSTER_EARLY",
          message: `Hepatitis A booster not due: primary dose was ${gap} days ago`,
          detail: "The booster is given 6 to 12 months after the primary dose. Rebook from the due date; a booster given early is outside the schedule in this PGD.",
        });
      } else if (gap > maxGap) {
        alerts.push({
          severity: "caution",
          code: "HEPA_BOOSTER_LATE",
          message: `Hepatitis A booster is late: primary dose was ${Math.round(gap / 30)} months ago`,
          detail: `The schedule is 6 to 12 months (Avaxim: up to 36 months). The Green Book advises the second dose may be given without restarting the course; record the interval and the decision.`,
        });
      }
    }
  }

  // Typhoid inclusion and revaccination interval
  if (v.typhoidGiven && v.typhoidInclusionAnswer === "no") {
    alerts.push({
      severity: "stop",
      code: "TYPHOID_NO_INDICATION",
      message: "Typhoid inclusion criteria not met",
      detail: "Inclusion requires travel to an area of high or intermediate typhoid prevalence (South Asia, Southeast Asia, Africa, Central or South America) on current TravelHealthPro guidance. Do not give typhoid vaccine under this PGD: deselect it, or record the advice given and save as not supplied.",
    });
  }
  if (v.typhoidGiven && v.typhoidPreviousDose) {
    const gap = daysSince(v.typhoidPreviousDoseDate);
    if (gap !== null && gap >= 0 && gap < TYPHOID_REVACCINATION_DAYS) {
      alerts.push({
        severity: "stop",
        code: "TYPHOID_RECENT_DOSE",
        message: `Typhim Vi given ${Math.round(gap / 30)} months ago: revaccination is every 3 years`,
        detail: "Protection from the previous dose should still be in place and additional doses do not boost antibody levels further. Not indicated under this PGD.",
      });
    }
  }

  // Cholera inclusion and schedule
  if (v.choleraGiven && v.choleraInclusionAnswer === "no") {
    alerts.push({
      severity: "stop",
      code: "CHOLERA_NO_INDICATION",
      message: "Cholera inclusion criteria not met",
      detail: "Dukoral is for travel to areas with active cholera transmission or at high risk, humanitarian, healthcare or occupational exposure, or planned extended stays in endemic areas with poor sanitation. Do not give Dukoral under this PGD: deselect it, or record the advice given and save as not supplied.",
    });
  }
  if (v.choleraGiven && v.choleraDose === "2") {
    const gap = daysSince(v.choleraDose1Date);
    if (gap !== null) {
      if (gap < 0) {
        alerts.push({ severity: "stop", code: "CHOLERA_DOSE1_FUTURE", message: "Dukoral dose 1 date is in the future", detail: "Check the date of dose 1." });
      } else if (gap < CHOLERA_DOSE2_MIN_DAYS) {
        alerts.push({
          severity: "stop",
          code: "CHOLERA_DOSE2_EARLY",
          message: `Dukoral dose 2 not due: dose 1 was ${gap} days ago`,
          detail: "The primary course is 2 doses at least 1 week apart. Rebook from day 7.",
        });
      } else if (gap > CHOLERA_DOSE2_MAX_DAYS) {
        alerts.push({
          severity: "caution",
          code: "CHOLERA_RESTART",
          message: `More than 6 weeks since Dukoral dose 1 (${gap} days): restart the primary course`,
          detail: "The SPC requires the primary course to be restarted when more than 6 weeks have elapsed between doses. Record today's dose as dose 1 of a new course.",
        });
      }
    }
  }
  if (v.choleraGiven && v.choleraDose === "booster") {
    const gap = daysSince(v.choleraLastCourseDate);
    if (gap !== null && gap > CHOLERA_BOOSTER_MAX_DAYS) {
      alerts.push({
        severity: "caution",
        code: "CHOLERA_BOOSTER_LATE",
        message: `More than 2 years since the last Dukoral course (${Math.round(gap / 30)} months): repeat the primary course`,
        detail: "The SPC: if more than 2 years have elapsed since the last vaccination, the primary course (2 doses) should be repeated. Record today's dose as dose 1 of a new course.",
      });
    }
  }

  // Expired stock
  if (v.hepAGiven && isExpired(v.hepAExpiry))
    alerts.push({ severity: "stop", code: "HEPA_EXPIRED", message: "Hepatitis A vaccine batch has expired", detail: "Do not administer. Quarantine the stock and select an in-date batch." });
  if (v.typhoidGiven && isExpired(v.typhoidExpiry))
    alerts.push({ severity: "stop", code: "TYPHOID_EXPIRED", message: "Typhim Vi batch has expired", detail: "Do not administer. Quarantine the stock and select an in-date batch." });
  if (v.choleraGiven && isExpired(v.choleraExpiry))
    alerts.push({ severity: "stop", code: "CHOLERA_EXPIRED", message: "Dukoral batch has expired", detail: "Do not administer. Quarantine the stock and select an in-date batch." });

  if (anyGiven && v.immunocompromised) {
    alerts.push({
      severity: "caution",
      code: "VACC_IMMUNOCOMPROMISED",
      message: "Immunosuppression below the exclusion threshold: reduced response possible",
      detail: "Caution: the vaccines may be given but the response may be reduced; seek specialist advice where the degree of immunosuppression is uncertain, and advise that food and water precautions remain essential. (Severe immunocompromise, as defined in the exclusion list, excludes Dukoral.)",
    });
  }
  if (injectable && v.bleedingDisorder) {
    alerts.push({
      severity: "caution",
      code: "VACC_BLEEDING",
      message: "Thrombocytopenia, bleeding disorder or anticoagulation",
      detail: "Not a contraindication. Use a fine needle and apply firm pressure for 2 minutes; Havrix may be given deep subcutaneous where local guidance requires.",
    });
  }
  if (v.choleraGiven && v.recentAntibiotics) {
    alerts.push({
      severity: "caution",
      code: "CHOLERA_ANTIBIOTICS",
      message: "Recent antibiotics for enteric infection",
      detail: "Antibiotics (if recently prescribed for enteric infection) may reduce Dukoral effectiveness.",
    });
  }
  const days = daysUntilDeparture(departureDate);
  if (anyGiven && days !== null && days < 0) {
    alerts.push({
      severity: "caution",
      code: "DEPARTURE_PAST",
      message: "The departure date is in the past",
      detail: "Check the travel dates. If the traveller has already departed, record why vaccination is being given now (for example completing a course).",
    });
  }
  if (injectable && days !== null && days >= 0 && days < 14) {
    alerts.push({
      severity: "caution",
      code: "VACC_TIMING",
      message: "Less than 2 weeks before departure",
      detail: "Hepatitis A and typhoid vaccines should be given at least 2 weeks before departure. Explain that protection may be incomplete and record the advice.",
    });
  }
  if (v.choleraGiven && v.choleraDose !== "booster" && days !== null && days >= 0 && days < (v.choleraDose === "2" ? 7 : 14)) {
    alerts.push({
      severity: "caution",
      code: "CHOLERA_TIMING",
      message: "Dukoral course may not complete in time",
      detail: "The 2 dose primary course (1 to 6 weeks apart) must be completed at least 1 week before potential exposure. Confirm the dates.",
    });
  }

  return alerts;
}

export function getDestinationAlerts(
  destination: TravelCoreDestinationAssessment
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  if (destination.isEndemicMalariaZone && !destination.vaccinationRequirementsIdentified) {
    alerts.push({
      severity: "caution",
      code: "MALAR_NO_VACC_CHECK",
      message: "Malaria endemic zone: ensure vaccination requirements checked",
      detail: "Destination is in malaria-endemic area. Vaccination status should be reviewed.",
    });
  }

  if (destination.foodWaterRiskLevel === "high") {
    alerts.push({
      severity: "caution",
      code: "FOOD_WATER_HIGH",
      message: "High food/water risk: ensure traveller is counselled",
      detail: "Destination has high risk of food/waterborne illness. Precautions essential.",
    });
  }

  if (destination.sunExposureRisk === "high") {
    alerts.push({
      severity: "caution",
      code: "SUN_EXPOSURE_HIGH",
      message: "High sun exposure risk: ensure sun protection advised",
      detail: "Destination has high UV exposure. Sunscreen and protective clothing essential.",
    });
  }

  return alerts;
}

export function getMalariaRiskAlerts(
  malariaRisk: TravelCoreMalariaRisk
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // An unanswered chemoprophylaxis plan is a validation message on the
  // malaria step (validateMalariaRisk names the control), not a red flag
  // raised from a select still at its default (stop audit, 11 Sep 2026).
  void malariaRisk;

  return alerts;
}

export function getAllAlerts(
  destination: TravelCoreDestinationAssessment,
  malariaRisk: TravelCoreMalariaRisk,
  vaccines?: TravelCoreVaccineAdministration,
  age: number | null = null
): ClinicalAlert[] {
  return [
    ...getDestinationAlerts(destination),
    ...getMalariaRiskAlerts(malariaRisk),
    ...(vaccines ? getVaccineAlerts(vaccines, age, destination.departureDate) : []),
  ];
}

export function calculateTravelDuration(
  departureDate: string,
  returnDate: string
): number | null {
  const departure = parseLocalDate(departureDate);
  const returnD = parseLocalDate(returnDate);
  if (!departure || !returnD) return null;
  return daysBetween(departure, returnD);
}

export function assessMalariaRisk(destination: string, zone: boolean): string {
  if (!zone) return "Low risk";
  if (destination.toLowerCase().includes("africa")) return "High risk - Sub-Saharan Africa";
  if (destination.toLowerCase().includes("asia")) return "Moderate risk - Southeast Asia";
  if (destination.toLowerCase().includes("caribbean")) return "Low-moderate risk - Caribbean";
  return "Moderate risk";
}
