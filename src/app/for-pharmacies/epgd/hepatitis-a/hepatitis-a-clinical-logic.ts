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
import { PRODUCTS, FIRST_DOSE_PRODUCT_LABEL, OCCUPATIONAL_GROUP_LABEL, HEPATITIS_A_PGD_VERSION,
  FIRST_DOSE_APPROX_MONTHS,
  FIRST_DOSE_APPROX_LABEL,
} from './hepatitis-a-types';

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

/** "Departure within about a month" for the hepatitis B steer (document:
 *  "The patient also needs hepatitis B protection"). */
export const HEP_B_MONOVALENT_DAYS = 35;

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

/** Which dose today is, from the course status. A completed course is a
 *  stop (no reinforcing dose is authorised), so it has no dose number. */
export function doseNumberFor(course: HepatitisACourse): DoseNumber {
  switch (course.courseStatus) {
    case 'none':
      return 'first';
    case 'one-dose':
      return 'second';
    default:
      return '';
  }
}

export function firstDoseProductLabel(product: FirstDoseProduct): string {
  if (!product) return 'Not recorded';
  if (product === 'not-known') return 'not known';
  return FIRST_DOSE_PRODUCT_LABEL[product];
}

export interface LateDoseAssessment {
  months: number | null;
  /** Product whose SmPC window is applied: the product being given today. */
  windowProduct: Exclude<HepatitisAProduct, ''> | null;
  windowMonths: number | null;
  windowLabel: string;
  tooEarly: boolean;
  /** More than 12 months but still within the licensed window. */
  late: boolean;
  /** Outside the licensed window of the product being given today. */
  beyondWindow: boolean;
  /** First-dose product not known. */
  productNotKnown: boolean;
  /** Date not known and the patient cannot say even roughly when. */
  intervalUnknown: boolean;
  /** Off-label: beyond the window, first-dose product not known, or interval unknown. */
  offLabel: boolean;
  /** Why it is off-label, for the record. */
  offLabelReason: string;
}

/**
 * Timing of a second dose against the document's per-product windows.
 *
 * The licensed window is that of the product being given today as the
 * booster (document: "A LATE SECOND DOSE STILL COUNTS"): Havrix Monodose up
 * to 5 years, Havrix Junior Monodose up to 3 years, Avaxim 6 to 36 months,
 * Avaxim Junior 6 months to 15 years. Beyond that window, or where the
 * first-dose product is not known, the dose is off-label.
 */
export function assessSecondDoseTiming(
  course: HepatitisACourse,
  productToday: HepatitisAProduct
): LateDoseAssessment {
  const firstDoseProduct = course.firstDoseProduct;
  // Date known: the real interval. Date not known: the upper bound of the
  // band the patient reports, so the window check still runs; "cannot say"
  // leaves the interval unknown and makes the dose off-label.
  const months =
    course.firstDoseDateKnown === 'known'
      ? monthsSinceFirstDose(course.firstDoseDate)
      : course.firstDoseApproxInterval && course.firstDoseApproxInterval !== 'cannot-say'
        ? FIRST_DOSE_APPROX_MONTHS[course.firstDoseApproxInterval]
        : null;
  const intervalUnknown = course.firstDoseDateKnown === 'not-known' && course.firstDoseApproxInterval === 'cannot-say';
  const windowProduct: Exclude<HepatitisAProduct, ''> | null = productToday || null;
  const info = windowProduct ? PRODUCTS[windowProduct] : null;
  const windowMonths = info ? info.secondDoseWindowMonths : null;
  const tooEarly = course.firstDoseDateKnown === 'known' && months !== null && months < SECOND_DOSE_MIN_MONTHS;
  const beyondWindow = months !== null && windowMonths !== null && months > windowMonths;
  const late = months !== null && months > SECOND_DOSE_MAX_MONTHS && !beyondWindow;
  const productNotKnown = firstDoseProduct === 'not-known';
  const windowLabel = info ? `${info.shortName}: ${info.windowLabel}` : '';
  const reasons: string[] = [];
  if (beyondWindow) reasons.push(`${months} months since the first dose, outside the licensed window (${windowLabel})`);
  if (productNotKnown) reasons.push('first-dose product not known');
  if (intervalUnknown) reasons.push('interval since the first dose cannot be established');
  return {
    months,
    windowProduct,
    windowMonths,
    windowLabel,
    tooEarly,
    late,
    beyondWindow,
    productNotKnown,
    intervalUnknown,
    offLabel: beyondWindow || productNotKnown || intervalUnknown,
    offLabelReason: reasons.join('; '),
  };
}

/** Interval since the first dose, worded for the off-label record. */
export function firstDoseIntervalText(course: HepatitisACourse): string {
  if (course.firstDoseDateKnown === 'known') {
    const months = monthsSinceFirstDose(course.firstDoseDate);
    if (months === null) return 'not recorded';
    if (months < 24) return `${months} ${months === 1 ? 'month' : 'months'}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return `${months} months (${years} ${years === 1 ? 'year' : 'years'}${rem ? ` ${rem} ${rem === 1 ? 'month' : 'months'}` : ''})`;
  }
  if (course.firstDoseDateKnown === 'not-known') {
    const band = course.firstDoseApproxInterval ? `, ${FIRST_DOSE_APPROX_LABEL[course.firstDoseApproxInterval]}` : '';
    return `date not known${band}${course.firstDoseSixMonthsConfirmed ? '; 6 months or more ago as reliably reported' : ''}${course.firstDoseDateNote.trim() ? `: ${course.firstDoseDateNote.trim()}` : ''}`;
  }
  return 'not recorded';
}

// ─── Indication ───

export function travelIndicationSelected(indication: HepatitisAIndication): boolean {
  return indication.indicationType === 'travel' || indication.indicationType === 'both';
}

export function nonTravelIndicationSelected(indication: HepatitisAIndication): boolean {
  return indication.indicationType === 'non-travel' || indication.indicationType === 'both';
}

/** Haemophilia or plasma-derived clotting factors counts as the indication
 *  only while a non-travel indication is selected: the tick stays in state
 *  when the pharmacist switches to travel only, and must not carry a hidden
 *  caution with it. */
export function haemophiliaIndicationApplies(indication: HepatitisAIndication): boolean {
  return nonTravelIndicationSelected(indication) && indication.haemophiliaClottingFactors;
}

/** The occupational risk is an indication only in one of the Green Book
 *  groups, or where an "other" request comes from occupational health or
 *  the Health Protection Team. */
export function occupationalIndicationApplies(indication: HepatitisAIndication): boolean {
  if (!indication.occupationalRisk || !indication.occupationalGroup) return false;
  if (indication.occupationalGroup === 'other-request') return indication.occupationalOhRequest;
  return true;
}

/** An "other occupational request" without occupational health or Health
 *  Protection Team backing: not an indication. */
export function occupationalRequestUnsupported(indication: HepatitisAIndication): boolean {
  return (
    nonTravelIndicationSelected(indication) &&
    indication.occupationalRisk &&
    indication.occupationalGroup === 'other-request' &&
    !indication.occupationalOhRequest
  );
}

/** At least one non-travel risk factor from the document's list applies. */
export function nonTravelIndicationApplies(indication: HepatitisAIndication): boolean {
  if (!nonTravelIndicationSelected(indication)) return false;
  return (
    indication.chronicLiverDisease ||
    indication.haemophiliaClottingFactors ||
    indication.injectsDrugs ||
    indication.msm ||
    occupationalIndicationApplies(indication)
  );
}

export function occupationalRiskText(indication: HepatitisAIndication): string {
  if (!indication.occupationalRisk || !indication.occupationalGroup) return 'not recorded';
  const group = OCCUPATIONAL_GROUP_LABEL[indication.occupationalGroup];
  const oh =
    indication.occupationalGroup === 'other-request'
      ? indication.occupationalOhRequest
        ? '; request from occupational health or the Health Protection Team'
        : '; no request from occupational health or the Health Protection Team (not an indication)'
      : '';
  return `${group}${oh}${indication.occupationalRiskDetail.trim() ? ` (${indication.occupationalRiskDetail.trim()})` : ''}`;
}

// ─── Hepatitis B steer ───

export interface HepBSteer {
  /** Departure within about a month, or rapid protection ticked: the tool
   *  recommends monovalent hepatitis A now under this PGD. */
  monovalentRecommended: boolean;
  reason: string;
}

/** Document: "Where departure is within about a month, or rapid hepatitis A
 *  protection is needed, give monovalent hepatitis A under this PGD now,
 *  because the Green Book states monovalent vaccine protects against
 *  hepatitis A sooner than Twinrix, and arrange hepatitis B separately." */
export function hepBSteer(indication: HepatitisAIndication): HepBSteer {
  const days = travelIndicationSelected(indication) ? daysUntil(indication.departureDate) : null;
  const soon = days !== null && days >= 0 && days <= HEP_B_MONOVALENT_DAYS;
  const reasons: string[] = [];
  if (soon) reasons.push(`departure in ${days} ${days === 1 ? 'day' : 'days'} (within about a month)`);
  if (indication.rapidHepAProtectionNeeded) reasons.push('rapid hepatitis A protection needed');
  return { monovalentRecommended: reasons.length > 0, reason: reasons.join('; ') };
}

// ─── Bleeding ───

/** Caution (b): haemophilia or other bleeding disorder, or thrombocytopenia,
 *  from the medical history or from haemophilia recorded as the indication.
 *  Deep subcutaneous, or intramuscular only on a doctor's advice. */
export function bleedingDisorderApplies(
  indication: HepatitisAIndication,
  medicalHistory: HepatitisAMedicalHistory
): boolean {
  return medicalHistory.bleedingDisorder || haemophiliaIndicationApplies(indication);
}

/** Caution (a): stable anticoagulation. Intramuscular with a 23 gauge or
 *  finer needle and firm pressure for at least 2 minutes. */
export function anticoagulationApplies(medicalHistory: HepatitisAMedicalHistory): boolean {
  return medicalHistory.stableAnticoagulation;
}

/** Either bleeding caution: the needle and pressure precautions apply to the
 *  intramuscular route. */
export function bleedingCautionApplies(
  indication: HepatitisAIndication,
  medicalHistory: HepatitisAMedicalHistory
): boolean {
  return anticoagulationApplies(medicalHistory) || bleedingDisorderApplies(indication, medicalHistory);
}

/** The route and why, for the record (document: "Record the route and why"). */
export function bleedingRouteReason(
  indication: HepatitisAIndication,
  medicalHistory: HepatitisAMedicalHistory,
  summary: HepatitisASummary
): string | null {
  const disorder = bleedingDisorderApplies(indication, medicalHistory);
  const anticoag = anticoagulationApplies(medicalHistory);
  if (!disorder && !anticoag) return null;
  const why = [
    disorder
      ? haemophiliaIndicationApplies(indication) && !medicalHistory.bleedingDisorder
        ? 'haemophilia or receipt of plasma-derived clotting factors'
        : 'haemophilia or other bleeding disorder, or thrombocytopenia'
      : null,
    anticoag ? 'stable anticoagulation' : null,
  ]
    .filter((x): x is string => x !== null)
    .join('; ');
  if (summary.route === 'subcutaneous') {
    return `Deep subcutaneous (${why}): the route the SmPCs allow for patients at risk of haemorrhage`;
  }
  if (summary.route === 'intramuscular') {
    const parts = [`Intramuscular (${why})`];
    if (disorder) {
      parts.push(
        summary.imAdvisedByDoctor
          ? `a doctor familiar with the patient's bleeding risk advised the intramuscular route is safe: ${summary.imAdvisedBy.trim() || 'not recorded'}`
          : 'doctor\'s advice for the intramuscular route NOT recorded'
      );
    }
    parts.push(
      summary.bleedingPrecautionsConfirmed
        ? '23 gauge or finer needle, firm pressure without rubbing for at least 2 minutes'
        : 'needle and pressure precautions NOT confirmed'
    );
    return parts.join('; ');
  }
  return null;
}

// ─── Where each stop is set ───

/**
 * The step whose controls set each stop. A stop disables Next from that
 * step onwards, but not on the steps before it: otherwise a pharmacist who
 * ticks "acute febrile illness" on Medical History and then presses
 * Previous to check the indication is locked on a step that has no control
 * to clear the stop, with no forward route back to the step that does
 * (the progress bar is backwards-only). The stop is still enforced on its
 * own step and every step after it, so nothing can be skipped.
 */
export const STOP_ORIGIN_STEP: Record<string, number> = {
  UNDER_1: 0,
  PATIENT_DECLINED: 1,
  CONSENT_UNOBTAINABLE: 1,
  NO_INDICATION: 2,
  OCCUPATIONAL_NOT_INDICATED: 2,
  POST_EXPOSURE: 2,
  USE_HEP_AB_PGD: 2,
  COMPLETED_COURSE: 2,
  SECOND_DOSE_TOO_EARLY: 2,
  SEVERE_HYPERSENSITIVITY: 3,
  FEBRILE_ILLNESS: 3,
};

/** True when a stop set on this step, or an earlier one, is present. An
 *  unknown code blocks everywhere (the safe default). */
export function stopsBlockStep(alerts: ClinicalAlert[], step: number): boolean {
  return alerts.some((a) => a.severity === 'stop' && (STOP_ORIGIN_STEP[a.code] ?? 0) <= step);
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

  // The document's exclusion is "under 16 and valid consent cannot be
  // obtained". A patient corrected to 16 or over after that option was
  // chosen consents in their own right: the consent step asks for the
  // basis to be re-selected instead of stopping.
  if (patient.consentBasis === 'unobtainable' && (patient.age === null || patient.age < 16)) {
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
        'Inclusion requires travel to a destination for which NaTHNaC TravelHealthPro recommends hepatitis A vaccination for this traveller and itinerary, or a non-travel risk factor: chronic liver disease including chronic hepatitis B or C, haemophilia or receipt of plasma-derived clotting factors, injecting drug use, gay, bisexual and other men who have sex with men, or an occupational risk in one of the Green Book groups (laboratory work with possible exposure to the virus, staff or residents of a large residential institution where the Green Book applies, work with repeated exposure to raw sewage, or work with susceptible primates). Give food and water hygiene advice, record the decision, and refer to a travel clinic or the GP if vaccination is still wanted.',
    });
  }

  // An "other occupational request" (food handler, day-care, healthcare or
  // similar) is not an indication unless the request comes from occupational
  // health or the Health Protection Team. With no other indication, refer.
  if (
    indication.indicationType === 'non-travel' &&
    occupationalRequestUnsupported(indication) &&
    !nonTravelIndicationApplies(indication)
  ) {
    alerts.push({
      severity: 'stop',
      code: 'OCCUPATIONAL_NOT_INDICATED',
      message: 'Occupational request outside the Green Book groups, without occupational health or Health Protection Team backing',
      detail:
        'Food handlers, day-care staff and healthcare workers are not included unless the request comes from occupational health or the Health Protection Team; otherwise refer. The Green Book occupational groups are laboratory work with possible exposure to the virus, staff or residents of a large residential institution where the Green Book applies, work with repeated exposure to raw sewage, and work with susceptible primates. Give food and water hygiene advice, record the decision, and refer to the GP or occupational health.',
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
      message: 'Patient also needs hepatitis B: seen under the Hepatitis A and B (Travel) PGD instead',
      detail:
        'Not vaccinated under this PGD. The Hepatitis A and B (Travel) PGD authorises Twinrix and Engerix B as well as the products here, so one consultation covers both. Record the decision here and continue in that tool.',
    });
  }

  if (course.courseStatus === 'completed') {
    alerts.push({
      severity: 'stop',
      code: 'COMPLETED_COURSE',
      message: 'A completed course: two doses at least 6 months apart, or a full Twinrix or Ambirix course',
      detail:
        'Nothing is authorised. Someone who completed a course, at any time in the past, needs no further dose under this PGD. Where the patient is at ongoing risk and 25 years or more have passed, refer to the GP or a travel clinic for a reinforcing dose; that dose is outside this PGD because no SmPC includes it. Reassure, give food and water hygiene advice, and record what the patient told you.',
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
          `The first dose was ${months} ${months === 1 ? 'month' : 'months'} ago. Inclusion for a second dose requires a first dose 6 months or more ago. Rebook the second dose for 6 to 12 months after the first; a single dose protects for at least 12 months.`,
      });
    }
  }

  if (medicalHistory.severeHypersensitivity) {
    alerts.push({
      severity: 'stop',
      code: 'SEVERE_HYPERSENSITIVITY',
      message: 'Confirmed anaphylaxis or other severe hypersensitivity to a previous dose of any hepatitis A-containing vaccine, or to any component including neomycin',
      detail:
        'Excluded. Refer, do not vaccinate. All four products may contain trace neomycin, so confirmed anaphylaxis or other severe hypersensitivity to neomycin excludes every product under this PGD. Contact dermatitis to topical neomycin is not a contraindication. Inform the GP.',
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

  if (indication.serologyRequested) {
    alerts.push({
      severity: 'caution',
      code: 'SEROLOGY',
      message: 'Patient asks for proof of immunity',
      detail:
        'Serology is not provided under this PGD. Vaccination may still proceed; refer for serology if it is needed.',
    });
  }

  if (indication.indicationType === 'both' && occupationalRequestUnsupported(indication)) {
    alerts.push({
      severity: 'caution',
      code: 'OCCUPATIONAL_REQUEST_NOT_INDICATION',
      message: 'Occupational request outside the Green Book groups is not an indication',
      detail:
        'The travel indication stands. The occupational request (food handler, day-care, healthcare or similar) is not itself an indication without a request from occupational health or the Health Protection Team, and is recorded as such.',
    });
  }

  if (nonTravelIndicationSelected(indication) && indication.chronicLiverDisease) {
    alerts.push({
      severity: 'caution',
      code: 'CHRONIC_LIVER_DISEASE',
      message: 'Chronic liver disease: prefer Havrix where held',
      detail: 'Avaxim has not been studied in liver disease. Prefer Havrix where held; do not delay vaccination to obtain it.',
    });
  }

  if (course.courseStatus === 'one-dose') {
    const timing = assessSecondDoseTiming(course, summary.product);
    if (course.firstDoseDateKnown === 'not-known') {
      alerts.push({
        severity: 'caution',
        code: 'FIRST_DOSE_DATE_NOT_KNOWN',
        message: 'Date of the first dose not known',
        detail:
          'Inclusion for a second dose requires a first dose 6 months or more ago, with the date known or reliably reported. Record what the patient reports; the reliably-reported tick stands in for the date, and the reported interval band is checked against the licensed window of the product given (the upper bound of the band counts). If the patient cannot say even roughly, the dose is off-label. A late second dose still counts and the course is not restarted.',
      });
    }
    if (course.firstDoseDateKnown === 'known' && timing.late) {
      alerts.push({
        severity: 'caution',
        code: 'LATE_SECOND_DOSE',
        message: 'Late second dose: give it, do not restart',
        detail: timing.windowLabel
          ? `${timing.months} months since the first dose. Within the licensed window of the product being given (${timing.windowLabel}). Successful boosting occurs even when the second dose is delayed for several years.`
          : `${timing.months} months since the first dose. The licensed window is that of the product being given today (Havrix Monodose up to 5 years, Havrix Junior Monodose up to 3 years, Avaxim 6 to 36 months, Avaxim Junior 6 months to 15 years) and is checked when the vaccine is selected; outside it the dose is off-label and is given on the terms stated, not declined.`,
      });
    }
    if (timing.offLabel) {
      alerts.push({
        severity: 'caution',
        code: 'SECOND_DOSE_OFF_LABEL',
        message: 'Second dose is off-label: give it on the terms stated, do not decline',
        detail:
          `${timing.offLabelReason.charAt(0).toUpperCase()}${timing.offLabelReason.slice(1)}. Off-label use is authorised under this PGD on the basis of Green Book chapter 17: successful boosting occurs even when the second dose is delayed for several years and the course does not need restarting. Tell the patient it is off-label and why, obtain consent on that basis, and record the interval since the first dose, the first-dose product or "not known", and the words "off-label, Green Book chapter 17".`,
      });
      if (medicalHistory.immunosuppressed) {
        alerts.push({
          severity: 'caution',
          code: 'OFF_LABEL_IMMUNOSUPPRESSED',
          message: 'Off-label second dose in an immunosuppressed patient: arrange serology',
          detail:
            'The Havrix data on delayed boosting are from immunocompetent adults. In an immunosuppressed patient refer for serology as well; serology is outside this PGD. Include this in the letter to the GP or specialist.',
        });
      }
    }
  }

  if (indication.hepBAlsoNeeded === 'yes' && indication.hepBDecision === 'monovalent-now') {
    const steer = hepBSteer(indication);
    alerts.push({
      severity: 'caution',
      code: 'HEP_B_ALSO_NEEDED',
      message: 'Hepatitis B also needed: monovalent hepatitis A now, hepatitis B arranged separately',
      detail: steer.monovalentRecommended
        ? `Recommended by the tool (${steer.reason}): the Green Book states monovalent vaccine protects against hepatitis A sooner than Twinrix. Arrange hepatitis B separately, and tell the patient this vaccine gives no protection against hepatitis B or C.`
        : 'Pharmacist\'s choice, recorded: the combined vaccine under the Hepatitis A and B (Travel) PGD was offered as convenient where there is time to complete a three dose course before exposure. Arrange hepatitis B separately, and tell the patient this vaccine gives no protection against hepatitis B or C.',
    });
  }

  const days = daysUntil(indication.departureDate);
  if (travelIndicationSelected(indication) && days !== null) {
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
        'Hepatitis A vaccine may be given where clearly indicated; the vaccines are inactivated. Havrix preferred where held; where only Avaxim or Avaxim Junior is held, give it after a recorded risk-benefit assessment rather than delaying, as their SmPCs require.',
    });
  }

  if (medicalHistory.breastfeeding) {
    alerts.push({
      severity: 'caution',
      code: 'BREASTFEEDING',
      message: 'Breastfeeding',
      detail:
        'The Avaxim SmPCs permit use during breastfeeding; the Havrix SmPCs ask for a benefit decision because excretion in milk is unknown; the Green Book records no evidence of risk from inactivated vaccines in breastfeeding. Give where indicated and record the decision.',
    });
  }

  if (medicalHistory.immunosuppressed) {
    alerts.push({
      severity: 'caution',
      code: 'IMMUNOSUPPRESSION',
      message: 'Immunosuppression, including HIV, immunosuppressive treatment and haemodialysis',
      detail:
        'May be vaccinated, and vaccination of a person with chronic immunodeficiency such as HIV is recommended; the response may be reduced and further doses may be needed. Where the immunosuppression is a time-limited treatment and travel allows, advise deferral until it ends (Avaxim SmPC). Tell the patient that serology and further doses may be needed, that both are outside this PGD, and write to the GP or specialist. Do not tell the patient they are protected.',
    });
    if (!consent.notifyGp) {
      alerts.push({
        severity: 'caution',
        code: 'IMMUNOSUPPRESSION_GP_NOT_NOTIFIED',
        message: 'Immunosuppression: consent to GP notification not given',
        detail:
          `The GP or specialist must be written to. Consent to a copy of this consultation going to the GP was not given on the Consent step: go back and record it, or record the refusal. ${medicalHistory.gpNotificationRefusedNote.trim() ? `Recorded: ${medicalHistory.gpNotificationRefusedNote.trim()}` : 'Refusal not yet recorded.'}`,
      });
    }
  }

  if (anticoagulationApplies(medicalHistory)) {
    alerts.push({
      severity: 'caution',
      code: 'ANTICOAGULATION',
      message: 'Stable anticoagulation',
      detail:
        'Warfarin with INR testing up to date and the latest INR below the upper limit of the therapeutic range, or a direct oral anticoagulant taken as prescribed. Give intramuscularly with a 23 gauge or finer needle, firm pressure without rubbing for at least 2 minutes; if in doubt consult the anticoagulant prescriber.',
    });
  }

  if (bleedingDisorderApplies(indication, medicalHistory)) {
    alerts.push({
      severity: 'caution',
      code: 'BLEEDING_DISORDER',
      message:
        haemophiliaIndicationApplies(indication) && !medicalHistory.bleedingDisorder
          ? 'Haemophilia or receipt of plasma-derived clotting factors: route'
          : 'Haemophilia or other bleeding disorder, or thrombocytopenia: route',
      detail:
        'Give by deep subcutaneous injection, which all four SmPCs allow for patients at risk of haemorrhage, or intramuscularly only where a doctor familiar with the patient\'s bleeding risk has advised that route is safe. Record the route and why.',
    });
  }

  if (medicalHistory.phenylketonuria) {
    alerts.push({
      severity: 'caution',
      code: 'PHENYLKETONURIA',
      message: 'Phenylketonuria',
      detail:
        'All four products contain phenylalanine: Havrix Monodose 166 micrograms per dose, Havrix Junior Monodose 83 micrograms, Avaxim and Avaxim Junior 10 micrograms. Advise the patient or carer to account for it in meal planning on the day.',
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
      `One dose of ${info.volume} per patient per attendance, intramuscular: deltoid in adults, adolescents and older children; anterolateral thigh in young children. Never into the gluteal muscle, and never intravascularly or intradermally: the response is unreliable. Shake well before use and inspect; do not administer if the appearance differs from that described in the SmPC. For a patient with a bleeding disorder, use a fine needle with firm pressure, or the subcutaneous route. Where another vaccine is given at the same visit, use a separate limb where possible, or sites at least 2.5 cm apart, and record the site of each. Do not mix with any other vaccine in the same syringe. This PGD does not permit supply of vaccine to the patient for administration elsewhere. Vaccinate seated and observe for 15 minutes.`,
  };
}
