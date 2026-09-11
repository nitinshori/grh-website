// ─── Meningitis B Clinical Logic ───

import type { MeningitiBConsultationState } from "./meningitis-b-types";
import type { ClinicalAlert } from "../../shared/types";

/** Whole months between the date of birth and today. Null when missing or invalid. */
export function calculateAgeInMonths(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months--;
  return months;
}

/** Whole days since an ISO date. Null when blank or invalid. */
export function daysSince(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((b - a) / 86400000);
}

/** True where the patient is in one of the PGD's increased-risk groups (Trumenba 3 dose schedule). */
export function isIncreasedRisk(state: MeningitiBConsultationState): boolean {
  const r = state.riskAssessment;
  return r.asplenia || r.complementDeficiency || r.complementInhibitor || r.laboratoryStaff;
}

/**
 * Minimum days between the previous dose and this one, per product and
 * schedule. Every MenB schedule in the PGD is interval-defined; the tool used
 * to validate only which label was allowed.
 */
export function minimumIntervalDays(
  product: "bexsero" | "trumenba" | "",
  trumenbaSchedule: "routine" | "increased-risk" | "",
  doseNumber: "1st" | "2nd" | "3rd" | "booster-12-months" | ""
): { days: number; label: string } | null {
  if (product === "bexsero") {
    if (doseNumber === "2nd") return { days: 28, label: "at least 4 weeks (1 month) after the 1st dose" };
    if (doseNumber === "booster-12-months") return { days: 61, label: "at least 2 months after the last primary dose, at 12 months of age" };
    return null;
  }
  if (product === "trumenba") {
    if (trumenbaSchedule === "routine" && doseNumber === "2nd") return { days: 168, label: "6 months after the 1st dose" };
    if (trumenbaSchedule === "increased-risk" && doseNumber === "2nd") return { days: 28, label: "1 to 2 months after the 1st dose" };
    if (trumenbaSchedule === "increased-risk" && doseNumber === "3rd") return { days: 120, label: "at 6 months from the 1st dose (about 4 months after the 2nd)" };
    return null;
  }
  return null;
}

/** True when any PGD indication has been recorded. */
export function hasIndication(state: MeningitiBConsultationState): boolean {
  const r = state.riskAssessment;
  return (
    r.missedRoutineDoses ||
    r.universityFresher ||
    r.asplenia ||
    r.complementDeficiency ||
    r.complementInhibitor ||
    r.laboratoryStaff ||
    r.otherIndication.trim().length > 0
  );
}

/** Schedule text for the product and age, per the PGD schedule table. */
export function getScheduleText(product: "bexsero" | "trumenba" | "", ageMonths: number | null): string {
  if (product === "trumenba") {
    return "Trumenba (MenB-fHbp), from 10 years: 0.5 mL intramuscular, deltoid. Routine use: 2 doses at 0 and 6 months. Individuals at increased risk (asplenia, complement disorder, complement inhibitor, laboratory staff): 3 doses at 0, 1 to 2 months, and 6 months. Outbreak management is a Health Protection Team matter and an exclusion under this PGD.";
  }
  if (product === "bexsero") {
    if (ageMonths === null) return "Bexsero (4CMenB), from 2 months: 0.5 mL intramuscular. Enter the date of birth for the schedule.";
    if (ageMonths < 12) {
      return "Bexsero, infant under 12 months outside the NHS programme: 2 doses at least 4 weeks apart, followed by a booster at 12 months. 0.5 mL intramuscular into the anterolateral thigh.";
    }
    if (ageMonths < 24) {
      return "Bexsero, 12 months to under 2 years who had fewer than 2 doses in the first year: 2 further doses at least 4 weeks apart. 0.5 mL intramuscular; anterolateral thigh at 1 year and under, deltoid thereafter.";
    }
    return "Bexsero, aged 2 years and over including adolescents and adults: 2 doses at least 1 month apart. 0.5 mL intramuscular, deltoid.";
  }
  return "Choose the product first, then follow that product's schedule. Do not mix schedules between products. Where a course has been started with one product, complete it with the same product wherever possible.";
}

export function getAllAlerts(state: MeningitiBConsultationState): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const ageMonths = calculateAgeInMonths(state.patient.dateOfBirth);

  // Exclusion: aged under 2 months
  if (ageMonths !== null && ageMonths < 2) {
    alerts.push({
      severity: "stop",
      code: "AGE_UNDER_2_MONTHS",
      message: "Aged under 2 months",
      detail: "Exclusion. Bexsero is licensed from 2 months of age; Trumenba from 10 years. Direct the family to the NHS routine infant programme.",
    });
  }

  // Exclusion: anaphylaxis to previous dose of the same vaccine, any component or manufacturing residue
  if (state.medicalHistory.anaphylaxisHistory) {
    alerts.push({
      severity: "stop",
      code: "ANAPHYLAXIS_HISTORY",
      message: "Confirmed anaphylactic reaction to a previous dose of the same vaccine, any component, or a manufacturing residue",
      detail: "Exclusion. Do not vaccinate under this PGD; refer.",
    });
  }

  // Exclusion: acute severe febrile illness (postpone)
  if (state.medicalHistory.severeFebrilIllness) {
    alerts.push({
      severity: "stop",
      code: "FEBRILE_ILLNESS",
      message: "Acute severe febrile illness",
      detail: "Exclusion: postpone until recovered. A minor illness without fever or systemic upset is not a reason to postpone.",
    });
  }

  // Exclusion: request for travel purposes
  if (state.riskAssessment.hyperendemicArea) {
    alerts.push({
      severity: "stop",
      code: "TRAVEL_REQUEST",
      message: "Request for MenB vaccination for travel purposes",
      detail: "Exclusion. MenB is not recommended for travel; assess for MenACWY under the relevant PGD instead, including for Hajj and Umrah where a certificate is a visa requirement.",
    });
  }

  // Exclusion: case, contact or outbreak management
  if (state.riskAssessment.closeContactOfCase) {
    alerts.push({
      severity: "stop",
      code: "CASE_CONTACT_OUTBREAK",
      message: "Management of a case, contact or outbreak of meningococcal disease",
      detail: "Exclusion. This is directed by the local Health Protection Team and is outside this PGD. Refer.",
    });
  }

  // Caution: infant paracetamol prophylaxis with Bexsero
  if (ageMonths !== null && ageMonths < 12) {
    alerts.push({
      severity: "caution",
      code: "INFANT_PARACETAMOL",
      message: "Infant under one year: prophylactic paracetamol with Bexsero",
      detail: "Fever is common. Give 2.5 ml of infant paracetamol 120mg/5ml as soon as possible after vaccination, a second dose after 4 to 6 hours and a third 4 to 6 hours after that. Ibuprofen is less effective and is not recommended. Advise the parent or carer to seek medical advice if the child is noticeably unwell with a fever, or if fever occurs at other times. Give written paracetamol advice.",
    });
  }

  // Caution: asplenia, complement disorders, complement inhibitor therapy
  if (state.riskAssessment.asplenia || state.riskAssessment.complementDeficiency || state.riskAssessment.complementInhibitor) {
    alerts.push({
      severity: "caution",
      code: "INCREASED_RISK_GROUP",
      message: "Asplenia, splenic dysfunction, complement disorder or complement inhibitor therapy",
      detail: "Vaccinate, and involve the specialist team. Individuals due to start a complement inhibitor should be vaccinated at least 2 weeks before treatment begins; where treatment starts less than 2 weeks after vaccination, prophylactic antibiotics are required until 2 weeks after the vaccine. The need for and timing of booster doses in at-risk individuals has not been determined. Make any referral clear and timely.",
    });
  }

  // Caution: immunosuppression and HIV
  if (state.medicalHistory.immunosuppressed) {
    alerts.push({
      severity: "caution",
      code: "IMMUNOSUPPRESSED",
      message: "Immunosuppression or HIV, regardless of CD4 count",
      detail: "Vaccinate in accordance with the routine schedule, but the individual may not make a full antibody response. Re-immunisation may be considered after treatment finishes; specialist advice may be required. Not a reason to withhold vaccination.",
    });
  }

  // Caution: pregnancy and breastfeeding
  if (state.medicalHistory.pregnancy || state.medicalHistory.breastfeeding) {
    alerts.push({
      severity: "caution",
      code: "PREGNANCY_BREASTFEEDING",
      message: state.medicalHistory.pregnancy ? "Pregnancy" : "Breastfeeding",
      detail: "Meningococcal vaccines may be given when clinically indicated. There is no evidence of risk from vaccinating pregnant or breastfeeding women with inactivated vaccines.",
    });
  }

  // Caution: previous systemic or local reaction does not prevent further doses
  if (state.medicalHistory.previousReaction) {
    alerts.push({
      severity: "caution",
      code: "PREVIOUS_REACTION",
      message: "Previous systemic or local reaction to a meningococcal vaccine",
      detail: "Fever of any severity, a hypotonic-hyporesponsive episode, persistent crying for more than 3 hours, a severe local reaction of any extent, or a convulsion within 3 days does not prevent further doses.",
    });
  }

  // Recent other vaccination (co-administration)
  if (state.medicalHistory.recentVaccination) {
    alerts.push({
      severity: "caution",
      code: "RECENT_VACCINATION",
      message: "Recent or same-day other vaccination",
      detail: "May be given at the same time as any other vaccine required, at a separate site, preferably a different limb, or at least 2.5 cm apart in the same limb. Record the site of each.",
    });
  }

  // Indication missing
  if (!hasIndication(state)) {
    alerts.push({
      severity: "red-flag",
      code: "NO_INDICATION",
      message: "No PGD indication recorded",
      detail: "Inclusion requires protection against meningococcal group B disease: routine doses missed or presenting outside the NHS programme, an adolescent or student seeking protection, or an adult at increased risk.",
    });
  }

  return alerts;
}

export function hasHardStops(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === "stop");
}
