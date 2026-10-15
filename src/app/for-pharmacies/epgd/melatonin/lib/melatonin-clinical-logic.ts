import type {
  Dose,
  MelConsent,
  MelCounselling,
  MelHistory,
  MelIndication,
  MelMedical,
  MelMedicines,
  MelPatientDetails,
  MelScreens,
  MelSupply,
  ProductKey,
} from './melatonin-types';
import {
  ARM_A_MAX_SUPPLIES,
  ARM_A_TABLETS_PER_SUPPLY,
  ARM_B_MAX_SUPPLIES_12_MONTHS,
  COURSE_LAST_DAY,
  COURSES_BEFORE_GP_REVIEW,
  MONTHS_BETWEEN_COURSES,
  PRODUCTS,
  REVIEW_ACCEPTED_UNTIL,
  REVIEW_WINDOW_END,
  REVIEW_WINDOW_START,
} from './melatonin-types';

// ─── Alerts ───

export type MelAlertSeverity = 'stop' | 'caution' | 'info';

export interface MelAlert {
  severity: MelAlertSeverity;
  code: string;
  message: string;
  detail: string;
}

// ─── Steps ───

export const STEP_LABELS = [
  'Patient Details',
  'Arm, Role and Consent',
  'Supply History',
  'Sleep or Journey Assessment',
  'Red Flags and Screens',
  'Medical History',
  'Medicines and Occupation',
  'Dose and Supply',
  'Counselling',
  'Summary',
] as const;

export const STEP = {
  patient: 0,
  consent: 1,
  history: 2,
  indication: 3,
  screens: 4,
  medical: 5,
  medicines: 6,
  supply: 7,
  counselling: 8,
  summary: 9,
} as const;

// ─── Dates ───

export function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatUkDate(iso: string): string {
  const d = parseLocalDate(iso);
  if (!d) return iso || 'not recorded';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Today's date on the Europe/London calendar (YYYY-MM-DD). */
export function londonTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Calendar days from the date to today (positive when the date is in the past). */
export function daysSince(iso: string): number | null {
  const d = parseLocalDate(iso);
  if (!d) return null;
  return Math.round((todayLocal().getTime() - d.getTime()) / 86400000);
}

export function isExpired(expiryDate: string): boolean {
  const d = daysSince(expiryDate);
  return d !== null && d > 0;
}

/** True where the date falls within the last N calendar months (on or after the same day N months ago). */
export function withinLastCalendarMonths(iso: string, months: number): boolean | null {
  const d = parseLocalDate(iso);
  if (!d) return null;
  const today = todayLocal();
  let cutoff = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
  if (cutoff.getDate() !== today.getDate()) cutoff = new Date(today.getFullYear(), today.getMonth() - months + 1, 0);
  return d.getTime() > cutoff.getTime();
}

// ─── Role ───

export function isTechnician(consent: MelConsent): boolean {
  return consent.practitionerRole === 'technician';
}

// ─── Screens (Appendix 2) ───

const sum = (xs: (number | null)[]) => (xs.every((x) => x !== null) ? xs.reduce<number>((a, b) => a + (b ?? 0), 0) : null);

export function phqTotal(s: MelScreens): number | null {
  return sum([s.phq1, s.phq2]);
}

export function gadTotal(s: MelScreens): number | null {
  return sum([s.gad1, s.gad2]);
}

/** The Epworth total recorded from the pharmacy's licensed form (0 to 24). */
export function epworthTotal(s: MelScreens): number | null {
  return typeof s.epworth === 'number' && Number.isInteger(s.epworth) && s.epworth >= 0 && s.epworth <= 24 ? s.epworth : null;
}

/** STOP-Bang: age over 50 and male gender are taken from the patient details. */
export function stopBangTotal(s: MelScreens, patient: MelPatientDetails): number {
  return [
    s.sbSnoring,
    s.sbTired,
    s.sbObserved,
    s.sbPressure,
    s.sbBmi35,
    patient.age !== null && patient.age > 50,
    s.sbNeck40,
    patient.sex === 'male',
  ].filter(Boolean).length;
}

// ─── Arm A course arithmetic ───

export function isArmAReview(consent: MelConsent, history: MelHistory): boolean {
  return consent.arm === 'A' && (history.supplyNumber === '2' || history.supplyNumber === '3');
}

/** The supply number today is the one the patient's previous records at this pharmacy show. */
export function courseVerified(history: MelHistory): boolean {
  return history.recordLookup === 'found' && !!history.carriedForward && history.carriedForward.expectedSupply === history.supplyNumber;
}

/**
 * Supply 2 or 3 that the records do not verify (no previous record found, or
 * a different supply number chosen): a reason and the supply 1 record are
 * required, a caution is shown, and every supply 1 gate that depends on the
 * course history still applies.
 */
export function isUnverifiedReview(consent: MelConsent, history: MelHistory): boolean {
  return isArmAReview(consent, history) && !courseVerified(history);
}

/**
 * Supply 1 chosen while the records show an arm A course that is open, or that
 * lapsed (ended on day 37 after its last supply) within the last 6 months: a
 * reason is required and a caution is shown.
 */
export function isRestartOverRecordedCourse(consent: MelConsent, history: MelHistory): boolean {
  const cf = history.carriedForward;
  if (consent.arm !== 'A' || !cf || history.supplyNumber !== '1') return false;
  if (cf.latestCourseState === 'open') return true;
  if (cf.latestCourseState === 'lapsed') {
    const last = parseLocalDate(cf.latestCourseLastSupplyDate);
    if (!last) return true;
    return !!withinLastCalendarMonths(formatLocalDate(addDays(last, REVIEW_ACCEPTED_UNTIL)), MONTHS_BETWEEN_COURSES);
  }
  return false;
}

/** Supply 1, or a supply 2 or 3 not verified by the records: the history-dependent supply 1 gates apply. */
export function supply1GatesApply(consent: MelConsent, history: MelHistory): boolean {
  return (consent.arm === 'A' && history.supplyNumber === '1') || isUnverifiedReview(consent, history);
}

/** Day number after the last supply (the day of a supply is day 0). */
export function reviewDay(history: MelHistory): number | null {
  return daysSince(history.lastSupplyDate);
}

/** Day number after supply 1. */
export function courseDay(history: MelHistory): number | null {
  return daysSince(history.supply1Date);
}

/** Nights without tablets at a review from day 31 to day 37 (supply 1 and 2 hold 30 tablets, first dose on day 0). */
export function nightsWithoutTablets(history: MelHistory): number {
  const d = reviewDay(history);
  if (d === null || d <= REVIEW_WINDOW_END) return 0;
  return d - REVIEW_WINDOW_END;
}

export function totalPreviousCourses(history: MelHistory): number | null {
  if (history.previousCoursesThisPgd === null || history.previousCoursesCircadin === null) return null;
  return history.previousCoursesThisPgd + history.previousCoursesCircadin;
}

export type RatingBand = 'clearly-better' | 'a-little-better' | 'no-better';

export const BAND_LABEL: Record<RatingBand, string> = {
  'clearly-better': 'CLEARLY BETTER (improved by 3 or more points)',
  'a-little-better': 'A LITTLE BETTER (improved by 1 or 2 points)',
  'no-better': 'NO BETTER (no change, or worse)',
};

/** The change in the 0 to 10 sleep quality rating from the baseline recorded at supply 1. */
export function ratingChange(history: MelHistory, indication: MelIndication): number | null {
  if (history.baselineRating === null || indication.reviewRating === null) return null;
  return indication.reviewRating - history.baselineRating;
}

export function ratingBand(history: MelHistory, indication: MelIndication): RatingBand | null {
  const c = ratingChange(history, indication);
  if (c === null) return null;
  if (c >= 3) return 'clearly-better';
  if (c >= 1) return 'a-little-better';
  return 'no-better';
}

// ─── Dose ceilings ───

export function oestrogen(medicines: MelMedicines): boolean {
  return medicines.oestrogen === 'yes';
}

export function aged65(patient: MelPatientDetails): boolean {
  return patient.age !== null && patient.age >= 65;
}

/** Reasons the 3 mg maximum applies (aged 65 or over; any oestrogen). */
export function threeMgCapReasons(patient: MelPatientDetails, medicines: MelMedicines): string[] {
  const r: string[] = [];
  if (aged65(patient)) r.push('aged 65 or over');
  if (oestrogen(medicines)) r.push('taking a medicine containing an oestrogen');
  return r;
}

/** Arm A review rules: "the patient is under 65, takes no oestrogen and has no caution that makes a higher dose unsafe". */
export function armACan5mg(patient: MelPatientDetails, medicines: MelMedicines, indication: MelIndication): boolean {
  return threeMgCapReasons(patient, medicines).length === 0 && !indication.higherDoseUnsafe;
}

export interface ArmADoseDecision {
  options: Exclude<Dose, ''>[];
  /** Stopping rule 1 applies, or (review 2) 5 mg is now unsafe. */
  stop: boolean;
  /** The stop code where stop is true. */
  stopCode?: 'STOP_RULE_1_NO_BETTER' | 'REVIEW_2_5MG_UNSAFE';
  text: string;
}

/** The dose (or stop) the arm A review rules allow today. */
export function armADoseDecision(
  patient: MelPatientDetails,
  history: MelHistory,
  indication: MelIndication,
  medicines: MelMedicines
): ArmADoseDecision | null {
  const capped = threeMgCapReasons(patient, medicines);
  if (history.supplyNumber === '1') {
    return { options: ['3'], stop: false, text: 'SUPPLY 1: 3 mg (one Adaflex 3 mg tablet) once nightly, 1 to 2 hours before bedtime.' };
  }
  const band = ratingBand(history, indication);
  if (!band) return null;
  const can5 = armACan5mg(patient, medicines, indication);
  if (history.supplyNumber === '2') {
    if (band === 'clearly-better') return { options: ['3'], stop: false, text: 'REVIEW 1: CLEARLY BETTER and tablets tolerated: supply 2 at 3 mg.' };
    if (can5) return { options: ['5'], stop: false, text: `REVIEW 1: ${band === 'a-little-better' ? 'A LITTLE BETTER' : 'NO BETTER'}, tablets tolerated, and the patient is under 65, takes no oestrogen and has no caution that makes a higher dose unsafe: supply 2 at 5 mg (the only dose increase in the course).` };
    if (band === 'a-little-better') return { options: ['3'], stop: false, text: 'REVIEW 1: A LITTLE BETTER but the patient cannot have 5 mg: supply 2 at 3 mg.' };
    return { options: [], stop: true, stopCode: 'STOP_RULE_1_NO_BETTER', text: 'REVIEW 1: NO BETTER and the patient cannot have 5 mg: STOP (stopping rule 1), refer to the GP.' };
  }
  if (history.supplyNumber === '3') {
    if (band === 'no-better') return { options: [], stop: true, stopCode: 'STOP_RULE_1_NO_BETTER', text: 'REVIEW 2: NO BETTER: STOP (stopping rule 1), no supply 3, refer to the GP.' };
    if (history.previousDose === '5' && (capped.length > 0 || indication.higherDoseUnsafe)) {
      const why = [...capped, ...(indication.higherDoseUnsafe ? [indication.higherDoseUnsafeReason.trim() || 'a caution that makes 5 mg unsafe'] : [])];
      return {
        options: [],
        stop: true,
        stopCode: 'REVIEW_2_5MG_UNSAFE',
        text: `REVIEW 2: on 5 mg, but 5 mg is now unsafe (${why.join('; ')}). STOP and refer to the GP: the dose is never reduced under this PGD, so no supply 3.`,
      };
    }
    if (history.previousDose === '3' && band === 'a-little-better' && can5) {
      return { options: ['3', '5'], stop: false, text: 'REVIEW 2: A LITTLE BETTER, still on 3 mg, and the 5 mg criteria are met: supply 3 at the same dose (3 mg), or supply 3 may be at 5 mg.' };
    }
    if (!history.previousDose) return null;
    return { options: [history.previousDose], stop: false, text: `REVIEW 2: ${band === 'clearly-better' ? 'CLEARLY BETTER' : 'A LITTLE BETTER'}: supply 3 at the same dose (${history.previousDose} mg).` };
  }
  return null;
}

// ─── Arm B ───

export type FiveMgEvidence = MelIndication['prev3mgEvidence'];

/** Reason the arm B 5 mg criteria are not met, or null where they are. */
export function armB5mgBlockedReason(patient: MelPatientDetails, indication: MelIndication, medicines: MelMedicines): string | null {
  const capped = threeMgCapReasons(patient, medicines);
  if (capped.length) return `3 mg maximum: ${capped.join('; ')}`;
  if (!indication.prev3mgJetLag) return 'the patient has not taken melatonin 3 mg for jet lag before';
  if (!indication.prev3mgTolerated) return 'the previous 3 mg was not recorded as tolerated';
  if (!indication.prev3mgInadequate) return 'the previous 3 mg was not recorded as failing to relieve symptoms adequately';
  if (indication.prev3mgEvidence === 'supplement' || indication.prev3mgEvidence === 'none' || !indication.prev3mgEvidence)
    return 'the previous 3 mg use is neither recorded nor of a licensed product the patient can name, obtained on prescription or from a pharmacy (previous use of a supplement or unlicensed melatonin does not count)';
  return null;
}

/** 10 tablets where the supply covers two journeys (5 nights each), or 5 tablets for one journey. */
export function armBQuantity(indication: MelIndication): number | null {
  if (indication.covers === 'both') return 10;
  if (indication.covers === 'outward' || indication.covers === 'return') return 5;
  return null;
}

export function productsForDose(dose: Dose, arm: MelConsent['arm']): Exclude<ProductKey, ''>[] {
  if (dose === '5') return ['adaflex-5'];
  if (dose === '3') return arm === 'B' ? ['adaflex-3', 'colonis-3'] : ['adaflex-3'];
  return [];
}

export function tabletsToday(consent: MelConsent, indication: MelIndication): number | null {
  if (consent.arm === 'A') return ARM_A_TABLETS_PER_SUPPLY;
  if (consent.arm === 'B') return armBQuantity(indication);
  return null;
}

/** Review window after today's supply: day 21 to day 30, accepted up to day 37. */
export function reviewWindowFromToday(): { start: string; end: string; acceptedUntil: string } {
  const t = todayLocal();
  return {
    start: formatLocalDate(addDays(t, REVIEW_WINDOW_START)),
    end: formatLocalDate(addDays(t, REVIEW_WINDOW_END)),
    acceptedUntil: formatLocalDate(addDays(t, REVIEW_ACCEPTED_UNTIL)),
  };
}

/** Day 103 after supply 1 (the latest day the last tablet of the course is taken). */
export function courseEndLimit(history: MelHistory, supplyNumber: string): string | null {
  const s1 = supplyNumber === '1' ? todayLocal() : parseLocalDate(history.supply1Date);
  return s1 ? formatLocalDate(addDays(s1, COURSE_LAST_DAY)) : null;
}

export function tabletsInCourseSoFar(history: MelHistory): number | null {
  if (!history.supplyNumber) return null;
  return Number(history.supplyNumber) * ARM_A_TABLETS_PER_SUPPLY;
}

// ─── Alert step origins ───

export const STOP_ORIGIN_STEP: Record<string, number> = {
  AGE_UNDER_18: STEP.patient,
  NOT_PRESENT: STEP.consent,
  PREVIOUS_STOP_RULE_2: STEP.history,
  REVIEW_2_5MG_UNSAFE: STEP.medicines,
  ARM_A_TECHNICIAN: STEP.consent,
  SAFEGUARDING_CARER_REQUEST: STEP.consent,
  SAFEGUARDING_CARE_HOME: STEP.consent,
  LACKS_CAPACITY: STEP.consent,
  PATIENT_DECLINED: STEP.consent,
  OFF_LABEL_NOT_ACCEPTED: STEP.consent,
  GP_NOT_REGISTERED: STEP.consent,
  GP_NOTIFICATION_DECLINED: STEP.consent,
  PREVIOUS_COURSE_WITHIN_6_MONTHS: STEP.history,
  TWO_COURSES_NO_GP_REVIEW: STEP.history,
  GP_REVIEW_BEFORE_COURSE_END: STEP.history,
  GP_REVIEW_ADVISES_AGAINST: STEP.history,
  IN_CIRCADIN_COURSE: STEP.history,
  REVIEW_NOT_IN_PERSON: STEP.history,
  REVIEW_BEFORE_WINDOW: STEP.history,
  REVIEW_AFTER_DAY_37: STEP.history,
  COURSE_SPAN_EXCEEDED: STEP.history,
  ARM_B_FOUR_SUPPLIES: STEP.history,
  ARM_B_MID_ARM_A_COURSE: STEP.history,
  ARM_B_MID_CIRCADIN_COURSE: STEP.history,
  INSOMNIA_UNDER_4_WEEKS: STEP.indication,
  INSOMNIA_CRITERIA_NOT_MET: STEP.indication,
  SLEEP_HYGIENE_NOT_TRIED: STEP.indication,
  SHIFT_WORK: STEP.indication,
  DELAYED_SLEEP_PATTERN: STEP.indication,
  CAFFEINE_NOT_ADDRESSED: STEP.indication,
  NOT_WISHING_MEDICINE: STEP.indication,
  STOP_RULE_1_NO_BETTER: STEP.indication,
  STOP_RULE_2_DROWSINESS: STEP.indication,
  STOP_RULE_2_FALL: STEP.indication,
  STOP_RULE_3_MOOD: STEP.indication,
  STOP_RULE_4_ALLERGY: STEP.indication,
  STOP_RULE_5_SIDE_EFFECT: STEP.indication,
  JET_LAG_NOT_BY_AIR: STEP.indication,
  JET_LAG_UNDER_5_ZONES: STEP.indication,
  JET_LAG_INSOMNIA_AT_HOME: STEP.indication,
  JET_LAG_SAFETY_CRITICAL_TRIP: STEP.indication,
  RED_FLAG_SLEEP_APNOEA: STEP.screens,
  RED_FLAG_DEPRESSION_ANXIETY: STEP.screens,
  RED_FLAG_SELF_HARM: STEP.screens,
  RED_FLAG_THYROID: STEP.screens,
  RED_FLAG_MENOPAUSAL: STEP.screens,
  RED_FLAG_RESTLESS_LEGS: STEP.screens,
  RED_FLAG_PAIN: STEP.screens,
  RED_FLAG_NOCTURIA: STEP.screens,
  RED_FLAG_ORTHOPNOEA: STEP.screens,
  RED_FLAG_NEURO: STEP.screens,
  RED_FLAG_RECREATIONAL_DRUGS: STEP.screens,
  RED_FLAG_ALCOHOL: STEP.screens,
  RED_FLAG_NARCOLEPSY_PARASOMNIA: STEP.screens,
  RED_FLAG_COGNITION: STEP.screens,
  RED_FLAG_SAFEGUARDING: STEP.screens,
  FALL_12_MONTHS: STEP.screens,
  HYPERSENSITIVITY: STEP.medical,
  HEPATIC_IMPAIRMENT: STEP.medical,
  RENAL_SEVERE: STEP.medical,
  RENAL_NOT_MILD_STABLE: STEP.medical,
  RENAL_TECHNICIAN: STEP.medical,
  AUTOIMMUNE: STEP.medical,
  EPILEPSY: STEP.medical,
  PREGNANT: STEP.medical,
  BREASTFEEDING: STEP.medical,
  PLANNING_PREGNANCY: STEP.medical,
  NO_CONTRACEPTION: STEP.medical,
  FLUVOXAMINE: STEP.medicines,
  HYPNOTIC: STEP.medicines,
  VITAMIN_K_ANTAGONIST: STEP.medicines,
  PSORALEN: STEP.medicines,
  PRESCRIBED_MELATONIN: STEP.medicines,
  OTHER_MELATONIN_NOT_STOPPING: STEP.medicines,
  RAISER_WITH_SEDATING: STEP.medicines,
  INSOMNIA_CAUSING_MEDICINE: STEP.medicines,
  SAFETY_CRITICAL_WORK: STEP.medicines,
};

/**
 * The stops that END the course: stopping rules 1 to 5, a review after day 37,
 * a supply that would run past day 103, and (review 2) 5 mg now unsafe, where
 * the dose is never reduced so no supply 3 can follow. Any other stop at a
 * review does not end the course.
 */
export const COURSE_ENDING_CODES: ReadonlySet<string> = new Set([
  'STOP_RULE_1_NO_BETTER',
  'STOP_RULE_2_DROWSINESS',
  'STOP_RULE_2_FALL',
  'STOP_RULE_3_MOOD',
  'STOP_RULE_4_ALLERGY',
  'STOP_RULE_5_SIDE_EFFECT',
  'REVIEW_AFTER_DAY_37',
  'COURSE_SPAN_EXCEEDED',
  'REVIEW_2_5MG_UNSAFE',
]);

/** Stops that mean only "come back within the review window, in person": the course has not ended. */
export const OUTSIDE_WINDOW_CODES: ReadonlySet<string> = new Set(['REVIEW_BEFORE_WINDOW', 'REVIEW_NOT_IN_PERSON']);

export const OUTSIDE_WINDOW_TEXT = 'outside the review window: return within the window (day 21 to day 30 after the last supply, accepted up to day 37), in person, to be reviewed by a pharmacist';

export interface CourseStatus {
  /** The course ended today. */
  ended: boolean;
  /** Why (empty where it has not ended). */
  reason: string;
  /** A review today was outside the window or not in person (the course has not ended). */
  outsideWindow: boolean;
}

/** Whether today's arm A consultation ends the course. Supply 1 exclusions never do (nothing was supplied, no course began). */
export function courseStatus(consent: MelConsent, history: MelHistory, alerts: MelAlert[], supplied: boolean): CourseStatus {
  if (consent.arm !== 'A') return { ended: false, reason: '', outsideWindow: false };
  const stops = alerts.filter((a) => a.severity === 'stop');
  const review = isArmAReview(consent, history);
  const ending = review ? stops.filter((a) => COURSE_ENDING_CODES.has(a.code)) : [];
  if (ending.length) return { ended: true, reason: ending.map((a) => a.message).join('; '), outsideWindow: false };
  if (supplied && history.supplyNumber === '3') return { ended: true, reason: 'supply 3, the last supply of the course, made today', outsideWindow: false };
  return { ended: false, reason: '', outsideWindow: review && stops.some((a) => OUTSIDE_WINDOW_CODES.has(a.code)) };
}

/**
 * Combined hormonal contraception or any other oestrogen named under
 * contraception (the method text). Used to cross-check the oestrogen answer.
 */
/** Combined hormonal contraception brands (each contains an oestrogen). */
const COMBINED_BRANDS =
  'nuvaring|evra|microgynon|rigevidon|ovranette|levest|yasmin|yaz\\b|qlaira|zoely|cilest|marvelon|gedarel|femodene|katya|millinette|lucette|eloine|logynon|triregol|brevinor|norimin|loestrin|mercilon|drovelis|sunya|femodette|lizinna|maexeni|ovysmen|synphase|binovum|norinyl|dianette|co-cyprindiol|clairette|cyproterone with ethinyl';

/** Oestrogen-containing products and keywords (HRT, vaginal oestrogen, conjugated oestrogens, combined contraception). */
const OESTROGEN_KEYWORDS = new RegExp(
  [
    'oestr',
    'estrog',
    'estradiol',
    'oestradiol',
    'estriol',
    'oestriol',
    'ethinyl',
    'conjugated (o)?estrogen',
    'evorel',
    'oestrogel',
    'femoston',
    'elleste',
    'kliofem',
    'kliovance',
    'premarin',
    'premique',
    'prempak',
    'sandrena',
    'estradot',
    'estraderm',
    'femseven',
    'lenzetto',
    'bedol',
    'zumenon',
    'progynova',
    'climaval',
    'indivina',
    'tridestra',
    'nuvelle',
    'novofem',
    'trisequens',
    'angeliq',
    'bijuva',
    'duavive',
    'vagifem',
    'vagirux',
    'imvaggis',
    'ovestin',
    'blissel',
    '\\bhrt\\b',
    'hormone replacement',
    'combined (oral )?(contracept|pill)',
    '\\bcoc\\b',
    '\\bchc\\b',
    COMBINED_BRANDS,
  ].join('|')
);

export function contraceptionContainsOestrogen(medical: MelMedical): boolean {
  if (medical.usingContraception !== 'yes') return false;
  const t = medical.contraceptiveMethod.toLowerCase();
  if (!t.trim()) return false;
  if (/progestogen[- ]only|\bpop\b|mini[- ]?pill/.test(t) && !/combined/.test(t)) return false;
  return /combined|\bpatch\b|\bring\b/.test(t) || OESTROGEN_KEYWORDS.test(t);
}

/**
 * Oestrogen-containing products named in the free-text current medicines list
 * (HRT in any form, vaginal oestrogen, combined hormonal contraception). The
 * matched words, so the oestrogen answer can be cross-checked.
 */
export function medicineListOestrogenMatches(medicines: MelMedicines): string[] {
  const t = medicines.fullMedicineList.toLowerCase();
  if (!t.trim()) return [];
  const global = new RegExp(OESTROGEN_KEYWORDS.source, 'g');
  return [...new Set(Array.from(t.matchAll(global), (m) => m[0].trim()))];
}

export function stopsBlockStep(alerts: MelAlert[], step: number): boolean {
  return alerts.some((a) => a.severity === 'stop' && (STOP_ORIGIN_STEP[a.code] ?? 0) <= step);
}

export function shouldBlockConsultation(alerts: MelAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}

/** Codes that call for a same-day referral (or 999). */
export const SAME_DAY_CODES: ReadonlySet<string> = new Set(['RED_FLAG_SELF_HARM', 'RED_FLAG_SAFEGUARDING', 'SAFEGUARDING_CARER_REQUEST']);

export function sameDayReferral(alerts: MelAlert[], screens: MelScreens, indication: MelIndication): boolean {
  if (alerts.some((a) => a.severity === 'stop' && SAME_DAY_CODES.has(a.code))) return true;
  if (alerts.some((a) => a.code === 'FALL_12_MONTHS') && screens.fallWithInjury) return true;
  if (alerts.some((a) => a.code === 'STOP_RULE_2_FALL') && indication.fallWhileTakingInjury) return true;
  if (alerts.some((a) => a.code === 'STOP_RULE_3_MOOD') && screens.selfHarmThoughts === 'yes') return true;
  return false;
}

export function emergencyReferral(alerts: MelAlert[], indication: MelIndication): boolean {
  return alerts.some((a) => a.code === 'STOP_RULE_4_ALLERGY') && indication.allergyEmergency;
}

// ─── Lists ───

export function raisersList(m: MelMedicines): string[] {
  return [
    m.cimetidine && 'cimetidine',
    m.ciprofloxacin && 'ciprofloxacin',
    m.norfloxacin && 'norfloxacin',
    m.verapamil && 'verapamil',
  ].filter(Boolean) as string[];
}

export function loweringList(m: MelMedicines): string[] {
  return [
    m.carbamazepine && 'carbamazepine',
    m.phenytoin && 'phenytoin',
    m.rifampicin && 'rifampicin',
    m.omeprazole && 'omeprazole',
    m.smoker && 'smoking',
  ].filter(Boolean) as string[];
}

export function insomniaCausingList(m: MelMedicines): string[] {
  return [
    m.decongestant && 'decongestant (pseudoephedrine, phenylephrine)',
    m.corticosteroid && 'corticosteroid',
    m.betaAgonist && 'beta-agonist',
    m.ssriSnriChanged && 'SSRI or SNRI started or changed before the insomnia began',
    m.stimulant && 'stimulant',
    m.levothyroxineRecent && 'levothyroxine recently started or increased',
    m.eveningDiuretic && 'diuretic taken in the evening',
  ].filter(Boolean) as string[];
}

// ─── The alerts ───

export function getMelatoninAlerts(
  patient: MelPatientDetails,
  consent: MelConsent,
  history: MelHistory,
  indication: MelIndication,
  screens: MelScreens,
  medical: MelMedical,
  medicines: MelMedicines,
  supply: MelSupply
): MelAlert[] {
  const alerts: MelAlert[] = [];
  const add = (severity: MelAlertSeverity, code: string, message: string, detail: string) => alerts.push({ severity, code, message, detail });
  const armA = consent.arm === 'A';
  const armB = consent.arm === 'B';
  const tech = isTechnician(consent);
  const supply1 = armA && history.supplyNumber === '1';
  const review = isArmAReview(consent, history);
  /** In arm B a pharmacy technician refers any red flag to the pharmacist, who makes the referral. */
  const techSuffix = armB && tech ? ' PHARMACY TECHNICIAN: refer to the pharmacist, who makes the referral set out here.' : '';
  const redFlag = (code: string, message: string, detail: string) => add('stop', code, message, `${detail}${techSuffix}`);

  // ── Patient ──
  if (patient.age !== null && patient.age >= 0 && patient.age < 18) {
    add('stop', 'AGE_UNDER_18', 'Aged under 18', 'Aged under 18. This PGD is for adults only. Refer a child or young person to their GP. This PGD has no children\'s arm and does not continue melatonin started for a child or young person.');
  }

  // ── Arm, role and consent ──
  if (consent.presentInPerson === 'no') {
    add('stop', 'NOT_PRESENT', 'The patient is not present in person', 'The patient is not present in person (a remote or telephone consultation). Face to face on the premises only. Do not supply. Explain why and what to do instead, and record the advice.');
  }
  if (armA && tech) {
    add('stop', 'ARM_A_TECHNICIAN', 'Arm A (insomnia) is pharmacist only', 'Arm A (insomnia): registered pharmacists only, because it depends on a diagnostic sift for secondary causes of insomnia and on off-label consent. A pharmacy technician who is asked for a further arm A supply passes the patient to a pharmacist.');
  }
  if (consent.requestByCarerOrRelative) {
    add('stop', 'SAFEGUARDING_CARER_REQUEST', 'ADULT SAFEGUARDING: request made by a relative or carer', 'The request is made by a relative or carer for an adult who is not present or who lacks capacity to consent. Do not supply. Follow the pharmacy\'s adult safeguarding procedure the same day, and contact the local authority adult safeguarding team where there is risk of harm. A relative or carer cannot request or consent on an adult\'s behalf under this PGD.');
  }
  if (consent.livesInCareHome) {
    add('stop', 'SAFEGUARDING_CARE_HOME', 'ADULT SAFEGUARDING: the patient lives in a care home', 'The patient lives in a care home. Do not supply. Refer care home residents to their GP.');
  }
  if (consent.lacksCapacity) {
    add('stop', 'LACKS_CAPACITY', 'Lacks capacity to consent', 'The patient is not present in person, lacks capacity to consent to this treatment, or declines. Refer, do not supply.');
  }
  if (consent.patientDeclined) {
    add('stop', 'PATIENT_DECLINED', 'The patient declines', armA ? 'Explain why and what to do instead. Give the sleep hygiene advice in Appendix 1 in every case, and signpost CBT-I. Document the reason, the advice and the referral.' : 'Explain why, give the non-drug jet lag advice in Appendix 3. Document the reason and the advice.');
  }
  if (armA && consent.acceptsOffLabel === 'no') {
    add('stop', 'OFF_LABEL_NOT_ACCEPTED', 'Does not consent to off-label treatment', 'Explicit consent to off-label treatment after the explanation under Counselling, with the consent statement in Appendix 4 signed by the patient, is an inclusion criterion. Give the sleep hygiene advice in Appendix 1 and signpost CBT-I.');
  }
  if (armA && consent.gpRegistered === 'no') {
    add('stop', 'GP_NOT_REGISTERED', 'Not registered with a GP', 'Registered with a GP is an inclusion criterion for arm A: the GP is informed within 7 days of supply 1 and at the end of the course.');
  }
  if (armA && consent.gpNotificationAgreed === 'no') {
    add('stop', 'GP_NOTIFICATION_DECLINED', 'Will not allow the GP to be told', 'A patient who will not allow the GP to be told is not supplied.');
  }

  // ── Previous course ended under stopping rule 2 (supply 1 gates and arm B) ──
  const gates = supply1GatesApply(consent, history);
  if ((gates || armB) && (history.previousStopRule2 === 'yes' || history.carriedForward?.stopRule2Found)) {
    add('stop', 'PREVIOUS_STOP_RULE_2', 'A previous melatonin course ended because of next-day drowsiness or a fall (stopping rule 2)', `Stopping rule 2 (next-day drowsiness that affects daily activities, or any fall while taking melatonin): no further supply under this PGD. Refer to the GP.${history.carriedForward?.stopRule2Found ? ' The pharmacy records show a stopping rule 2 stop.' : ''}`);
  }

  // ── Arm A: unverified course ──
  if (isUnverifiedReview(consent, history)) {
    add('caution', 'COURSE_UNVERIFIED', `Supply ${history.supplyNumber} not verified by the pharmacy records: the course is unverified`, history.recordLookup === 'found' ? `The records at this pharmacy show today as supply ${history.carriedForward?.expectedSupply ?? '?'}, not supply ${history.supplyNumber}. The reason and the supply 1 record are recorded, and every supply 1 gate that depends on the course history (previous courses, the 6 month interval, the two-course rule, a Circadin course, stopping rule 2) is applied.` : `No previous melatonin record for this patient was found at this pharmacy. The reason and the supply 1 record (reference and date) are recorded, and every supply 1 gate that depends on the course history (previous courses, the 6 month interval, the two-course rule, a Circadin course, stopping rule 2) is applied.`);
  }

  // ── Arm A: supply 1 chosen while the records show an open or recently lapsed course ──
  if (isRestartOverRecordedCourse(consent, history)) {
    const cf = history.carriedForward;
    add(
      'caution',
      'RESTART_OVER_RECORDED_COURSE',
      cf?.latestCourseState === 'open' ? 'Supply 1 chosen, but the records show an arm A course still open' : 'Supply 1 chosen, but the records show an arm A course that lapsed in the last 6 months',
      cf?.latestCourseState === 'open'
        ? `The records at this pharmacy show an arm A course open (last supply ${formatUkDate(cf.latestCourseLastSupplyDate)}), so today would be supply ${cf.expectedSupply}. The reason for starting a new course is recorded. A course is not restarted: at least 6 months from the end of one course to supply 1 of the next. If the course on record was made to this patient, do not supply.`
        : `The records at this pharmacy show an arm A course with no supply or review by day 37 after the supply on ${formatUkDate(cf?.latestCourseLastSupplyDate ?? '')}: that course ENDED on day 37, and supply 1 of a new course needs at least 6 months from that date. The reason is recorded.`
    );
  }

  // ── Arm A: course history ──
  if (gates) {
    if (patient.age !== null && patient.age >= 55) {
      add('info', 'AGE_55_CIRCADIN_ROUTE', 'Aged 55 and over: one route per course', 'May be eligible under this arm or under the separate Get Real Health Circadin PGD (licensed for primary insomnia from age 55). The pharmacist chooses one route for the course, records which and why, and does not switch within a course. Courses supplied under the Circadin PGD count towards this PGD\'s 6 month interval and two-course rule.');
    }
    if (history.inCircadinCourse === 'yes') {
      add('stop', 'IN_CIRCADIN_COURSE', 'Currently in a course under the Get Real Health Circadin PGD', 'Currently in a course under the Get Real Health Circadin PGD. One route per course.');
    }
    if (history.previousCourseEndDate && withinLastCalendarMonths(history.previousCourseEndDate, MONTHS_BETWEEN_COURSES)) {
      add('stop', 'PREVIOUS_COURSE_WITHIN_6_MONTHS', 'A previous course ended in the last 6 months', `${supply1 ? '' : 'Unverified course: '}Supply 1 requested within 6 months of the end of a previous course (ended ${formatUkDate(history.previousCourseEndDate)}). Between courses: at least 6 months from the end of one course to supply 1 of the next. Courses under the Circadin PGD count.`);
    }
    const total = totalPreviousCourses(history);
    if (total !== null && total >= COURSES_BEFORE_GP_REVIEW) {
      if (history.gpReviewDocumented === 'no') {
        add('stop', 'TWO_COURSES_NO_GP_REVIEW', `${total} previous courses and no documented GP review`, 'After two courses in total (courses under this PGD, and courses supplied under the Get Real Health Circadin PGD, counted for this PGD\'s limit), a further course only after a documented GP review (a letter, a record in the NHS App or Summary Care Record, or the GP\'s reply to the pharmacy). A patient who needs longer treatment is referred to the GP.');
      }
      if (history.gpReviewDocumented === 'yes' && history.gpReviewAdvisesAgainst) {
        add('stop', 'GP_REVIEW_ADVISES_AGAINST', 'The documented GP review advises against further melatonin', 'The GP review since the end of the most recent course must not advise against further melatonin. Refer to the GP.');
      }
      const reviewD = parseLocalDate(history.gpReviewDate);
      const endD = parseLocalDate(history.previousCourseEndDate);
      if (history.gpReviewDocumented === 'yes' && reviewD && endD && reviewD.getTime() < endD.getTime()) {
        add('stop', 'GP_REVIEW_BEFORE_COURSE_END', 'The GP review predates the end of the most recent course', 'Where the patient has already had two or more courses, a GP review SINCE THE END OF THE MOST RECENT COURSE is documented. This review is earlier than that course ended.');
      }
    }
  }
  if (review) {
    const day = reviewDay(history);
    if (history.reviewInPerson === 'no') {
      add('stop', 'REVIEW_NOT_IN_PERSON', 'The review was not in person', 'At supply 2 or supply 3: the review was not in person. Supply 2 and 3 are made only after an in-person review by a pharmacist.');
    }
    if (day !== null && day < REVIEW_WINDOW_START) {
      add('stop', 'REVIEW_BEFORE_WINDOW', `Day ${day} after the last supply: before the review window`, `THE REVIEW WINDOW (arm A) is day 21 to day 30 after a supply. Today is day ${day}: ask the patient to return from day 21 (${formatUkDate(formatLocalDate(addDays(parseLocalDate(history.lastSupplyDate) ?? todayLocal(), REVIEW_WINDOW_START)))}).`);
    }
    if (day !== null && day > REVIEW_ACCEPTED_UNTIL) {
      add('stop', 'REVIEW_AFTER_DAY_37', `Day ${day} after the last supply: the course has ended`, 'At supply 2 or supply 3: it is after day 37. After day 37 the course has ended, and any further supply is supply 1 of a new course (at least 6 months after this course ended). Inform the GP of the end of the course.');
    }
    if (day !== null && day > REVIEW_WINDOW_END && day <= REVIEW_ACCEPTED_UNTIL) {
      add('caution', 'REVIEW_LATE', `Day ${day} after the last supply: accepted, ${nightsWithoutTablets(history)} night(s) without tablets`, 'A review from day 31 to day 37 is still accepted: the patient will have been without tablets for up to 7 nights, which is recorded and does not restart the course.');
    }
    const cd = courseDay(history);
    if (cd !== null && cd + (ARM_A_TABLETS_PER_SUPPLY - 1) > COURSE_LAST_DAY) {
      add('stop', 'COURSE_SPAN_EXCEEDED', `Day ${cd} after supply 1: this supply would run past day 103`, 'The course total will not exceed three supplies, 90 tablets or day 103 after supply 1. A course spans no more than 104 calendar days from supply 1.');
    }
  }

  // ── Arm B: supply history ──
  if (armB) {
    if (history.armBSuppliesLast12Months !== null && history.armBSuppliesLast12Months >= ARM_B_MAX_SUPPLIES_12_MONTHS) {
      add('stop', 'ARM_B_FOUR_SUPPLIES', 'Four supplies under arm B in the last 12 months', 'Four supplies under this arm already made in the last 12 months. Refer to a prescriber.');
    }
    const openOnRecord = history.carriedForward?.latestCourseState === 'open';
    if (history.midArmACourse === 'yes' || openOnRecord) {
      add(
        'stop',
        'ARM_B_MID_ARM_A_COURSE',
        openOnRecord && history.midArmACourse !== 'yes' ? 'The pharmacy records show an arm A course still open' : 'In the middle of an arm A course',
        `A patient in the middle of an arm A course is not supplied under arm B: they take no more than one dose of melatonin a night.${openOnRecord ? ` The records at this pharmacy show an arm A course open (last supply ${formatUkDate(history.carriedForward?.latestCourseLastSupplyDate ?? '')}; the course ends if there is no review by day 37 after that supply).` : ''}`
      );
    }
    if (history.midCircadinCourse === 'yes') {
      add('stop', 'ARM_B_MID_CIRCADIN_COURSE', 'In the middle of a Circadin course', 'Not in the middle of an arm A course or a Circadin course is an inclusion criterion for arm B.');
    }
  }

  // ── Arm A: sleep assessment (supply 1) ──
  if (supply1) {
    if (indication.durationWeeks !== null && indication.durationWeeks < 4) {
      add('stop', 'INSOMNIA_UNDER_4_WEEKS', 'Insomnia present for less than 4 weeks', 'Insomnia present for less than 4 weeks. Give sleep hygiene advice; do not medicate a short-lived disturbance.');
    }
    if ((indication.nightsPerWeek !== null && indication.nightsPerWeek < 3) || indication.daytimeImpact === 'no') {
      add('stop', 'INSOMNIA_CRITERIA_NOT_MET', 'Inclusion criteria for insomnia not met', 'Difficulty getting to sleep, staying asleep, or waking early, on at least 3 nights a week for at least 4 weeks, affecting daytime functioning. Give the sleep hygiene advice in Appendix 1 and signpost CBT-I.');
    }
    if (indication.sleepHygieneRoute === 'neither') {
      add('stop', 'SLEEP_HYGIENE_NOT_TRIED', 'Sleep hygiene not yet tried for 2 weeks', 'SLEEP HYGIENE FIRST: the advice in Appendix 1 has been followed for at least 2 weeks before supply 1 without sufficient benefit; OR severe daytime impairment is documented. Give the advice in Appendix 1 in writing and signpost CBT-I.');
    }
    if (indication.sleepHygieneRoute === 'tried' && indication.sleepHygieneWeeks !== null && indication.sleepHygieneWeeks < 2) {
      add('stop', 'SLEEP_HYGIENE_NOT_TRIED', 'Sleep hygiene followed for less than 2 weeks', 'SLEEP HYGIENE FIRST: the advice in Appendix 1 has been followed for at least 2 weeks before supply 1 without sufficient benefit; OR severe daytime impairment is documented.');
    }
    if (indication.sleepHygieneRoute === 'severe-impairment') {
      add('info', 'SEVERE_IMPAIRMENT_ROUTE', 'Severe daytime impairment documented', 'Severe daytime impairment is documented (what it is, and why waiting 2 weeks is not reasonable), in which case sleep hygiene starts today alongside the course.');
    }
  }

  // ── Arm A: secondary causes, asked at every supply (1, 2 and 3) ──
  if (armA && history.supplyNumber) {
    if (indication.shiftWork === 'yes') {
      add('stop', 'SHIFT_WORK', 'Shift work', 'SHIFT WORK of any pattern suggests a circadian rhythm disorder and needs assessment. Refer to the GP; do not supply.');
    }
    if (indication.delayedSleepPattern === 'yes') {
      add('stop', 'DELAYED_SLEEP_PATTERN', 'Delayed sleep pattern', 'A delayed sleep pattern (falling asleep very late and sleeping late when free to do so) suggests a circadian rhythm disorder and needs assessment. Refer to the GP; do not supply.');
    }
    if (indication.caffeineUnaddressed === 'yes') {
      add('stop', 'CAFFEINE_NOT_ADDRESSED', 'Caffeine late in the day or in high amounts, not yet addressed', 'Caffeine late in the day or in high total amounts, not yet addressed. The insomnia is likely to be secondary. Give the sleep hygiene advice in Appendix 1; do not supply.');
    }
  }
  if (supply1 && indication.wishesShortCourse === 'no') {
    add('stop', 'NOT_WISHING_MEDICINE', 'Having been offered CBT-I, the patient does not wish to take a medicine', 'The patient, having been offered CBT-I, does not wish to take a short course of medicine. Not supplied: give the sleep hygiene advice in Appendix 1 in writing, signpost CBT-I, and record the advice.');
  }

  // ── Stopping rules (2) to (5): arm A review, or arm B report on a previous supply ──
  const stopRulesApply = review || (armB && history.previousJetLagSupply === 'yes');
  if (stopRulesApply) {
    if (indication.nextDayDrowsiness === 'yes') {
      add('stop', 'STOP_RULE_2_DROWSINESS', 'Stopping rule 2: next-day drowsiness affecting daily activities', 'Drowsiness the next day that affects daily activities: STOP, no further supply under this PGD, refer to the GP. Not managed by changing the dose.');
    }
    if (indication.fallWhileTaking === 'yes') {
      add('stop', 'STOP_RULE_2_FALL', 'Stopping rule 2: a fall while taking melatonin', `Any fall while taking melatonin: STOP, no further supply under this PGD, refer to the GP${indication.fallWhileTakingInjury ? ' THE SAME DAY (a fall with injury)' : ' (the same day if there has been a fall with injury)'}.`);
    }
    if (indication.newWorseMood === 'yes') {
      add('stop', 'STOP_RULE_3_MOOD', 'Stopping rule 3: new or worse low mood or anxiety', 'New or worse low mood or anxiety: STOP and refer to the GP, the same day if there are thoughts of self-harm.');
    }
    if (indication.allergySymptoms === 'yes') {
      add('stop', 'STOP_RULE_4_ALLERGY', 'Stopping rule 4: rash, swelling or difficulty breathing', indication.allergyEmergency ? 'Difficulty breathing or swelling of the lips or tongue is an EMERGENCY (999). STOP.' : 'Rash, swelling of the face, lips or tongue, or difficulty breathing: STOP; difficulty breathing or swelling of the lips or tongue is an emergency (999).');
    }
    if (indication.unacceptableSideEffect === 'yes') {
      add('stop', 'STOP_RULE_5_SIDE_EFFECT', 'Stopping rule 5: a side effect the patient finds unacceptable', 'Any other side effect the patient finds unacceptable: STOP, and the course ends. Not managed by changing the dose.');
    }
  }

  // ── Arm A: review rules (stopping rule 1) ──
  if (review) {
    const decision = armADoseDecision(patient, history, indication, medicines);
    const band = ratingBand(history, indication);
    if (decision?.stop && decision.stopCode === 'REVIEW_2_5MG_UNSAFE') {
      add('stop', 'REVIEW_2_5MG_UNSAFE', 'Review 2 on 5 mg: 5 mg is now unsafe, stop and refer', `${decision.text} END OF COURSE: the GP is informed, with this reason. No further melatonin under this PGD for 6 months.`);
    } else if (decision?.stop) {
      add('stop', 'STOP_RULE_1_NO_BETTER', `Stopping rule 1: NO BETTER at review ${history.supplyNumber === '2' ? '1' : '2'}`, `${decision.text} No further supply. END OF COURSE: the GP is informed. No further melatonin under this PGD for 6 months.`);
    } else if (band) {
      const provisional = !medicines.oestrogen && !!decision?.options.includes('5');
      add('info', 'REVIEW_BAND', `Sleep rating band: ${BAND_LABEL[band]}`, `${decision?.text ?? 'Record the rating and the band.'}${provisional ? ' PROVISIONAL: 5 mg depends on the oestrogen question (Medicines step) and the age; it is confirmed on the Dose and Supply step.' : ''}`);
    }
  }

  // ── Arm B: journey ──
  if (armB) {
    if (indication.byAir === 'no') {
      add('stop', 'JET_LAG_NOT_BY_AIR', 'Not a journey by air', 'Arm B covers adults travelling by air across 5 or more time zones. Anyone who fits neither arm is referred and given the relevant advice (Appendix 3).');
    }
    if (indication.timeZones !== null && indication.timeZones < 5) {
      add('stop', 'JET_LAG_UNDER_5_ZONES', 'Fewer than 5 time zones', 'A planned journey crossing 5 or more time zones is an inclusion criterion. Give the non-drug jet lag advice in Appendix 3.');
    }
    if (indication.insomniaAtHome === 'yes') {
      add('stop', 'JET_LAG_INSOMNIA_AT_HOME', 'Insomnia at home rather than jet lag', 'Insomnia at home rather than jet lag. Refer to a pharmacist to consider arm A.');
    }
    if (indication.safetyCriticalDuringTrip === 'yes') {
      add('stop', 'JET_LAG_SAFETY_CRITICAL_TRIP', 'Pilot, aircrew, air traffic controller or safety-critical duty during the trip', 'Pilots, aircrew, air traffic controllers, or anyone who will be on safety-critical duty during the trip. Refer to their aviation medical examiner or occupational health service.');
    }
    if (indication.wants5mg) {
      const why = armB5mgBlockedReason(patient, indication, medicines);
      if (why) add('info', 'ARM_B_5MG_NOT_MET', '5 mg criteria not met: 3 mg only', `For 5 mg (Adaflex 5 mg only) every criterion must be met; here ${why}.`);
    }
  }

  // ── Red flags (both arms) ──
  if (armA || armB) {
    const sb = stopBangTotal(screens, patient);
    const ep = epworthTotal(screens);
    const phq = phqTotal(screens);
    const gad = gadTotal(screens);
    const apnoea = armA ? sb >= 5 || screens.sbObserved || (ep !== null && ep > 10) : screens.apnoeaSymptom || screens.sbObserved;
    if (apnoea) {
      const why = armA
        ? [sb >= 5 && `STOP-Bang ${sb}`, screens.sbObserved && 'witnessed pauses in breathing, choking or gasping', ep !== null && ep > 10 && `Epworth ${ep}`].filter(Boolean).join('; ')
        : 'described as a symptom';
      redFlag('RED_FLAG_SLEEP_APNOEA', `POSSIBLE SLEEP APNOEA (${why})`, 'STOP-Bang score of 5 or more, or witnessed pauses in breathing, choking or gasping in sleep at any score, or an Epworth Sleepiness Scale score above 10. Do not supply; refer to the GP. Snoring with daytime sleepiness needs a sleep apnoea assessment.');
    }
    const mood = armA ? (phq !== null && phq >= 3) || (gad !== null && gad >= 3) || screens.moodDrivesSleep : screens.moodAnxietySymptom || screens.moodDrivesSleep;
    if (mood) {
      const why = armA ? [phq !== null && phq >= 3 && `PHQ-2 ${phq}`, gad !== null && gad >= 3 && `GAD-2 ${gad}`, screens.moodDrivesSleep && 'anxiety or low mood drives the sleep problem'].filter(Boolean).join('; ') : 'described as a symptom';
      redFlag('RED_FLAG_DEPRESSION_ANXIETY', `DEPRESSION OR ANXIETY (${why})`, 'PHQ-2 score of 3 or more, or GAD-2 score of 3 or more, or anxiety or low mood that the patient says drives the sleep problem. Do not supply; refer to the GP. Low mood needs a mood assessment.');
    }
    if (screens.selfHarmThoughts === 'yes') {
      redFlag('RED_FLAG_SELF_HARM', 'THOUGHTS OF SELF-HARM OR SUICIDE: same-day referral', `ANY thoughts of self-harm or suicide, whatever the scores: same-day referral (GP, NHS 111, or 999 if there is immediate risk), and do not leave a person at immediate risk alone.${screens.immediateRisk ? ' IMMEDIATE RISK: call 999 and do not leave the person alone.' : ''}`);
    }
    if (screens.thyroid) redFlag('RED_FLAG_THYROID', 'POSSIBLE OVERACTIVE THYROID', 'Palpitations, tremor, heat intolerance, sweating, or weight loss without trying. Do not supply; refer to the GP.');
    if (screens.menopausal) redFlag('RED_FLAG_MENOPAUSAL', 'MENOPAUSAL SYMPTOMS', 'Night sweats or hot flushes that wake the patient. Do not supply; refer to the GP to consider treating the cause.');
    if (screens.restlessLegs) redFlag('RED_FLAG_RESTLESS_LEGS', 'RESTLESS LEGS', 'Restless legs (an urge to move the legs at night relieved by movement). Do not supply; refer to the GP.');
    if (screens.pain) redFlag('RED_FLAG_PAIN', 'Pain that prevents sleep or wakes the patient', 'Pain that prevents sleep or wakes the patient. Do not supply; refer to the GP.');
    if (screens.nocturia) redFlag('RED_FLAG_NOCTURIA', 'Waking repeatedly to pass urine', 'Waking repeatedly to pass urine. Do not supply; refer to the GP.');
    if (screens.orthopnoea) redFlag('RED_FLAG_ORTHOPNOEA', 'Breathlessness when lying flat', 'Breathlessness when lying flat. Do not supply; refer to the GP.');
    if (screens.newNeuro) redFlag('RED_FLAG_NEURO', 'A new neurological symptom', 'A new neurological symptom. Do not supply; refer to the GP.');
    if (screens.recreationalDrugs || screens.withdrawal) {
      redFlag('RED_FLAG_RECREATIONAL_DRUGS', 'RECREATIONAL DRUGS or withdrawal', 'Current use of recreational drugs, or insomnia during withdrawal from cannabis, alcohol or another substance. Do not supply; refer to the GP or a local drug and alcohol service.');
    }
    if (screens.alcoholToSleep || screens.harmfulDrinking) {
      redFlag('RED_FLAG_ALCOHOL', 'Alcohol used to get to sleep, or a harmful drinking pattern', 'Alcohol used to get to sleep, or a harmful drinking pattern. Do not supply; refer to the GP or a local drug and alcohol service.');
    }
    if (screens.narcolepsyParasomnia) {
      redFlag('RED_FLAG_NARCOLEPSY_PARASOMNIA', 'Suspected narcolepsy or a parasomnia', 'Falling asleep suddenly in the day, collapse with emotion (cataplexy), acting out dreams, or sleepwalking with injury: suspect narcolepsy or a parasomnia; do not supply; refer to the GP for a sleep service.');
    }
    if (screens.cognition) {
      redFlag('RED_FLAG_COGNITION', 'New confusion or memory problems, or dementia', 'New confusion or memory problems, or a diagnosis of dementia: do not supply (NICE NG97: do not offer melatonin for insomnia in Alzheimer\'s disease); refer to the GP.');
    }
    if (screens.safeguardingConcern) {
      redFlag('RED_FLAG_SAFEGUARDING', 'ADULT SAFEGUARDING concern', 'Any concern of abuse, neglect, coercion or exploitation (including someone asking for melatonin to sedate another adult). Do not supply. Follow the pharmacy\'s adult safeguarding procedure the same day, and contact the local authority adult safeguarding team where there is risk of harm.');
    }
    if (screens.fallLast12Months === 'yes') {
      redFlag('FALL_12_MONTHS', `A fall in the last 12 months${screens.fallWithInjury ? ' (with injury)' : ''}`, `FALLS: ONE DEFINITION FOR THE WHOLE PGD. In the last 12 months: any fall (including any fall with injury): refer, do not supply.${screens.fallWithInjury ? ' A fall with injury is a same-day referral.' : ''}`);
    }
  }

  // ── Medical history (both arms) ──
  if (armA || armB) {
    if (medical.hypersensitivity) add('stop', 'HYPERSENSITIVITY', 'Hypersensitivity to melatonin or an excipient', 'Hypersensitivity to melatonin or to any excipient of the product to be supplied. Refer, do not supply.');
    if (medical.hepatic) add('stop', 'HEPATIC_IMPAIRMENT', 'Hepatic impairment, cirrhosis or chronic liver disease', 'Hepatic impairment of any degree, cirrhosis or chronic liver disease (the SmPC: clearance is reduced in cirrhosis; not recommended in moderate or severe hepatic impairment; this PGD refers at any degree).');
    if (medical.renalSevere) add('stop', 'RENAL_SEVERE', 'Severe renal impairment or dialysis', 'Severe renal impairment (known eGFR below 30 ml/min/1.73m2) or dialysis. Refer, do not supply.');
    if (medical.renalLesser && !medical.renalSevere) {
      if (armB && tech) {
        add('stop', 'RENAL_TECHNICIAN', 'Known renal impairment: refer to a pharmacist', 'KNOWN RENAL IMPAIRMENT short of severe: refer to a pharmacist (a pharmacy technician does not supply). The pharmacist supplies only where satisfied it is mild and stable; the effect on melatonin has not been studied.');
      } else if (medical.renalMildStable === 'no') {
        add('stop', 'RENAL_NOT_MILD_STABLE', 'Renal impairment: not satisfied it is mild and stable', 'RENAL IMPAIRMENT short of severe: caution; the effect on melatonin has not been studied. Supply only where the pharmacist is satisfied it is mild and stable.');
      } else {
        add('caution', 'RENAL_CAUTION', 'Renal impairment short of severe', 'RENAL IMPAIRMENT short of severe: caution; the effect on melatonin has not been studied. Supply only where the pharmacist is satisfied it is mild and stable.');
      }
    }
    if (medical.autoimmune) add('stop', 'AUTOIMMUNE', 'Autoimmune disease', 'AUTOIMMUNE DISEASE, whether active or quiescent. The immediate-release SmPCs state that there are no data on melatonin in autoimmune disease, that occasional case reports have described exacerbation, and that melatonin tablets are not recommended.');
    if (medical.epilepsy) add('stop', 'EPILEPSY', 'Epilepsy or a history of seizures', 'Epilepsy or any history of seizures (the SmPC: melatonin has been reported to increase, decrease or not affect seizure frequency; this PGD refers rather than supplies).');
    if (medical.diabetes) add('caution', 'DIABETES', 'Diabetes or impaired glucose tolerance', 'Melatonin taken close to a carbohydrate-rich meal may impair glucose control for several hours. The no-food rule (2 hours before and 2 hours after a dose) applies to everyone; in diabetes the dose should ideally be at least 3 hours after a meal. Advise more frequent glucose monitoring where the patient monitors.');
    if (patient.sex === 'female') {
      if (medical.pregnant === 'yes') add('stop', 'PREGNANT', 'Pregnant or possibly pregnant', 'Pregnancy, possible pregnancy, planning a pregnancy, or breastfeeding. Refer, do not supply.');
      if (medical.breastfeeding) add('stop', 'BREASTFEEDING', 'Breastfeeding', 'Pregnancy, possible pregnancy, planning a pregnancy, or breastfeeding. Refer, do not supply.');
      if (medical.planningPregnancy) add('stop', 'PLANNING_PREGNANCY', 'Planning a pregnancy', 'Pregnancy, possible pregnancy, planning a pregnancy, or breastfeeding. Refer, do not supply.');
      if (medical.childbearingPotential === 'yes' && medical.usingContraception === 'no') {
        add('stop', 'NO_CONTRACEPTION', 'Childbearing potential and not using contraception', 'A woman of childbearing potential who is not using contraception (the SmPC: not recommended).');
      }
    }
    if (armB && medical.lactoseIntolerance) {
      add('info', 'LACTOSE_COLONIS', 'Lactose: do not supply the Colonis tablet', 'For the Melatonin 3 mg film-coated tablet (Colonis): rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption (it contains lactose). Supply Adaflex 3 mg instead, which contains none.');
    }
    if (armB && patient.sex === 'male' && supply.product === 'colonis-3' && medical.manPlanningPregnancy === 'yes') {
      add('caution', 'MAN_PLANNING_PREGNANCY_COLONIS', 'Man planning a pregnancy: Colonis tablet', 'MEN PLANNING A PREGNANCY: the Colonis SmPC (section 4.6) states that Melatonin 3 mg film-coated tablets are not recommended in women and men planning pregnancy (high doses and use for longer than indicated may compromise fertility). Counsel him on this point and record the advice.');
    }
  }

  // ── Medicines and occupation (both arms) ──
  if (armA || armB) {
    if (medicines.fluvoxamine) add('stop', 'FLUVOXAMINE', 'Taking fluvoxamine', 'Taking FLUVOXAMINE. Refer, do not supply.');
    if (medicines.hypnotic) add('stop', 'HYPNOTIC', 'Taking a benzodiazepine, z-drug, daridorexant or other prescribed hypnotic', 'Taking any benzodiazepine, z-drug (zopiclone, zolpidem, zaleplon), daridorexant or other prescribed hypnotic. Refer, do not supply.');
    if (medicines.vka) add('stop', 'VITAMIN_K_ANTAGONIST', 'Taking warfarin or another vitamin K antagonist', 'Taking WARFARIN or another vitamin K antagonist. Refer, do not supply.');
    if (medicines.psoralen) add('stop', 'PSORALEN', 'Taking 5-methoxypsoralen or 8-methoxypsoralen', 'Taking 5-methoxypsoralen or 8-methoxypsoralen. Refer, do not supply.');
    if (medicines.prescribedMelatonin === 'yes') {
      redFlag('PRESCRIBED_MELATONIN', 'ALREADY PRESCRIBED MELATONIN', 'ALREADY PRESCRIBED MELATONIN by a doctor or other prescriber, for any reason: do not supply; refer back to the prescriber.');
    }
    if (medicines.otherSourceMelatonin === 'yes' && medicines.otherMelatoninWillingStop === 'no') {
      add('stop', 'OTHER_MELATONIN_NOT_STOPPING', 'Taking melatonin from another source and not willing to stop', 'Taking melatonin from any other source (bought abroad, online, or sold as a supplement) and not willing to stop it. Refer, do not supply. Tell the patient it is unregulated in the UK and that the dose on the label may not be what is in the product.');
    }
    if (medicines.otherSourceMelatonin === 'yes' && medicines.otherMelatoninWillingStop === 'yes') {
      add('info', 'OTHER_MELATONIN_STOPPING', 'Agrees to stop melatonin from another source', 'Where the patient agrees to stop, record the product. One dose of melatonin a night, never more than 5 mg in 24 hours, counting every melatonin product from any source.');
    }
    if (oestrogen(medicines)) {
      add('caution', 'OESTROGEN_3MG_MAX', 'Oestrogen: 3 mg maximum', 'OESTROGENS: combined hormonal contraception containing ethinylestradiol can raise melatonin levels 4 to 5 fold (Adaflex SmPC). The SmPC reports that HRT delays the melatonin peak without other effect on concentration; as a precaution this PGD treats every medicine containing an oestrogen the same way. 3 MG MAXIMUM for any patient taking an oestrogen, in both arms; never 5 mg.');
    }
    if (aged65(patient)) {
      add('caution', 'AGE_65_3MG_MAX', 'Aged 65 and over: 3 mg maximum', 'AGED 65 AND OVER: the SmPC advises caution and individual dosage because it is unclear whether older people are more sensitive. 3 MG MAXIMUM; never 5 mg.');
    }
    const raisers = raisersList(medicines);
    if (raisers.length && medicines.sedating) {
      add('stop', 'RAISER_WITH_SEDATING', `${raisers.join(', ')} with another sedating medicine`, 'OTHER MEDICINES THAT RAISE MELATONIN LEVELS: cimetidine, ciprofloxacin, norfloxacin and verapamil. Where the patient takes one of these AND another sedating medicine (an opioid, a gabapentinoid, a sedating antihistamine, a tricyclic antidepressant, an antipsychotic, or any other medicine that causes drowsiness), refer instead of supplying.');
    } else if (raisers.length) {
      add('caution', 'RAISER', `${raisers.join(', ')}: raises melatonin levels`, 'Supply with counselling about increased drowsiness, and record it.');
    } else if (medicines.sedating) {
      add('caution', 'SEDATING', 'Another sedating medicine', 'OTHER SEDATING MEDICINES taken without one of the medicines above: supply with counselling about additive drowsiness.');
    }
    const lowering = loweringList(medicines);
    if (lowering.length) {
      add('caution', 'LOWERING', `${lowering.join(', ')}: lowers melatonin levels`, 'MEDICINES THAT LOWER MELATONIN LEVELS: carbamazepine, phenytoin, rifampicin, omeprazole, and smoking (smoking halves exposure; starting or stopping smoking changes the effect). Not an exclusion; tell the patient the effect may be less, and record it.');
    }
    if (medicines.ccb) {
      add('caution', 'CALCIUM_CHANNEL_BLOCKER', 'Nifedipine or another calcium channel blocker', 'Melatonin may reduce their blood pressure lowering effect. Not an exclusion; advise the patient to keep any planned blood pressure checks and to tell their prescriber they are taking melatonin.');
    }
    if (medicines.alertAtNight) {
      add('caution', 'ALERT_AT_NIGHT', 'Must be alert at night', 'A patient who must be alert at night (for example a carer, or a parent of an infant) is counselled specifically, and the advice is recorded.');
    }
  }
  if (armA) {
    const causing = insomniaCausingList(medicines);
    if (causing.length) {
      add('stop', 'INSOMNIA_CAUSING_MEDICINE', `A medicine that could be causing the insomnia: ${causing.join('; ')}`, 'A medicine that could be causing the insomnia, for example a DECONGESTANT (pseudoephedrine, phenylephrine), a corticosteroid, a beta-agonist, an SSRI or SNRI started or changed before the insomnia began, a stimulant, levothyroxine recently started or increased, or a diuretic taken in the evening. Refer to the GP; do not supply.');
    }
    if (medicines.safetyCriticalWork === 'yes') {
      add('stop', 'SAFETY_CRITICAL_WORK', 'Professional driver or safety-critical worker', 'PROFESSIONAL DRIVERS AND SAFETY-CRITICAL WORKERS: anyone who drives for a living (including taxi, delivery, bus, lorry and emergency vehicle drivers), pilots and aircrew, train drivers, air traffic controllers, operators of dangerous machinery, and anyone working at height or in another role where next-day drowsiness is a safety risk. Refer to the GP (NICE CKS advises specialist advice for occupational at-risk groups).');
    }
  }

  return alerts;
}

/** Codes of the cautions that must be acknowledged before supply. */
export function cautionCodes(alerts: MelAlert[]): string[] {
  return alerts.filter((a) => a.severity === 'caution').map((a) => a.code);
}

// ─── GP notification (Appendix 5) ───

export function gpNotificationText(args: {
  patient: MelPatientDetails;
  history: MelHistory;
  supply: MelSupply;
  screens: MelScreens;
  alerts: MelAlert[];
  supplied: boolean;
  pharmacyName: string;
  pharmacistName: string;
  course: CourseStatus;
}): string {
  const { patient, history, supply, screens, alerts, supplied, pharmacyName, pharmacistName, course } = args;
  const product = supply.product ? PRODUCTS[supply.product] : null;
  const sb = stopBangTotal(screens, patient);
  const ep = epworthTotal(screens);
  const lines: string[] = [];
  lines.push(`Re: ${patient.firstName} ${patient.lastName}, date of birth ${formatUkDate(patient.dateOfBirth)}${patient.nhsNumber ? `, NHS number ${patient.nhsNumber}` : ''}`);
  lines.push('');
  if (supplied && product) {
    lines.push(`Your patient was seen in person at ${pharmacyName || 'this pharmacy'} today and supplied melatonin for insomnia under the Get Real Health PGD Melatonin 5 mg for Adults: Insomnia and Jet Lag, version 001, arm A.`);
    lines.push(`This is OFF-LABEL use of a licensed medicine: Adaflex is licensed for jet lag in adults and for insomnia in children aged 6 to 17 with ADHD, not for insomnia in adults. The patient was told this and signed a consent statement.`);
    lines.push(`Supply ${history.supplyNumber} of a course of up to three: ${product.name}, ${product.plNumber}, ${supply.dose} mg once nightly 1 to 2 hours before bedtime, 30 tablets.`);
  } else {
    lines.push(`Your patient was seen in person at ${pharmacyName || 'this pharmacy'} today about melatonin for insomnia under the Get Real Health PGD Melatonin 5 mg for Adults: Insomnia and Jet Lag, version 001, arm A (off-label). No melatonin was supplied today.`);
  }
  lines.push(`Screens: PHQ-2 ${phqTotal(screens) ?? 'not recorded'}, GAD-2 ${gadTotal(screens) ?? 'not recorded'}, STOP-Bang ${sb}, Epworth ${ep ?? 'not recorded'}.`);
  if (history.baselineRating !== null) lines.push(`Baseline sleep quality rating (0 to 10) at supply 1: ${history.baselineRating}.`);
  const stops = alerts.filter((a) => a.severity === 'stop');
  if (course.ended && supplied) {
    lines.push('END OF COURSE: this is supply 3, the last supply of the course. No further melatonin under this PGD for 6 months; after two courses in total, none until a GP review is documented.');
  } else if (course.ended) {
    lines.push(`END OF COURSE: ${course.reason}. No further melatonin under this PGD for 6 months.`);
  } else if (!supplied && stops.length) {
    const what = history.supplyNumber === '1' || !history.supplyNumber ? 'NOT SUPPLIED' : `NOT SUPPLIED today (supply ${history.supplyNumber}); the course has not ended`;
    lines.push(`${what}: ${stops.map((a) => a.message).join('; ')}.`);
  } else if (supplied) {
    lines.push('The patient will be reviewed in person by a pharmacist on day 21 to day 30 after this supply before any further supply. You will be informed at the end of the course.');
  }
  lines.push('Sleep hygiene advice was given and cognitive behavioural therapy for insomnia was signposted.');
  lines.push('');
  lines.push(`${pharmacistName || 'Pharmacist'}, ${pharmacyName || ''}`.trim());
  return lines.join('\n');
}

/** Counselling items required for this arm and patient, label and value. */
export function counsellingItems(
  arm: MelConsent['arm'],
  c: MelCounselling,
  opts: { maleColonisPlanning: boolean; supplyNumber: string }
): [keyof MelCounselling, string, boolean][] {
  const items: [keyof MelCounselling, string, boolean][] = [];
  if (arm === 'A') {
    items.push(
      ['sleepHygieneWritten', 'Sleep hygiene advice (Appendix 1) given in writing as well as in conversation', c.sleepHygieneWritten],
      ['cbtiSignpostedRecorded', 'CBT-I signposted (NHS Talking Therapies self-referral, or a digital CBT-I programme recommended by NICE)', c.cbtiSignpostedRecorded],
      ['oneTabletTiming', 'One tablet a night, 1 to 2 hours before bed. Do not eat for 2 hours before or 2 hours after taking it', c.oneTabletTiming],
      ['missedDose', 'Missed dose: skip it; do not take it later in the night or double the next dose', c.missedDose],
      ['drowsinessDriving', 'It may make you drowsy. Do not drive or use machinery if you are affected, especially the morning after the first few nights. Do not drink alcohol with it', c.drowsinessDriving],
      ['gettingUpAtNight', 'Take care getting up in the night: sit on the edge of the bed for a moment first, put a light on, and keep the way to the toilet clear', c.gettingUpAtNight],
      ['reviewWindowTold', opts.supplyNumber === '3' ? 'This is the last supply of the course: no further melatonin under this PGD for 6 months, and the GP is informed' : 'Come back in person on day 21 to day 30 after this supply (today is day 0), before your tablets run out, if you want to continue. If your sleep has not improved, we will stop it and suggest you see your GP', c.reviewWindowTold],
      ['stopRulesTold', 'Stop and contact us or your GP if you feel drowsy in the day, have a fall, or feel low or anxious. Seek help the same day if you have thoughts of harming yourself. Call 999 for swelling of the lips or tongue or difficulty breathing', c.stopRulesTold],
      ['noOtherMelatonin', 'Do not take any other melatonin, including supplements, while you are taking this. The sleep habits in the leaflet matter more than the tablets; keep them going after the course ends', c.noOtherMelatonin],
      ['writtenInfoGiven', "Written information: the manufacturer's leaflet (which describes the licensed uses, not insomnia in adults), Appendix 1, a copy of the signed consent statement, and a written note of the review window and the stopping rules", c.writtenInfoGiven],
    );
  }
  if (arm === 'B') {
    items.push(
      ['jlTiming', 'Take it at bedtime at your destination, starting on the first night there, for no more than 5 nights. Not before 8pm or after 4am local time, and never on the plane. Missed dose: skip it; do not take it after 04:00 local time', c.jlTiming],
      ['jlFoodAlcohol', 'Do not eat for 2 hours before or 2 hours after a dose, and do not drink alcohol while you are taking it', c.jlFoodAlcohol],
      ['jlCaffeine', 'Limit caffeine (coffee, tea, cola, energy drinks), especially later in the day: a lot of caffeine can increase the effect of melatonin and keep you awake', c.jlCaffeine],
      ['jlDrowsinessDriving', 'It can make you drowsy. Do not take it on a night before you need to drive or work with machinery, and do not drive if you feel drowsy. Take care getting up in the night in an unfamiliar room', c.jlDrowsinessDriving],
      ['jlImportRules', 'BEFORE YOU TRAVEL, check the rules of the country you are going to. Carry it in the labelled container, in your hand luggage, with the pharmacy record of the supply', c.jlImportRules],
      ['jlAppendix3', 'Leaflet and the jet lag advice in Appendix 3 given, with the timing rules written out for this trip. Daylight at the right time of day does as much as the tablets', c.jlAppendix3],
      ['jlStopRash', 'Stop taking it for a rash, swelling, or if it makes you feel unwell. Call the emergency number of the country you are in for swelling of the lips or tongue or difficulty breathing', c.jlStopRash],
      ['jlReportSideEffects', 'Tell the pharmacy of any side effect on return', c.jlReportSideEffects],
    );
  }
  items.push(['unlicensedWarning', 'Melatonin sold as a food supplement or bought online is unregulated in the UK and the dose on the label may not be what is in the product', c.unlicensedWarning]);
  if (opts.maleColonisPlanning) items.push(['menPregnancyColonisAdvice', 'Man planning a pregnancy: counselled that the Colonis SmPC does not recommend the tablet in men planning pregnancy (fertility), and the advice recorded', c.menPregnancyColonisAdvice]);
  return items;
}

export { ARM_A_MAX_SUPPLIES };
