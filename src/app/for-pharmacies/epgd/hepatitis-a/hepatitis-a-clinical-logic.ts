import type { ClinicalAlert } from '../shared/types';
import type {
  AgeBand,
  DoseNumber,
  FirstDoseProduct,
  HepatitisAConsent,
  HepatitisACourse,
  HepatitisAIndication,
  HepatitisAMedicalHistory,
  HepatitisAPatientDetails,
  HepatitisAProduct,
  HepatitisASummary,
} from './hepatitis-a-types';
import { PRODUCTS, HEPATITIS_A_PGD_VERSION } from './hepatitis-a-types';

export { HEPATITIS_A_PGD_VERSION };

// ─── Dates ───

/** Parse a yyyy-mm-dd string as local midnight (never UTC). */
export function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** yyyy-mm-dd from local date parts (toISOString shifts a day between
 *  midnight and 01:00 BST). */
export function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Calendar days from today to the date, local midnight to local midnight,
 *  so a departure exactly 14 days away is 14, not 13. */
export function daysUntil(iso: string): number | null {
  const target = parseLocalDate(iso);
  if (!target) return null;
  return Math.round((target.getTime() - todayLocal().getTime()) / (1000 * 60 * 60 * 24));
}

/** True when the expiry date (yyyy-mm-dd) is before today. */
export function isExpired(expiryDate: string): boolean {
  const d = daysUntil(expiryDate);
  return d !== null && d < 0;
}

/** Whole calendar months from one date to another (negative when `to` is
 *  before `from`). A first dose on 20 March is 6 months ago on 20 September,
 *  not on 19 September. */
export function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
}

export function addMonths(d: Date, months: number): Date {
  const result = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  // Month overflow (31 Jan plus 1 month) rolls to the last day of the target month.
  if (result.getDate() !== d.getDate()) result.setDate(0);
  return result;
}

/** Months since the first dose, or null when the date is blank or invalid. */
export function monthsSinceFirstDose(firstDoseDate: string): number | null {
  const first = parseLocalDate(firstDoseDate);
  if (!first) return null;
  return monthsBetween(first, todayLocal());
}

// ─── Schedule ───

/** Second dose 6 to 12 months after the first (document: "Dose and frequency"). */
export const SECOND_DOSE_MIN_MONTHS = 6;
export const SECOND_DOSE_MAX_MONTHS = 12;

/** The window in which the second dose is due, counted from today (a first
 *  dose given today). */
export function secondDoseWindow(from: Date = todayLocal()): { earliest: string; latest: string } {
  return {
    earliest: formatLocalDate(addMonths(from, SECOND_DOSE_MIN_MONTHS)),
    latest: formatLocalDate(addMonths(from, SECOND_DOSE_MAX_MONTHS)),
  };
}

/** Age band for the product: 16 and over adult, 1 to 15 inclusive junior,
 *  null under 1 (no product is licensed) or when the age is unknown. */
export function ageBandFor(age: number | null): AgeBand | null {
  if (age === null || age < 1) return null;
  return age >= 16 ? 'adult' : 'junior';
}

/** The products the document allows for this age, in the order listed. */
export function productsForAge(age: number | null): Exclude<HepatitisAProduct, ''>[] {
  const band = ageBandFor(age);
  if (!band) return [];
  return (Object.keys(PRODUCTS) as Exclude<HepatitisAProduct, ''>[]).filter(
    (p) => PRODUCTS[p].ageBand === band
  );
}

/** Which dose today is, from the course status and the completed-course exception. */
export function doseNumberFor(course: HepatitisACourse): DoseNumber {
  switch (course.courseStatus) {
    case 'none':
      return 'first';
    case 'one-dose':
      return 'second';
    case 'completed':
      return course.completedCourseOngoingRisk25Years ? 'booster-25-years' : '';
    default:
      return '';
  }
}

export interface LateDoseAssessment {
  months: number | null;
  /** Product whose SmPC window is applied. */
  windowProduct: Exclude<HepatitisAProduct, ''> | null;
  windowMonths: number | null;
  windowLabel: string;
  tooEarly: boolean;
  /** More than 12 months but still within the licensed window. */
  late: boolean;
  beyondWindow: boolean;
}

/**
 * Timing of a second dose against the document's per-product windows.
 *
 * The window is that of the product the course was started with (the
 * document states each window "after the first dose" by product, and asks
 * for the course to be completed with the same product where possible).
 * Where the first dose was another brand, the document gives no window, so
 * the window of the product being given today is applied: its SmPC is the
 * only one in the document that can speak to the booster.
 */
export function assessSecondDoseTiming(
  firstDoseProduct: FirstDoseProduct,
  firstDoseDate: string,
  productToday: HepatitisAProduct
): LateDoseAssessment {
  const months = monthsSinceFirstDose(firstDoseDate);
  const windowProduct: Exclude<HepatitisAProduct, ''> | null =
    firstDoseProduct && firstDoseProduct !== 'other'
      ? firstDoseProduct
      : productToday || null;
  const info = windowProduct ? PRODUCTS[windowProduct] : null;
  const windowMonths = info ? info.secondDoseWindowMonths : null;
  const tooEarly = months !== null && months < SECOND_DOSE_MIN_MONTHS;
  const beyondWindow = months !== null && windowMonths !== null && months > windowMonths;
  const late = months !== null && months > SECOND_DOSE_MAX_MONTHS && !beyondWindow;
  return {
    months,
    windowProduct,
    windowMonths,
    windowLabel: info ? `${info.shortName}: ${info.windowLabel}` : '',
    tooEarly,
    late,
    beyondWindow,
  };
}

/** Bleeding caution applies to a stated bleeding disorder, thrombocytopenia
 *  or anticoagulation, and to haemophilia receiving plasma-derived clotting
 *  factors recorded as the indication (Green Book: subcutaneous route). */
export function bleedingCautionApplies(
  indication: HepatitisAIndication,
  medicalHistory: HepatitisAMedicalHistory
): boolean {
  return medicalHistory.bleedingDisorder || indication.haemophiliaClottingFactors;
}

// ─── Alerts ───

export function getHepatitisAClinicalAlerts(
  patient: HepatitisAPatientDetails,
  consent: HepatitisAConsent,
  indication: HepatitisAIndication,
  course: HepatitisACourse,
  medicalHistory: HepatitisAMedicalHistory,
  summary: HepatitisASummary
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];

  // ── Exclusions (stop) ──

  // A negative age is a date of birth in the future, not an infant: the
  // patient step asks for the date to be checked rather than excluding.
  if (patient.age !== null && patient.age >= 0 && patient.age < 1) {
    alerts.push({
      severity: 'stop',
      code: 'UNDER_1',
      message: 'Under 1 year of age',
      detail:
        'Excluded. None of the products is licensed below 1 year. Refer to the GP or a travel clinic; give food and water hygiene advice for the destination.',
    });
  }

  if (consent.patientDeclined) {
    alerts.push({
      severity: 'stop',
      code: 'PATIENT_DECLINED',
      message: 'Patient declines vaccination after counselling',
      detail:
        'Not vaccinated. Discuss the decision with the patient and make sure they understand it. Give food and water hygiene advice for the destination regardless. Document the advice given and the decision reached, and inform or refer to the GP as appropriate. Where hepatitis B is also needed, offer the Hepatitis A and B (Travel) consultation instead.',
    });
  }

  if (patient.consentBasis === 'unobtainable') {
    alerts.push({
      severity: 'stop',
      code: 'CONSENT_UNOBTAINABLE',
      message: 'Under 16: valid consent cannot be obtained',
      detail:
        'Excluded. Valid consent cannot be obtained from a person with parental responsibility, and the young person is not assessed as Gillick competent. A parent accompanying a child does not automatically hold parental responsibility. Refer to the GP or a travel clinic, or arrange for a person with parental responsibility to attend.',
    });
  }

  if (indication.indicationType === 'none') {
    alerts.push({
      severity: 'stop',
      code: 'NO_INDICATION',
      message: 'No indication under this PGD',
      detail:
        'Inclusion requires travel to an area of moderate or high hepatitis A endemicity, or a non-travel risk factor: chronic liver disease including chronic hepatitis B or C, haemophilia or receipt of plasma-derived clotting factors, injecting drug use, gay, bisexual and other men who have sex with men, or an occupational risk. Immunisation is not generally needed for northern or western Europe, North America, Australia or New Zealand. Give food and water hygiene advice, record the decision, and refer to a travel clinic or the GP if vaccination is still wanted.',
    });
  }

  if (indication.postExposure === 'yes') {
    alerts.push({
      severity: 'stop',
      code: 'POST_EXPOSURE',
      message: 'Post-exposure situation: contact of a case, or exposure in an outbreak',
      detail:
        'Excluded. Hepatitis A vaccine given to a contact of a case is a public health intervention with its own timing rules and, for some contacts, immunoglobulin. Refer to the GP or the local Health Protection Team the same day, and make the urgency explicit.',
    });
  }

  if (indication.hepBDecision === 'use-combined-pgd') {
    alerts.push({
      severity: 'stop',
      code: 'USE_HEP_AB_PGD',
      message: 'Patient also needs hepatitis B: better served by the Hepatitis A and B (Travel) PGD',
      detail:
        'Not vaccinated under this PGD. The Hepatitis A and B (Travel) PGD authorises Twinrix and Engerix B as well as the products here, so one consultation covers both. Record the decision here and continue in that tool.',
    });
  }

  if (indication.proofOfImmunityRequired) {
    alerts.push({
      severity: 'stop',
      code: 'PROOF_OF_IMMUNITY',
      message: 'Patient requires proof of immunity',
      detail:
        'Excluded. Serology to confirm immunity, before or after vaccination, is out of scope. Refer to the GP or a travel clinic.',
    });
  }

  if (course.courseStatus === 'completed' && !course.completedCourseOngoingRisk25Years) {
    alerts.push({
      severity: 'stop',
      code: 'COMPLETED_COURSE',
      message: 'A completed two dose course of hepatitis A vaccine',
      detail:
        'Excluded. Someone who completed a two dose course, at any time in the past, does not need a further dose under this PGD unless they are at ongoing risk and 25 years have passed. There is nothing to add: reassure, give food and water hygiene advice, and record what the patient told you.',
    });
  }

  if (course.courseStatus === 'one-dose' && course.firstDoseDateKnown === 'known') {
    const months = monthsSinceFirstDose(course.firstDoseDate);
    if (months !== null && months >= 0 && months < SECOND_DOSE_MIN_MONTHS) {
      alerts.push({
        severity: 'stop',
        code: 'SECOND_DOSE_TOO_EARLY',
        message: 'Too early: second dose is 6 to 12 months after the first',
        detail:
          `The first dose was ${months} ${months === 1 ? 'month' : 'months'} ago. Inclusion for a second dose requires a first dose 6 months or more ago. Book the second dose for 6 to 12 months after the first; a single dose protects for at least 12 months.`,
      });
    }
  }

  if (medicalHistory.anaphylaxisHepAVaccineOrComponent) {
    alerts.push({
      severity: 'stop',
      code: 'ANAPHYLAXIS',
      message: 'Confirmed anaphylactic reaction to a previous dose of a hepatitis A-containing vaccine, or to any component',
      detail: 'Excluded. Refer, do not vaccinate. Inform the GP.',
    });
  }

  if (medicalHistory.neomycinHypersensitivity) {
    alerts.push({
      severity: 'stop',
      code: 'NEOMYCIN',
      message: 'Neomycin hypersensitivity',
      detail:
        'Excluded. Havrix and Avaxim may contain trace neomycin, so a neomycin hypersensitivity excludes every product under this PGD. Refer to the GP or a travel clinic.',
    });
  }

  if (medicalHistory.previousHypersensitivityReaction) {
    alerts.push({
      severity: 'stop',
      code: 'PREVIOUS_HYPERSENSITIVITY',
      message: 'Previous hypersensitivity reaction following a hepatitis A-containing vaccine',
      detail: 'Excluded. Refer, do not vaccinate. Inform the GP.',
    });
  }

  if (medicalHistory.acuteSevereFebrileIllness) {
    alerts.push({
      severity: 'stop',
      code: 'FEBRILE_ILLNESS',
      message: 'Acute severe febrile illness',
      detail:
        'Postpone until recovered. Minor illness without fever or systemic upset is not a reason to defer. Advise the patient to return when well; give food and water hygiene advice for the destination.',
    });
  }

  // ── Cautions (warn, capture, do not stop) ──

  if (course.courseStatus === 'completed' && course.completedCourseOngoingRisk25Years) {
    alerts.push({
      severity: 'caution',
      code: 'BOOSTER_AFTER_25_YEARS',
      message: 'Completed course, ongoing risk and 25 years have passed: booster dose',
      detail:
        `The document's exception to the completed-course exclusion. Recorded: ${course.completedCourseNote.trim() || 'not yet recorded'}.`,
    });
  }

  if (course.courseStatus === 'one-dose' && course.firstDoseDateKnown === 'not-known') {
    alerts.push({
      severity: 'caution',
      code: 'FIRST_DOSE_DATE_NOT_KNOWN',
      message: 'Date of the first dose not known',
      detail:
        'Inclusion for a second dose requires a first dose 6 months or more ago, with the product and date known or reliably reported. Record what the patient reports and confirm it was 6 months or more ago. The licensed window cannot be checked against a date; a late second dose still counts and the course is not restarted.',
    });
  }

  if (course.courseStatus === 'one-dose' && course.firstDoseDateKnown === 'known') {
    const timing = assessSecondDoseTiming(course.firstDoseProduct, course.firstDoseDate, summary.product);
    if (timing.late) {
      alerts.push({
        severity: 'caution',
        code: 'LATE_SECOND_DOSE',
        message: 'Late second dose: give it, do not restart',
        detail:
          `${timing.months} months since the first dose. Within licence (${timing.windowLabel}). Successful boosting occurs even when the second dose is delayed for several years.`,
      });
    }
    if (timing.beyondWindow) {
      alerts.push({
        severity: 'caution',
        code: 'SECOND_DOSE_OFF_LABEL',
        message: 'Second dose beyond the licensed window: informed off-label decision',
        detail:
          `${timing.months} months since the first dose; the licensed window is ${timing.windowLabel}. A booster is generally still effective. Give it rather than declining, and record it as an informed off-label decision explained to the patient.`,
      });
    }
  }

  if (indication.hepBAlsoNeeded === 'yes' && indication.hepBDecision === 'continue-hep-a-only') {
    alerts.push({
      severity: 'caution',
      code: 'HEP_B_ALSO_NEEDED',
      message: 'Hepatitis B also needed: continuing with hepatitis A only',
      detail:
        'The Hepatitis A and B (Travel) PGD would cover both in one consultation. Recorded decision to continue with hepatitis A only. Counsel that this vaccine does not protect against hepatitis B or C.',
    });
  }

  const days = daysUntil(indication.departureDate);
  if ((indication.indicationType === 'travel' || indication.indicationType === 'both') && days !== null) {
    if (days >= 0 && days < 14) {
      alerts.push({
        severity: 'caution',
        code: 'DEPARTING_WITHIN_2_WEEKS',
        message: 'Departing within 2 weeks',
        detail:
          `${days} ${days === 1 ? 'day' : 'days'} to departure. Give the dose: some protection develops before antibody is detectable and it can be given up to the day of travel. Be explicit that full protection comes after about 2 weeks.`,
      });
    }
    if (days < 0) {
      alerts.push({
        severity: 'caution',
        code: 'DEPARTURE_DATE_PASSED',
        message: 'Departure date has already passed',
        detail: 'Check the date. Vaccination may still be appropriate if travel has not yet commenced.',
      });
    }
  }

  if (medicalHistory.pregnant) {
    alerts.push({
      severity: 'caution',
      code: 'PREGNANCY',
      message: 'Pregnancy',
      detail:
        'Hepatitis A vaccine may be given where clearly indicated; the vaccines are inactivated. Havrix is preferred. The Avaxim SmPC advises use only when clearly necessary after an assessment of risks and benefits, and that assessment must be recorded.',
    });
  }

  if (medicalHistory.breastfeeding) {
    alerts.push({
      severity: 'caution',
      code: 'BREASTFEEDING',
      message: 'Breastfeeding',
      detail:
        'No contraindication. Both Avaxim products may be used during breastfeeding and there is no established concern with Havrix. Record the decision.',
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSION',
      message: 'Immunosuppression, including HIV',
      detail:
        'The response may be reduced and relates to CD4 count. Vaccination is still recommended. Where the patient needs to know whether they responded, that requires serology and is outside this PGD: counsel and refer rather than assuming protection. Record the counselling.',
    });
  }

  if (bleedingCautionApplies(indication, medicalHistory)) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message: indication.haemophiliaClottingFactors
        ? 'Haemophilia receiving plasma-derived clotting factors'
        : 'Bleeding disorder, thrombocytopenia or anticoagulation',
      detail: indication.haemophiliaClottingFactors
        ? 'The Green Book advises the subcutaneous route for people with haemophilia receiving plasma-derived clotting factors. Otherwise intramuscular injection with a fine needle, 23 gauge or finer, and firm pressure without rubbing for at least 2 minutes.'
        : 'Intramuscular injection can usually still be given using a fine needle, 23 gauge or finer, with firm pressure without rubbing for at least 2 minutes. Deep subcutaneous injection is the fallback.',
    });
  }

  if (medicalHistory.phenylketonuria) {
    alerts.push({
      severity: 'caution',
      code: 'PHENYLKETONURIA',
      message: 'Phenylketonuria',
      detail:
        'Havrix and Avaxim contain phenylalanine, 10 micrograms per 0.5 mL dose of Avaxim. At that quantity almost certainly immaterial, but advise the patient, parent or carer to account for it in meal planning on the day.',
    });
  }

  if (medicalHistory.latexSensitivity) {
    alerts.push({
      severity: 'caution',
      code: 'LATEX',
      message: 'Latex sensitivity',
      detail:
        'The needle shield of the attached-needle presentation of adult Avaxim may contain natural rubber: check the presentation in hand before use. The Avaxim Junior needle shield is polyisoprene. Havrix presentations are described as free of natural latex; check the current leaflet before reassuring a latex-allergic patient.',
    });
  }

  return alerts;
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}

/** Administration guidance for the product chosen (document: "Route and
 *  method of administration", "Quantity to be administered"). */
export function getAdministrationGuidance(product: HepatitisAProduct): { vaccineName: string; volume: string; guidance: string } {
  if (!product) return { vaccineName: '', volume: '', guidance: '' };
  const info = PRODUCTS[product];
  return {
    vaccineName: info.label,
    volume: info.volume,
    guidance:
      `One dose of ${info.volume} per patient per attendance, intramuscular: deltoid in adults, adolescents and older children; anterolateral thigh in young children. Never into the gluteal muscle, and never intravascularly or intradermally. Shake well before use and inspect; do not administer if the appearance differs from that described in the SmPC. Where another vaccine is given at the same visit, use a separate limb where possible, or sites at least 2.5 cm apart, and record the site of each. Do not mix with any other vaccine in the same syringe. This PGD does not permit supply of vaccine to the patient for administration elsewhere. Vaccinate seated and observe for 15 minutes.`,
  };
}
