import type { ClinicalAlert } from '../../shared/types';
import type {
  DCbti,
  DConsent,
  DCourse,
  DDriving,
  DMedical,
  DMedicines,
  DPatientDetails,
  DScreening,
  DSleep,
  DSupply,
  DayName,
  Strength,
} from './daridorexant-types';
import {
  ADHERENCE_MIN_NIGHTS,
  ADHERENCE_WINDOW_NIGHTS,
  DARIDOREXANT_PGD_VERSION,
  DAYS,
  INTERVAL_MAX_DAYS,
  INTERVAL_MIN_DAYS,
  MAX_NIGHTS_WITHOUT_TABLETS,
  PRODUCTS,
  VISIT3_WITHIN_DAYS_OF_SUPPLY1,
} from './daridorexant-types';

export { DARIDOREXANT_PGD_VERSION };

// ─── Steps ───

export const STEP_LABELS = [
  'Patient Details',
  'Consent',
  'Visit and Course',
  'Sleep History and Diary',
  'CBT-I',
  'Screening',
  'Medical and Mental Health',
  'Medicines and SCR',
  'Driving Plan',
  'Review and Supply',
  'Counselling',
  'Summary',
] as const;

export const STEP = {
  patient: 0,
  consent: 1,
  course: 2,
  sleep: 3,
  cbti: 4,
  screening: 5,
  medical: 6,
  medicines: 7,
  driving: 8,
  supply: 9,
  counselling: 10,
  summary: 11,
} as const;

// ─── Dates ───
// "Today" and every day count are taken on the Europe/London calendar, so a
// device clock in another time zone, or a consultation after midnight UTC in
// British Summer Time, cannot move a date by a day. Calendar dates are held as
// YYYY-MM-DD and differences are computed on day numbers, not local Dates.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Day number (days since 1970-01-01) of a YYYY-MM-DD calendar date, or null. */
export function dayNumber(iso: string): number | null {
  const m = ISO_RE.exec(iso || '');
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return Math.round(t / 86400000);
}

export function isoFromDayNumber(n: number): string {
  const d = new Date(n * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Today's date on the Europe/London calendar (YYYY-MM-DD). */
export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const n = dayNumber(iso);
  return n === null ? '' : isoFromDayNumber(n + days);
}

/** Calendar days from a to b (positive when b is later). */
export function daysBetween(a: string, b: string): number | null {
  const x = dayNumber(a);
  const y = dayNumber(b);
  return x === null || y === null ? null : y - x;
}

/** Calendar date for display only (never used for arithmetic). */
export function parseLocalDate(iso: string): Date | null {
  const m = ISO_RE.exec(iso || '');
  if (!m || dayNumber(iso) === null) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function formatUk(iso: string): string {
  const d = parseLocalDate(iso);
  if (!d) return iso || 'not recorded';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Calendar days from the date to today on the London calendar (positive when the date is in the past). */
export function daysSince(iso: string): number | null {
  return daysBetween(iso, todayIso());
}

export function isExpired(expiryDate: string): boolean {
  const d = daysSince(expiryDate);
  return d !== null && d > 0;
}

/** Age in whole years on a calendar date, from the date of birth as a calendar date (no time zone conversion). */
export function ageOn(dob: string, asOf: string = todayIso()): number | null {
  const b = ISO_RE.exec(dob || '');
  const t = ISO_RE.exec(asOf || '');
  if (!b || !t || dayNumber(dob) === null || dayNumber(asOf) === null) return null;
  let age = Number(t[1]) - Number(b[1]);
  const md = Number(t[2]) * 100 + Number(t[3]) - (Number(b[2]) * 100 + Number(b[3]));
  if (md < 0) age--;
  return age;
}

/** Milliseconds offset of Europe/London from UTC at an instant. */
function londonOffsetMs(instant: number): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** A London wall-clock date and time (YYYY-MM-DD, HH:MM) as an instant in ms, or null. */
export function londonInstant(iso: string, time: string): number | null {
  const n = dayNumber(iso);
  const t = parseTime(time);
  if (n === null || t === null) return null;
  const wall = n * 86400000 + t * 60000;
  let guess = wall - londonOffsetMs(wall);
  guess = wall - londonOffsetMs(guess);
  return guess;
}

/** "HH:MM" to minutes after midnight. */
export function parseTime(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// ─── Visit and supply number ───

export const isVisit1 = (c: DCourse) => c.visitType === 'visit1';
export const isVisit2 = (c: DCourse) => c.visitType === 'visit2';
export const isVisit3 = (c: DCourse) => c.visitType === 'visit3';
export const isReviewVisit = (c: DCourse) => c.visitType === 'visit2' || c.visitType === 'visit3';

/** A supply 1 record for this course was found in this pharmacy's records. */
export const hasSupply1Record = (c: DCourse) => !!c.carried && c.carried.suppliesOnRecord >= 1 && !!c.carried.supply1Date;

/**
 * The supply 1 assessment (sleep history and diary, CBT-I gate, ISI 15 or
 * more, Epworth, STOP-Bang) applies at supply visit 1 and whenever no supply 1
 * record is found, whatever visit is selected: a course that cannot be
 * verified from the records is assessed in full.
 */
export const needsFullAssessment = (c: DCourse) => !!c.visitType && c.visitType !== 'after3' && (isVisit1(c) || !hasSupply1Record(c));

/** Supplies on record at this pharmacy (0 where none or not looked up). */
export const suppliesOnRecord = (c: DCourse) => c.carried?.suppliesOnRecord ?? 0;

/** The supply number made today, counted from the first supply and never reset. */
export function supplyNumber(c: DCourse): 1 | 2 | 3 | null {
  if (c.visitType === 'visit1') return 1;
  if (c.visitType === 'visit2') return 2;
  if (c.visitType === 'visit3') return 3;
  return null;
}

/** Age at the first supply: today at visit 1, otherwise on the date of supply 1. */
export function ageAtFirstSupply(patient: DPatientDetails, c: DCourse): number | null {
  if (isVisit1(c) || !c.visitType) return patient.age;
  if (!c.supply1Date) return null;
  return ageOn(patient.dateOfBirth, c.supply1Date);
}

/** Days since the previous supply (supply 1 at visit 2; supply 2 at visit 3). */
export function intervalDays(c: DCourse): number | null {
  return isReviewVisit(c) ? daysSince(c.previousSupplyDate) : null;
}

/** The 35-day limit, extended by recorded withheld nights. */
export function intervalMaxDays(c: DCourse): number {
  return INTERVAL_MAX_DAYS + Math.max(0, c.withheldNights ?? 0);
}

/** The 25-day minimum does not apply to supply 2 made under the mid-course regular moderate CYP3A4 inhibitor rule. */
export function intervalMinDays(c: DCourse): number {
  if (isVisit2(c) && c.midCourseInhibitor === 'yes') return 0;
  return INTERVAL_MIN_DAYS;
}

/** Nights without tablets since the last tablet, not counting nights withheld on this PGD's instruction. */
export function nightsWithoutTablets(c: DCourse): number | null {
  const d = daysSince(c.lastTabletDate);
  if (d === null) return null;
  return Math.max(0, d - Math.max(0, c.withheldSinceLastTablet ?? 0));
}

export function daysSinceSupply1(c: DCourse): number | null {
  return isReviewVisit(c) ? daysSince(c.supply1Date) : null;
}

/**
 * The window for the next supply visit: 25 to 35 days from today; visit 3
 * must also fall within 13 weeks of supply 1. Where that cuts the window to
 * nothing (from after to), `impossible` is set: there can be no visit 3 under
 * this PGD and the patient is referred instead of supplied.
 */
export function nextVisitWindow(c: DCourse): { from: string; to: string; impossible: boolean } | null {
  if (!isVisit1(c) && !isVisit2(c)) return null;
  const today = todayIso();
  const from = addDaysIso(today, INTERVAL_MIN_DAYS);
  let to = addDaysIso(today, INTERVAL_MAX_DAYS);
  if (isVisit2(c) && dayNumber(c.supply1Date) !== null) {
    const limit = addDaysIso(c.supply1Date, VISIT3_WITHIN_DAYS_OF_SUPPLY1);
    if (limit < to) to = limit;
  }
  return { from, to, impossible: from > to };
}

/** Mid-course regular moderate CYP3A4 inhibitor after a 50 mg supply: the full procedure is recorded (stopped, returned within 7 days, 50 mg tablets returned for destruction, withheld nights recorded). */
export function midCourseProcedureComplete(c: DCourse): boolean {
  if (c.midCourseInhibitor !== 'yes') return false;
  if (!c.midCourseInhibitorName.trim() || dayNumber(c.midCourseStoppedDate) === null) return false;
  if (c.midCourseReturnedWithin7 !== 'yes') return false;
  if (c.previousStrength === '50' && !c.midCourse50Returned) return false;
  const since = daysSince(c.midCourseStoppedDate) ?? 0;
  if (since > 0 && (c.withheldSinceLastTablet ?? 0) < since) return false;
  return true;
}

/** Previous supply 50 mg and a regular moderate CYP3A4 inhibitor ticked today: the mid-course procedure applies. */
export function midCourseRuleApplies(c: DCourse, m: DMedicines): boolean {
  return isReviewVisit(c) && c.previousStrength === '50' && m.moderateInhibitorRegular;
}

// ─── Dose ───

/** The moderate CYP3A4 inhibitor rule for 25 mg: taken regularly, at a stable dose, expected to continue for the rest of the course. */
export function moderateInhibitorQualifies(m: DMedicines): boolean {
  return m.moderateInhibitorRegular && m.moderateStable === 'yes' && m.moderateContinue === 'yes';
}

/** The strength supplied today: 50 mg, or 25 mg ONLY where the patient regularly takes a moderate CYP3A4 inhibitor (Appendix 4). */
export function strengthToday(c: DCourse, m: DMedicines): Strength {
  if (!supplyNumber(c)) return '';
  if (midCourseRuleApplies(c, m) && !midCourseProcedureComplete(c)) return '';
  if (m.moderateInhibitorRegular) return moderateInhibitorQualifies(m) ? '25' : '';
  if (isReviewVisit(c) && c.midCourseInhibitor === 'yes') return '';
  return '50';
}

// ─── Screens ───

export function bmi(s: DScreening): number | null {
  if (s.weightKg === null || s.heightCm === null || s.heightCm <= 0) return null;
  const h = s.heightCm / 100;
  return Math.round((s.weightKg / (h * h)) * 10) / 10;
}

export function stopItemCount(s: DScreening): number {
  return [s.snoring, s.tired, s.observed === 'yes', s.pressure].filter(Boolean).length;
}

export interface StopBangResult {
  score: number;
  stopItems: number;
  bmiOver35: boolean;
  ageOver50: boolean;
  neckOver40: boolean;
  male: boolean;
  complete: boolean;
}

/** Long-acting sedating antihistamines sold for sleep (promethazine; Sominex and Phenergan are promethazine). */
const LONG_ACTING_SLEEP_AID = /promethazine|phenergan|sominex/i;

/** The sleep aid named is promethazine (or another long-acting sedating antihistamine is ticked): the 48-hour rule applies. */
export function sleepAidNamedLongActing(m: DMedicines): boolean {
  return LONG_ACTING_SLEEP_AID.test(m.sleepAidName);
}

/**
 * The 48-hour gap applies (the document limits it to promethazine or another
 * long-acting sedating antihistamine; other sleep aids need at least the
 * night before).
 */
export function sleepAidIsLongActing(m: DMedicines): boolean {
  return m.sleepAidLongActing || sleepAidNamedLongActing(m);
}

/** Hours from the last dose of a long-acting sedating antihistamine to the planned first (or next) daridorexant dose, London time; null where not recorded. */
export function sleepAidGapHours(m: DMedicines): number | null {
  const a = londonInstant(m.sleepAidLastDose, m.sleepAidLastDoseTime);
  const b = londonInstant(m.plannedFirstDoseDate, m.plannedFirstDoseTime);
  if (a === null || b === null) return null;
  return Math.round(((b - a) / 3600000) * 10) / 10;
}

export function stopBang(s: DScreening, patient: DPatientDetails): StopBangResult {
  const b = bmi(s);
  const bmiOver35 = b !== null && b > 35;
  const ageOver50 = patient.age !== null && patient.age > 50;
  const neckOver40 = s.neckCm !== null && s.neckCm > 40;
  const male = patient.sex === 'male';
  const stopItems = stopItemCount(s);
  return {
    score: stopItems + [bmiOver35, ageOver50, neckOver40, male].filter(Boolean).length,
    stopItems,
    bmiOver35,
    ageOver50,
    neckOver40,
    male,
    complete: s.stopBangAsked && s.observed !== '' && b !== null && s.neckCm !== null && !!patient.sex,
  };
}

/** STOP-Bang is not used for a patient with diagnosed OSA using CPAP most nights. */
export function stopBangApplies(s: DScreening): boolean {
  return s.osa === 'none';
}

export interface ResponseTest {
  fall: number | null;
  fallOk: boolean;
  currentOk: boolean;
  daytimeOk: boolean;
  wishesOk: boolean;
  adequate: boolean;
  complete: boolean;
}

/** ADEQUATE RESPONSE means ALL of: (a) an ISI fall of 6 points or more from supply 1; (b) a current ISI of 14 or below; (c) better daytime functioning; (d) the patient wishes to continue. */
export function responseTest(c: DCourse, s: DScreening, sup: DSupply): ResponseTest {
  const fall = c.baselineIsi !== null && s.isi !== null ? c.baselineIsi - s.isi : null;
  const fallOk = fall !== null && fall >= 6;
  const currentOk = s.isi !== null && s.isi <= 14;
  const daytimeOk = sup.daytimeBetter === 'yes';
  const wishesOk = sup.wishesToContinue === 'yes';
  return {
    fall,
    fallOk,
    currentOk,
    daytimeOk,
    wishesOk,
    adequate: fallOk && currentOk && daytimeOk && wishesOk,
    complete: fall !== null && sup.daytimeBetter !== '' && sup.wishesToContinue !== '',
  };
}

/** Visit 2: the ISI is unchanged or higher than baseline. */
export function isiNotImproved(c: DCourse, s: DScreening): boolean {
  return c.baselineIsi !== null && s.isi !== null && s.isi >= c.baselineIsi;
}

// ─── Driving ───

export interface ShortNight {
  /** The day of the driving; the dose to skip is the night before. */
  day: DayName;
  nightBefore: DayName;
  hours: number;
  work: boolean;
}

/** Days on which the earliest driving or alert activity is less than 9 hours after the usual bedtime (the dose is taken within 30 minutes before bed). */
export function shortNights(d: DDriving): ShortNight[] {
  const bed = parseTime(d.bedtime);
  if (bed === null) return [];
  const out: ShortNight[] = [];
  DAYS.forEach((day, i) => {
    const t = parseTime(d.days[day].time);
    if (t === null) return;
    let gap = t - bed;
    if (gap <= 0) gap += 24 * 60;
    if (gap < 9 * 60) {
      out.push({ day, nightBefore: DAYS[(i + 6) % 7], hours: Math.round((gap / 60) * 10) / 10, work: d.days[day].work });
    }
  });
  return out;
}

// ─── Lists ───

export function untreatedCauses(s: DSleep): string[] {
  const l: string[] = [];
  if (s.uncontrolledPain) l.push('uncontrolled pain');
  if (s.breathlessLyingFlat) l.push('breathlessness lying flat or at night');
  if (s.nocturiaNotInvestigated) l.push('frequent night-time urination not yet investigated');
  if (s.menopausalNotDiscussed) l.push('menopausal hot flushes and night sweats not yet discussed with a clinician');
  if (s.overactiveThyroid) l.push('symptoms of an overactive thyroid');
  if (s.medicineBeforeInsomnia) l.push('a medicine started or changed in the 3 months before the insomnia began');
  if (s.caffeineNotTried) l.push('caffeine after mid-afternoon or energy drinks that the patient has not tried stopping');
  return l;
}

export function otherSleepDisorders(s: DSleep): string[] {
  const l: string[] = [];
  if (s.restlessLegs) l.push('restless legs');
  if (s.circadian) l.push('a circadian rhythm disorder');
  if (s.shiftWork) l.push('night or rotating shift work that includes nights');
  if (s.complexSleepBehaviour) l.push('a history of sleepwalking, sleep-eating, sleep-driving or other complex behaviour in sleep');
  return l;
}

export function sameDayStopSymptoms(c: DCourse): string[] {
  const l: string[] = [];
  if (c.sxSuicidal) l.push('thoughts of suicide or self-harm');
  if (c.sxAllergy) l.push('a serious allergic reaction (swelling of the face, lips or tongue, or difficulty breathing)');
  if (c.sxDrivingNotAwake) l.push('driving while not fully awake');
  if (c.sxActivityInjury) l.push('another activity while not fully awake that caused an injury or could have done');
  return l;
}

export function weekStopSymptoms(c: DCourse): string[] {
  const l: string[] = [];
  if (c.sxSleepParalysis) l.push('sleep paralysis');
  if (c.sxHallucinations) l.push('seeing or hearing things that are not there on falling asleep or waking');
  if (c.sxCataplexy) l.push('sudden weakness of the legs, face or neck brought on by laughter or strong emotion');
  if (c.sxSleepwalkingNoHarm) l.push('sleepwalking or another activity while not fully awake that is not remembered, where no one was hurt or put at risk');
  if (c.sxLowMoodAnxiety) l.push('new or worsening low mood or anxiety');
  if (c.sxMorningSleepiness) l.push('still feeling sleepy or slowed in the mornings after the first week');
  if (c.sxFall) l.push('a fall');
  if (c.sxRash) l.push('a rash');
  return l;
}

export function nonStopEffects(c: DCourse): string[] {
  const l: string[] = [];
  if (c.seHeadache) l.push('headache');
  if (c.seNausea) l.push('nausea');
  if (c.seDizziness) l.push('dizziness');
  if (c.seTiredness) l.push('tiredness');
  if (c.seDreams) l.push('nightmares or vivid dreams');
  if (c.seOther.trim()) l.push(c.seOther.trim());
  return l;
}

export function excludedMedicines(m: DMedicines): string[] {
  const l: string[] = [];
  if (m.strongInhibitor) l.push('a strong CYP3A4 inhibitor');
  if (m.inducer) l.push('a moderate or strong CYP3A4 inducer');
  if (m.ntiSubstrate) l.push('a narrow therapeutic index medicine affected by daridorexant 50 mg');
  if (m.cnsDepressantPrescribed) l.push('another hypnotic or sedative taken regularly and continuing');
  return l;
}

// ─── Stop origins and blocking ───

const STOP_ORIGIN_STEP: Record<string, number> = {
  AGE_UNDER_18: STEP.patient,
  AGE_76_OR_OVER: STEP.patient,
  NOT_GP_REGISTERED: STEP.patient,
  GP_NOT_INFORMED: STEP.patient,
  REMOTE_CONSULTATION: STEP.consent,
  LACKS_CAPACITY: STEP.consent,
  PATIENT_DECLINED: STEP.consent,
  FOURTH_SUPPLY: STEP.course,
  SUPPLY_NUMBER_MISMATCH: STEP.course,
  COURSE_STOPPED_ON_RECORD: STEP.course,
  VISIT3_WINDOW_IMPOSSIBLE: STEP.course,
  PREVIOUS_COURSE: STEP.course,
  OREXIN_ELSEWHERE: STEP.course,
  INTERVAL_TOO_SHORT: STEP.course,
  INTERVAL_TOO_LONG: STEP.course,
  VISIT3_OVER_13_WEEKS: STEP.course,
  OVER_7_NIGHTS_WITHOUT_TABLETS: STEP.course,
  GAP_OVER_7_NIGHTS: STEP.course,
  EARLY_OR_LOST_REQUEST: STEP.course,
  MID_COURSE_NOT_RETURNED: STEP.course,
  STOP_SAME_DAY: STEP.course,
  STOP_WITHIN_WEEK: STEP.course,
  PATIENT_WISHES_TO_STOP: STEP.course,
  REVIEW_NEW_SLEEP_DISORDER: STEP.course,
  INSOMNIA_CRITERIA_NOT_MET: STEP.sleep,
  NO_DAYTIME_IMPACT: STEP.sleep,
  NO_SLEEP_DIARY: STEP.sleep,
  DIARY_INCONSISTENT: STEP.sleep,
  SLEEP_HYGIENE_NOT_FOLLOWED: STEP.sleep,
  UNTREATED_CAUSE: STEP.sleep,
  OTHER_SLEEP_DISORDER: STEP.sleep,
  NARCOLEPSY_FEATURES: STEP.sleep,
  CBTI_AVAILABLE_NOT_TRIED: STEP.cbti,
  CBTI_PREFERENCE: STEP.cbti,
  CBTI_TRIED_NOT_MET: STEP.cbti,
  CBTI_NHS_AVAILABLE: STEP.cbti,
  ISI_BELOW_15: STEP.screening,
  PHQ9_Q9_POSITIVE: STEP.screening,
  PHQ9_10_OR_MORE: STEP.screening,
  GAD7_10_OR_MORE: STEP.screening,
  EPWORTH_OVER_10: STEP.screening,
  STOPBANG_5_OR_MORE: STEP.screening,
  STOPBANG_STOP_ITEMS: STEP.screening,
  WITNESSED_APNOEA: STEP.screening,
  OSA_NOT_TREATED: STEP.screening,
  HYPERSENSITIVITY: STEP.medical,
  NARCOLEPSY: STEP.medical,
  LIVER_DISEASE: STEP.medical,
  RESPIRATORY: STEP.medical,
  PREGNANCY_BREASTFEEDING: STEP.medical,
  SOLE_NIGHT_CARER: STEP.medical,
  FALLS_RISK_65: STEP.medical,
  DEMENTIA_MEMORY: STEP.medical,
  SUICIDE_SELF_HARM_RISK: STEP.medical,
  SERIOUS_MENTAL_ILLNESS: STEP.medical,
  PTSD: STEP.medical,
  SECONDARY_CARE_MH: STEP.medical,
  MH_TREATMENT_CHANGED: STEP.medical,
  SUBSTANCE_MISUSE: STEP.medical,
  ALCOHOL_OVER_14: STEP.medical,
  CANNABIS: STEP.medical,
  STRONG_CYP3A4_INHIBITOR: STEP.medicines,
  CYP3A4_INDUCER: STEP.medicines,
  NTI_SUBSTRATE: STEP.medicines,
  CNS_DEPRESSANT: STEP.medicines,
  SLEEP_AID_NOT_STOPPED: STEP.medicines,
  MODERATE_INHIBITOR_NOT_STABLE: STEP.medicines,
  SCR_REFUSED: STEP.medicines,
  SLEEP_AID_48_HOURS: STEP.medicines,
  DRIVING_FIRST_4_NOT_POSSIBLE: STEP.driving,
  DRIVING_CANNOT_KEEP_9_HOURS: STEP.driving,
  EARLY_MORNING_WORK_DRIVER: STEP.driving,
  DRIVING_9_HOURS_INCONSISTENT: STEP.driving,
  GROUP2_DRIVER: STEP.driving,
  SAFETY_CRITICAL_ROLE: STEP.driving,
  EARLY_STOP_VISIT2: STEP.supply,
  NOT_WISHING_TO_CONTINUE: STEP.supply,
  ADHERENCE_BELOW_10: STEP.supply,
  INADEQUATE_RESPONSE: STEP.supply,
};

export function stopsBlockStep(alerts: ClinicalAlert[], step: number): boolean {
  return alerts.some((a) => a.severity === 'stop' && (STOP_ORIGIN_STEP[a.code] ?? 0) <= step);
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}

/** Codes that need same-day action: suicide or self-harm risk, or a same-day stop symptom. */
export const SAME_DAY_CODES: ReadonlySet<string> = new Set(['STOP_SAME_DAY', 'PHQ9_Q9_POSITIVE', 'SUICIDE_SELF_HARM_RISK']);
/** Codes that involve suicide or self-harm risk (Actions: ask about plans and intent). */
export const RISK_CODES: ReadonlySet<string> = new Set(['PHQ9_Q9_POSITIVE', 'SUICIDE_SELF_HARM_RISK']);
/** Stop rules at any visit: no further supply under this PGD; refer to the GP; Yellow Card. */
export const STOP_RULE_CODES: ReadonlySet<string> = new Set(['STOP_SAME_DAY', 'STOP_WITHIN_WEEK']);
/** Stop rules that need help the same day. */
export const SAME_DAY_STOP_RULE_CODES: ReadonlySet<string> = new Set(['STOP_SAME_DAY', 'PHQ9_Q9_POSITIVE', 'SUICIDE_SELF_HARM_RISK']);
/** Stop rules that need the GP within a week. */
export const WITHIN_WEEK_CODES: ReadonlySet<string> = new Set(['STOP_WITHIN_WEEK']);

/**
 * The stop-rule codes for this visit. At supply visits 2 and 3 the patient
 * has been taking daridorexant, so suicide or self-harm risk (PHQ-9
 * question 9, or current thoughts or recent self-harm) is the same-day stop
 * rule: an adverse reaction record and a Yellow Card are required as for any
 * other same-day stop.
 */
export function stopRuleCodesFor(c: DCourse): ReadonlySet<string> {
  return isReviewVisit(c) ? new Set([...STOP_RULE_CODES, ...RISK_CODES]) : STOP_RULE_CODES;
}

/**
 * Not-supplied reasons that are not the end of anything: the patient is
 * invited back (a diary to complete, CBT-I to try first, a visit too early,
 * the 48-hour gap after a long-acting sedating antihistamine).
 */
export const RETURN_LATER_CODES: ReadonlySet<string> = new Set([
  'NO_SLEEP_DIARY',
  'CBTI_AVAILABLE_NOT_TRIED',
  'CBTI_PREFERENCE',
  'CBTI_TRIED_NOT_MET',
  'CBTI_NHS_AVAILABLE',
  'INTERVAL_TOO_SHORT',
  'SLEEP_AID_48_HOURS',
]);

/** The course has ended: refer to a prescriber. */
export const COURSE_ENDED_CODES: ReadonlySet<string> = new Set([
  'FOURTH_SUPPLY',
  'SUPPLY_NUMBER_MISMATCH',
  'COURSE_STOPPED_ON_RECORD',
  'VISIT3_WINDOW_IMPOSSIBLE',
  'INTERVAL_TOO_LONG',
  'VISIT3_OVER_13_WEEKS',
  'OVER_7_NIGHTS_WITHOUT_TABLETS',
  'GAP_OVER_7_NIGHTS',
  'MID_COURSE_NOT_RETURNED',
  'EARLY_STOP_VISIT2',
  'NOT_WISHING_TO_CONTINUE',
  'ADHERENCE_BELOW_10',
  'INADEQUATE_RESPONSE',
  'PATIENT_WISHES_TO_STOP',
]);

const stop = (code: string, message: string, detail: string): ClinicalAlert => ({ severity: 'stop', code, message, detail });
const caution = (code: string, message: string, detail: string): ClinicalAlert => ({ severity: 'caution', code, message, detail });

const REFER_GP = 'Refer to the GP, explaining why. Explain the reason, and give sleep hygiene advice and the CBT-I signposting in Appendix 3 in writing. Document the reason, the advice given and the referral made; inform the GP where a referral is made.';
const MH_SAME_DAY =
  'Do not leave it there. Ask about plans and intent. Immediate danger or a plan: call 999 or arrange accompanied attendance at A&E. Otherwise: same-day contact with the GP, or NHS 111 (option 2 for mental health in England), and give the Samaritans number (116 123). Record what was done.';
const PHYSICAL_SAME_DAY =
  'A serious allergic reaction (swelling of the face, lips or tongue, or difficulty breathing) is an emergency: call 999 or arrange A&E. Driving or another activity while not fully awake: an urgent same-day GP appointment (or NHS 111 where the GP cannot be reached the same day).';
const MH_ROUTINE = 'Refer to the GP routinely, or advise self-referral to NHS Talking Therapies.';
const INTERACTION_REFER = 'Refer to the GP, who may prescribe with dose adjustment or monitoring a PGD cannot provide.';

export interface AlertInputs {
  patient: DPatientDetails;
  consent: DConsent;
  course: DCourse;
  sleep: DSleep;
  cbti: DCbti;
  screening: DScreening;
  medical: DMedical;
  medicines: DMedicines;
  driving: DDriving;
  supply: DSupply;
}

export function getDaridorexantAlerts(x: AlertInputs): ClinicalAlert[] {
  const { patient, consent, course, sleep, cbti, screening, medical, medicines, driving, supply } = x;
  const alerts: ClinicalAlert[] = [];
  const v1 = isVisit1(course);
  const review = isReviewVisit(course);
  const v2 = isVisit2(course);
  const v3 = isVisit3(course);
  const full = needsFullAssessment(course);
  const onRecord = suppliesOnRecord(course);

  // ── Patient ──
  const ageFirst = ageAtFirstSupply(patient, course);
  if (ageFirst !== null && ageFirst >= 0 && ageFirst < 18) {
    alerts.push(stop('AGE_UNDER_18', 'Under 18 at the first supply', 'Excluded: anyone under 18. Refer to the GP.'));
  }
  if (ageFirst !== null && ageFirst >= 76) {
    alerts.push(
      stop(
        'AGE_76_OR_OVER',
        'Aged 76 or over at the first supply',
        'Excluded. The SmPC advises caution over 75 because data are limited, and there are no data over 85. Refer to the GP.'
      )
    );
  } else if (review && patient.age !== null && patient.age >= 76) {
    alerts.push(caution('AGE_TURNED_76', 'Turned 76 during the course', 'A patient who turns 76 during the course may complete it.'));
  }
  if (patient.age !== null && patient.age >= 65 && patient.age <= 75) {
    alerts.push(
      caution(
        'AGE_65_TO_75',
        'Aged 65 to 75',
        'The SmPC advises caution in the elderly because of the general risk of falls, although trials did not show more falls than placebo. Increased body sway on being woken 4 hours after a dose was measured in healthy adults under 65 (SmPC 5.1). Advise a night light, a clear path to the toilet, and getting up slowly.'
      )
    );
  }
  if (patient.gpRegistered === 'no') {
    alerts.push(stop('NOT_GP_REGISTERED', 'Not registered with a GP', 'Excluded: a patient not registered with a GP is not supplied.'));
  }
  if (patient.gpNotificationAgreed === 'no') {
    alerts.push(stop('GP_NOT_INFORMED', 'Will not allow the GP to be informed', 'A patient who will not allow the GP to be told is not supplied.'));
  }

  // ── Consent ──
  if (consent.faceToFace === 'no') {
    alerts.push(stop('REMOTE_CONSULTATION', 'Remote or telephone consultation', 'Not covered: supply is face to face on the premises only.'));
  }
  if (consent.lacksCapacity) {
    alerts.push(stop('LACKS_CAPACITY', 'Lacks capacity to consent', 'Excluded. Valid informed consent is required (Mental Capacity Act 2005). Refer to the GP.'));
  }
  if (consent.patientDeclined) {
    alerts.push(stop('PATIENT_DECLINED', 'The patient declines', 'Explain the reason, and give sleep hygiene advice and the CBT-I signposting in Appendix 3 in writing. Record the advice given.'));
  }

  // ── Visit and course ──
  if (course.visitType === 'after3' || onRecord >= 3) {
    alerts.push(
      stop(
        'FOURTH_SUPPLY',
        onRecord >= 3 ? `The records at this pharmacy show ${onRecord} supplies under this PGD` : 'Three supplies already made under this PGD',
        'There is no fourth supply under this PGD in any circumstance, whatever visit is selected. Any treatment after supply 3 is for a prescriber.'
      )
    );
  }
  const nToday = supplyNumber(course);
  if (nToday !== null && course.carried && onRecord > 0 && onRecord < 3 && nToday <= onRecord && !v1) {
    alerts.push(
      stop(
        'SUPPLY_NUMBER_MISMATCH',
        `Supply ${nToday} selected, but the records already show ${onRecord} supplies`,
        'Supplies are numbered from the first supply and never reset: today would be supply ' + (onRecord + 1) + '. Correct the visit, or refer to a prescriber.'
      )
    );
  }
  if (v1 && (course.previousCourse === 'yes' || onRecord >= 1)) {
    alerts.push(
      stop(
        'PREVIOUS_COURSE',
        onRecord >= 1 ? `A course under this PGD is on record at this pharmacy (${onRecord} ${onRecord === 1 ? 'supply' : 'supplies'})` : 'A course under this PGD already started or completed at any pharmacy',
        'Excluded, whatever its outcome (by the patient\'s account and pharmacy records; record the answer). A second course is for a prescriber.'
      )
    );
  }
  if (course.carried?.courseStoppedOnRecord && onRecord < 3) {
    alerts.push(
      stop(
        'COURSE_STOPPED_ON_RECORD',
        `The course was stopped after the last supply: ${course.carried.courseStoppedOnRecord}`,
        'A record at this pharmacy after the last supply stopped the course (a stop rule, suicide or self-harm risk, or a course-ending reason). No further supply under this PGD: refer to a prescriber.'
      )
    );
  }
  if (course.manualOverride) {
    alerts.push(
      caution(
        'COURSE_UNVERIFIED',
        'Course history entered by hand: the course is UNVERIFIED',
        `The visit, supply dates, previous strength and baseline ISI were not taken from this pharmacy's records${course.manualOverrideReason.trim() ? ` (reason: ${course.manualOverrideReason.trim()})` : ''}. Check them against the patient's written record and the PMR before supplying.`
      )
    );
  }
  if (review && !hasSupply1Record(course)) {
    alerts.push(
      caution(
        'NO_SUPPLY1_RECORD',
        'No supply 1 record found at this pharmacy',
        'The supply 1 assessment applies in full today: sleep history and diary, the CBT-I gate, ISI 15 or more, Epworth and STOP-Bang.'
      )
    );
  }
  if (course.orexinElsewhere === 'yes') {
    alerts.push(
      stop(
        'OREXIN_ELSEWHERE',
        'Already taking daridorexant or another orexin receptor antagonist on prescription or from any other source',
        'Excluded. A patient already taking daridorexant on prescription is for a prescriber.'
      )
    );
  }
  if (review) {
    const iv = intervalDays(course);
    const min = intervalMinDays(course);
    const max = intervalMaxDays(course);
    if (iv !== null && iv < min) {
      alerts.push(
        stop(
          'INTERVAL_TOO_SHORT',
          `Only ${iv} days since the previous supply (minimum ${min})`,
          'Supply visits 2 and 3 are 25 to 35 days after the previous supply (earlier only under the Cautions rule for a regular moderate CYP3A4 inhibitor started during the course, at supply 2). Treat a request for an early supply as a reason to refer, not to supply.'
        )
      );
    }
    if (iv !== null && iv > max) {
      alerts.push(
        stop(
          'INTERVAL_TOO_LONG',
          `${iv} days since the previous supply (limit ${max}${max > INTERVAL_MAX_DAYS ? `, extended by ${max - INTERVAL_MAX_DAYS} recorded withheld nights` : ''})`,
          'A visit outside the supply interval during the course is an exclusion. Where recorded withheld nights mean the tablets last longer, the 35-day limit is extended by the number of withheld nights, provided supply visit 3 is still within 13 weeks of supply 1; otherwise refer to a prescriber.'
        )
      );
    }
    const s1 = daysSinceSupply1(course);
    if (v2) {
      const w = nextVisitWindow(course);
      if (w?.impossible) {
        alerts.push(
          stop(
            'VISIT3_WINDOW_IMPOSSIBLE',
            `Supply visit 3 can no longer fall within 13 weeks of supply 1 (the earliest visit 3, ${formatUk(w.from)}, is after ${formatUk(w.to)})`,
            'Supply visit 3 always falls within 13 weeks of supply 1, and is at least 25 days after supply 2. Neither can now be met, so the effectiveness assessment cannot be made under this PGD: no supply 2; refer to a prescriber.'
          )
        );
      }
    }
    if (v3 && s1 !== null && s1 > VISIT3_WITHIN_DAYS_OF_SUPPLY1) {
      alerts.push(
        stop(
          'VISIT3_OVER_13_WEEKS',
          `Supply visit 3 is ${s1} days after supply 1 (more than 13 weeks)`,
          'Supply visit 3 always falls within 13 weeks of supply 1, which meets the TA922 and SmPC requirement to assess within 3 months. Refer to a prescriber.'
        )
      );
    }
    const nw = nightsWithoutTablets(course);
    if (nw !== null && nw > MAX_NIGHTS_WITHOUT_TABLETS) {
      alerts.push(
        stop(
          'OVER_7_NIGHTS_WITHOUT_TABLETS',
          `${nw} days since the last tablet (not counting withheld nights)`,
          'Each supply visit is no more than 7 days after the patient\'s last tablet. More than 7 nights without tablets, for any reason other than nights withheld on this PGD\'s instruction, ends the course: refer to a prescriber.'
        )
      );
    }
    if (course.gapOver7Nights === 'yes') {
      alerts.push(
        stop(
          'GAP_OVER_7_NIGHTS',
          'More than 7 nights without tablets during the course (not counting withheld nights)',
          'More than 7 nights without tablets, for any reason other than nights withheld on this PGD\'s instruction (an interacting short course, or waiting to return after starting a regular moderate CYP3A4 inhibitor), ends the course: refer to a prescriber.'
        )
      );
    }
    if ((course.withheldNights ?? 0) > 0) {
      alerts.push(
        caution(
          'WITHHELD_NIGHTS',
          `${course.withheldNights} nights withheld on this PGD's instruction`,
          `Recorded, and not counted as nights without tablets. ${course.withheldDetails.trim() ? `Medicine and dates: ${course.withheldDetails.trim()}.` : 'Record the medicine and the dates.'} The 35-day limit is extended by the number of withheld nights, provided supply visit 3 is still within 13 weeks of supply 1.`
        )
      );
    }
    if (midCourseRuleApplies(course, medicines) && course.midCourseInhibitor !== 'yes') {
      alerts.push(
        caution(
          'MID_COURSE_RULE_APPLIES',
          'Previous supply 50 mg and a regular moderate CYP3A4 inhibitor now',
          'The inhibitor was started during the course: record it on the Visit and Course step ("started during the course: yes") and apply the full procedure (stopped from the first dose, returned within 7 days, nights recorded as withheld, 50 mg tablets returned for destruction) before any 25 mg supply.'
        )
      );
    }
    if (course.midCourseInhibitor === 'yes') {
      if (course.midCourseReturnedWithin7 === 'no') {
        alerts.push(
          stop(
            'MID_COURSE_NOT_RETURNED',
            'Regular moderate CYP3A4 inhibitor started during the course: did not return within 7 days of stopping daridorexant',
            'The patient returns within 7 days of stopping; if not, the course ends and the patient is referred to the GP.'
          )
        );
      } else {
        alerts.push(
          caution(
            'MID_COURSE_INHIBITOR',
            `Regular moderate CYP3A4 inhibitor started during the course${course.midCourseInhibitorName.trim() ? ` (${course.midCourseInhibitorName.trim()})` : ''}`,
            `The patient stops daridorexant from the first dose of the inhibitor and returns to the pharmacy. The 50 mg tablets in hand are not taken (MPG2 1.1.12: no dose change to a medicine in the patient's possession) and are returned for destruction. The nights stopped are recorded as withheld nights. A further supply is made only at 25 mg, only if every criterion for that supply visit is met, and counts as the next numbered supply: ${v2 ? 'as supply 2, the 25-day minimum does not apply' : 'as supply 3, it needs the effectiveness assessment and at least 25 days since supply 2'}. Otherwise refer to the GP.`
          )
        );
      }
    }
    if (course.previousStrength === '25' && !medicines.moderateInhibitorRegular) {
      alerts.push(
        caution(
          'INHIBITOR_STOPPED',
          'Previously supplied 25 mg; no regular moderate CYP3A4 inhibitor now',
          'A patient who stops the inhibitor finishes the 25 mg tablets in hand; the next supply is 50 mg. Each supply is at the dose that applies on the day of that supply.'
        )
      );
    }
    const same = sameDayStopSymptoms(course);
    if (same.length > 0) {
      alerts.push(
        stop(
          'STOP_SAME_DAY',
          `STOP AND SEEK HELP THE SAME DAY: ${same.join('; ')}`,
          `No further supply under this PGD; Yellow Card; inform the GP. ${course.sxSuicidal ? MH_SAME_DAY : ''}${sameDayStopSymptoms({ ...course, sxSuicidal: false }).length > 0 ? ` ${PHYSICAL_SAME_DAY}` : ''} Never managed by reducing the dose.`
        )
      );
    }
    const week = weekStopSymptoms(course);
    if (week.length > 0) {
      alerts.push(
        stop(
          'STOP_WITHIN_WEEK',
          `STOP AND CONTACT THE PHARMACY OR GP WITHIN A WEEK: ${week.join('; ')}`,
          'No further supply under this PGD; the patient is referred to the GP; Yellow Card. None of these is managed by reducing the dose.'
        )
      );
    }
    const ns = nonStopEffects(course);
    if (ns.length > 0) {
      alerts.push(
        caution(
          'NON_STOP_EFFECTS',
          `Side effects reported: ${ns.join('; ')}`,
          'Headache, nausea, dizziness, tiredness, nightmares or vivid dreams are not stop symptoms on their own. QUVIVIQ is a black triangle medicine: report EVERY suspected adverse reaction, however minor, via the Yellow Card scheme, and record the report.'
        )
      );
    }
    const newDisorders = [
      course.reviewNewShiftWork === 'yes' ? 'new night or rotating shift work that includes nights' : '',
      course.reviewNewRestlessLegs === 'yes' ? 'new restless legs symptoms' : '',
      course.reviewNewApnoeaOrSleepiness === 'yes' ? 'new loud snoring with witnessed pauses in breathing, choking or gasping, or new excessive daytime sleepiness' : '',
    ].filter(Boolean);
    if (newDisorders.length > 0) {
      alerts.push(
        stop(
          'REVIEW_NEW_SLEEP_DISORDER',
          `A new excluded condition since the last supply: ${newDisorders.join('; ')}`,
          `Supply visits 2 and 3 require no new excluded medicine or condition. Possible sleep apnoea, excessive daytime sleepiness, restless legs or another sleep disorder (including night or rotating shift work): no supply; refer to the GP, explaining why. A patient who falls asleep unintentionally while driving is advised not to drive until assessed, and that DVLA rules may apply.`
        )
      );
    }
    if (course.wishesToStop) {
      alerts.push(
        stop(
          'PATIENT_WISHES_TO_STOP',
          'The patient wishes to stop',
          'The patient may stop at any time for any reason, without tapering. No further supply; the GP is informed.'
        )
      );
    }
  }
  if (course.earlyOrLostRequest) {
    alerts.push(
      stop(
        'EARLY_OR_LOST_REQUEST',
        'A request for an early supply or a report of lost tablets',
        'Abuse potential: supply no more than this PGD allows, at the intervals it allows, and treat a request for an early supply or a report of lost tablets as a reason to refer, not to supply.'
      )
    );
  }

  // ── Sleep history and diary (supply 1, or no supply 1 record) ──
  if (full) {
    const nightsLow = sleep.nightsPerWeek !== null && sleep.nightsPerWeek < 3;
    const monthsLow = sleep.durationMonths !== null && sleep.durationMonths < 3;
    if (nightsLow || monthsLow || sleep.adequateOpportunity === 'no') {
      const why = [nightsLow ? 'fewer than 3 nights a week' : '', monthsLow ? 'under 3 months (short-term or acute insomnia)' : '', sleep.adequateOpportunity === 'no' ? 'no adequate opportunity and circumstances for sleep' : '']
        .filter(Boolean)
        .join('; ');
      alerts.push(
        stop(
          'INSOMNIA_CRITERIA_NOT_MET',
          `Long-term insomnia criteria not met: ${why}`,
          'Not covered: short-term or acute insomnia (under 3 months), or insomnia on fewer than 3 nights a week. Insomnia is difficulty sleeping despite adequate opportunity for sleep. Give sleep hygiene advice in writing.'
        )
      );
    }
    if (sleep.daytimeConsiderable === 'no') {
      alerts.push(
        stop(
          'NO_DAYTIME_IMPACT',
          'No considerable effect on daytime functioning',
          'Not covered: poor sleep without a considerable effect on daytime functioning. Sleep disturbance without daytime impairment is not insomnia disorder.'
        )
      );
    }
    if (sleep.diaryKept === 'no' || (sleep.diaryKept === 'yes' && sleep.diaryNights !== null && sleep.diaryNights < 7)) {
      alerts.push(
        stop(
          'NO_SLEEP_DIARY',
          sleep.diaryKept === 'no' ? 'No sleep diary' : `Sleep diary covers only ${sleep.diaryNights} nights`,
          'A sleep diary kept for at least 7 and up to 14 consecutive nights before supply 1 is required. A patient without one is given a diary and supply 1 is booked for when it is complete.'
        )
      );
    }
    if (sleep.diaryConsistent === 'no') {
      alerts.push(
        stop('DIARY_INCONSISTENT', 'The sleep diary does not fit the history', 'The diary must be consistent with the history. Where the assessment leaves doubt, the patient is referred and not supplied. ' + REFER_GP)
      );
    }
    if (sleep.hygieneFourWeeks === 'no') {
      alerts.push(
        stop(
          'SLEEP_HYGIENE_NOT_FOLLOWED',
          'Sleep hygiene advice not followed for at least the last 4 weeks',
          'Sleep hygiene advice (Appendix 3) must have been followed for at least the last 4 weeks, by the patient\'s account, without adequate improvement. Give it in writing and invite the patient to return.'
        )
      );
    }
    const causes = untreatedCauses(sleep);
    if (causes.length > 0) {
      alerts.push(
        stop(
          'UNTREATED_CAUSE',
          `Insomnia that appears to be mainly caused by something untreated or not yet assessed: ${causes.join('; ')}`,
          'Excluded. Identify and manage what may be causing or maintaining it first. ' + REFER_GP
        )
      );
    }
    const disorders = otherSleepDisorders(sleep);
    if (disorders.length > 0) {
      alerts.push(stop('OTHER_SLEEP_DISORDER', `Another sleep disorder: ${disorders.join('; ')}`, 'Excluded. Restless legs or another sleep disorder: refer to the GP, explaining why.'));
    }
    const narc: string[] = [];
    if (sleep.unintentionalDaytimeSleep) narc.push('falling asleep unintentionally during the day');
    if (sleep.cataplexy) narc.push('sudden muscle weakness brought on by laughter or emotion (cataplexy)');
    if (sleep.paralysisHallucinationsBefore) narc.push('recurrent sleep paralysis or hallucinations on falling asleep or waking before any treatment');
    if (narc.length > 0) {
      alerts.push(
        stop(
          'NARCOLEPSY_FEATURES',
          `Features suggesting narcolepsy or another cause of excessive sleepiness: ${narc.join('; ')}`,
          `Excluded. Refer to the GP, explaining why.${sleep.unintentionalDaytimeSleep ? ' A patient who falls asleep unintentionally while driving is advised not to drive until assessed, and that DVLA rules may apply.' : ''}`
        )
      );
    }

    // ── CBT-I ──
    if (cbti.status === 'available-not-tried') {
      alerts.push(
        stop(
          'CBTI_AVAILABLE_NOT_TRIED',
          'NHS CBT-I is available and suitable and has not been tried',
          'Not covered. Signpost to it (NHS Talking Therapies, free NHS digital CBT-I where offered, or the GP for local options), and invite the patient to return if it has not worked after at least 4 weeks of engagement.'
        )
      );
    }
    if (cbti.status === 'preference') {
      alerts.push(
        stop(
          'CBTI_PREFERENCE',
          'A preference not to try CBT-I',
          'A preference not to try CBT-I is not unsuitability: that patient is signposted and not supplied. Invite the patient to return if it has not worked after at least 4 weeks of engagement.'
        )
      );
    }
    if (cbti.status === 'tried' && (cbti.triedEngaged === 'no' || cbti.triedWithin2Years === 'no')) {
      alerts.push(
        stop(
          'CBTI_TRIED_NOT_MET',
          cbti.triedWithin2Years === 'no' ? 'CBT-I not tried within the last 2 years' : 'CBT-I not completed or engaged with for at least 4 weeks',
          'TRIED AND NOT WORKED means the patient has completed, or engaged with for at least 4 weeks, a structured CBT-I programme within the last 2 years, without adequate improvement. Otherwise decide whether NHS CBT-I is available or unsuitable; where it is available, signpost and do not supply.'
        )
      );
    }
    if (cbti.status === 'not-available') {
      const digitalNation = cbti.nation === 'scotland' || cbti.nation === 'wales';
      if (digitalNation || cbti.nhsOffer === 'digital-offered' || cbti.nhsOffer === 'f2f-within-3-months') {
        alerts.push(
          stop(
            'CBTI_NHS_AVAILABLE',
            digitalNation
              ? `NHS digital CBT-I is offered where the patient lives (${cbti.nation === 'scotland' ? 'Sleepio, free to anyone living in Scotland' : 'SilverCloud Space for Sleep, free by self-referral in Wales'})`
              : cbti.nhsOffer === 'digital-offered'
                ? 'Free NHS digital CBT-I is offered to the patient'
                : 'NHS face to face CBT-I is offered with a wait of 3 months or less',
            '"Not available" is judged by NHS access, not by willingness to pay. Free NHS digital CBT-I counts as AVAILABLE wherever it is offered to the patient. Signpost to it and invite the patient to return if it has not worked after at least 4 weeks of engagement.'
          )
        );
      }
    }
  }

  // ── Screening ──
  if (full && screening.isi !== null && screening.isi < 15) {
    alerts.push(stop('ISI_BELOW_15', `ISI ${screening.isi} at supply 1 (15 or more required)`, 'Inclusion requires an Insomnia Severity Index of 15 or more at supply 1. Give sleep hygiene advice and the CBT-I signposting in writing.'));
  }
  if (screening.phq9Q9 && screening.phq9Q9 !== 'not-at-all') {
    alerts.push(
      stop(
        'PHQ9_Q9_POSITIVE',
        'PHQ-9 question 9 answered other than "not at all"',
        (review ? 'STOP RULE (same day): no further supply under this PGD; record the adverse reaction; Yellow Card; inform the GP. ' : 'Excluded (same-day assessment). ') + MH_SAME_DAY
      )
    );
  }
  if (screening.phq9 !== null && screening.phq9 >= 10) {
    alerts.push(stop('PHQ9_10_OR_MORE', `PHQ-9 total ${screening.phq9} (10 or more)`, 'Excluded. ' + MH_ROUTINE));
  }
  if (screening.gad7 !== null && screening.gad7 >= 10) {
    alerts.push(stop('GAD7_10_OR_MORE', `GAD-7 ${screening.gad7} (10 or more)`, 'Excluded. ' + MH_ROUTINE));
  }
  if (full && screening.epworth !== null && screening.epworth > 10) {
    alerts.push(
      stop(
        'EPWORTH_OVER_10',
        `Epworth Sleepiness Scale ${screening.epworth} (above 10)`,
        'A score above 10 suggests excessive daytime sleepiness, which is not typical of insomnia: exclude and refer to the GP, explaining why. A patient with a high Epworth score who drives is advised not to drive until assessed, and that DVLA rules may apply.'
      )
    );
  }
  if (full && screening.osa === 'not-treated') {
    alerts.push(stop('OSA_NOT_TREATED', 'Diagnosed sleep apnoea not being treated, or CPAP not used most nights', 'Excluded. Refer to the GP for assessment.'));
  }
  if (full && screening.osa === 'cpap-most-nights') {
    alerts.push(
      caution(
        'OSA_ON_CPAP',
        'Diagnosed obstructive sleep apnoea treated with CPAP used most nights',
        'STOP-Bang is not used. Confirm and record that CPAP is used most nights (a patient not using it most nights is excluded). The SmPC found no worsening of apnoea or oxygen saturation; advise continuing CPAP.'
      )
    );
  }
  if (full && stopBangApplies(screening)) {
    const sb = stopBang(screening, patient);
    const sbDetail = 'Possible sleep apnoea: refer to the GP for assessment, explaining why.';
    if (screening.stopBangAsked && sb.score >= 5) {
      alerts.push(stop('STOPBANG_5_OR_MORE', `STOP-Bang ${sb.score} (5 or more)`, sbDetail));
    }
    if (screening.stopBangAsked && sb.stopItems >= 2 && (sb.male || sb.bmiOver35 || sb.neckOver40)) {
      const w = [sb.male ? 'male sex' : '', sb.bmiOver35 ? 'BMI over 35' : '', sb.neckOver40 ? 'neck over 40 cm' : ''].filter(Boolean).join(', ');
      alerts.push(stop('STOPBANG_STOP_ITEMS', `${sb.stopItems} of the four STOP items together with ${w}`, sbDetail));
    }
    if (screening.observed === 'yes') {
      alerts.push(stop('WITNESSED_APNOEA', 'Witnessed pauses in breathing, choking or gasping in sleep', 'Refer at any STOP-Bang score. ' + sbDetail));
    }
  }
  if (v2 && isiNotImproved(course, screening)) {
    alerts.push(
      caution(
        'ISI_NOT_IMPROVED_VISIT2',
        `ISI ${screening.isi} is unchanged or higher than baseline (${course.baselineIsi})`,
        'EARLY STOP: if the patient wishes to stop, no supply 2 and the GP is informed. Otherwise supply 2 is made when the supply visit 2 criteria are met, including where the ISI is unchanged or worse but the patient wishes to continue and no stop rule applies.'
      )
    );
  }

  // ── Medical, mental health and substances ──
  if (medical.hypersensitivity) {
    alerts.push(
      stop(
        'HYPERSENSITIVITY',
        'Hypersensitivity to daridorexant or to any excipient',
        'Excluded (SmPC section 6.1: mannitol, microcrystalline cellulose, povidone, croscarmellose sodium, silicon dioxide, magnesium stearate, hypromellose, glycerol, talc, titanium dioxide, iron oxides).'
      )
    );
  }
  if (medical.narcolepsy) {
    alerts.push(stop('NARCOLEPSY', 'Narcolepsy', 'Contraindicated. Refer to the GP.'));
  }
  if (medical.liverDisease) {
    alerts.push(
      stop(
        'LIVER_DISEASE',
        'Known chronic liver disease, including cirrhosis or hepatic impairment of any degree',
        'Refer. The SmPC requires 25 mg in moderate impairment and advises against use in severe impairment; the degree cannot be established in the pharmacy.'
      )
    );
  }
  const resp: string[] = [];
  if (medical.severeCopd) resp.push('severe COPD (FEV1 below 40 per cent of predicted where known, home oxygen, or a hospital admission for COPD in the last 12 months)');
  if (medical.respiratoryFailure) resp.push('chronic respiratory failure');
  if (medical.obesityHypoventilation) resp.push('obesity hypoventilation');
  if (medical.neuromuscularBreathing) resp.push('a neuromuscular condition affecting breathing');
  if (resp.length > 0) {
    alerts.push(stop('RESPIRATORY', `Respiratory exclusion: ${resp.join('; ')}`, 'Excluded. ' + INTERACTION_REFER));
  }
  if (medical.mildModerateCopd) {
    alerts.push(caution('MILD_MODERATE_COPD', 'Mild to moderate COPD', 'Not excluded. The SmPC found no worsening of oxygen saturation in moderate COPD; not studied in severe COPD.'));
  }
  if (medical.pregnant || medical.planningPregnancy || medical.breastfeeding) {
    const w = [medical.pregnant ? 'pregnancy' : '', medical.planningPregnancy ? 'planning a pregnancy during the course' : '', medical.breastfeeding ? 'breastfeeding' : ''].filter(Boolean).join('; ');
    alerts.push(
      stop(
        'PREGNANCY_BREASTFEEDING',
        `Excluded: ${w}`,
        'No human pregnancy data; excreted in breast milk in small amounts, and a risk of excessive sleepiness in the breastfed infant cannot be excluded.' + (review && medical.pregnant ? ' Advise stopping and telling the GP.' : '')
      )
    );
  }
  if (medical.soleNightCarer) {
    alerts.push(stop('SOLE_NIGHT_CARER', 'The sole night-time carer of an infant or of a dependent adult who may need them during the night', 'Excluded. Refer to the GP.'));
  }
  if (patient.age !== null && patient.age >= 65 && (medical.fallLast12Months || medical.walkingAid || medical.nocturia2Plus)) {
    const w = [medical.fallLast12Months ? 'a fall in the last 12 months' : '', medical.walkingAid ? 'using a walking aid' : '', medical.nocturia2Plus ? 'getting up at night to the toilet 2 or more times on most nights' : ''].filter(Boolean).join('; ');
    alerts.push(stop('FALLS_RISK_65', `Aged 65 or over with ${w}`, 'Excluded (falls). ' + INTERACTION_REFER));
  }
  if (medical.dementiaMemory) {
    alerts.push(stop('DEMENTIA_MEMORY', 'Dementia or any condition affecting memory', 'Excluded. Refer to the GP.'));
  }
  if (medical.currentSuicidalThoughts || medical.selfHarm2Years) {
    const w = [medical.currentSuicidalThoughts ? 'current thoughts of suicide or self-harm' : '', medical.selfHarm2Years ? 'self-harm or a suicide attempt in the last 2 years' : ''].filter(Boolean).join('; ');
    alerts.push(
      stop(
        'SUICIDE_SELF_HARM_RISK',
        `Suicide or self-harm risk: ${w}`,
        (review ? 'STOP RULE (same day): no further supply under this PGD; record the adverse reaction; Yellow Card; inform the GP. ' : 'Excluded (same-day assessment). ') + MH_SAME_DAY
      )
    );
  }
  if (medical.bipolarPsychosis || medical.eatingDisorder) {
    const w = [medical.bipolarPsychosis ? 'diagnosed bipolar disorder, psychosis or schizophrenia' : '', medical.eatingDisorder ? 'an eating disorder' : ''].filter(Boolean).join('; ');
    alerts.push(stop('SERIOUS_MENTAL_ILLNESS', w.charAt(0).toUpperCase() + w.slice(1), 'Excluded. ' + MH_ROUTINE));
  }
  if (medical.ptsd) {
    alerts.push(stop('PTSD', 'Post-traumatic stress disorder under active treatment, or with nightmares', 'Excluded. ' + MH_ROUTINE));
  }
  if (medical.secondaryCareMh) {
    alerts.push(stop('SECONDARY_CARE_MH', 'Current care under a secondary care mental health team', 'Excluded. ' + MH_ROUTINE));
  }
  if (medical.mhTreatmentChanged3Months) {
    alerts.push(stop('MH_TREATMENT_CHANGED', 'Depression or anxiety whose treatment has started or changed in the last 3 months', 'Excluded. ' + MH_ROUTINE));
  }
  if (medical.stableTreatedDepAnx && !medical.mhTreatmentChanged3Months) {
    alerts.push(
      caution(
        'STABLE_DEPRESSION_ANXIETY',
        'Stable, treated depression or anxiety',
        'With PHQ-9 below 10 and GAD-2 below 3 (or GAD-7 below 10 where done), on unchanged treatment for at least 3 months (for example an SSRI; citalopram had no relevant interaction in the SmPC). The SmPC advises caution and data are limited. Repeat PHQ-9 and GAD-2 at every supply visit and apply the exclusion if a threshold is reached.'
      )
    );
  }
  if (medical.substanceMisuse) {
    alerts.push(
      stop(
        'SUBSTANCE_MISUSE',
        'Current or past misuse of, or dependence on, alcohol, prescribed medicines or recreational drugs',
        'Excluded. The SmPC advises careful follow-up of anyone with a history of abuse or addiction, which a three-supply PGD cannot provide. Refer to the GP.'
      )
    );
  }
  if (medical.alcoholOver14) {
    alerts.push(stop('ALCOHOL_OVER_14', 'Drinking more than 14 units of alcohol a week', 'Excluded. Refer to the GP.'));
  }
  if (medical.cannabisRegular) {
    alerts.push(stop('CANNABIS', 'Regular use of cannabis or cannabis-based products', 'Excluded. Refer to the GP.'));
  }

  // ── Medicines ──
  if (medicines.strongInhibitor) {
    alerts.push(
      stop(
        'STRONG_CYP3A4_INHIBITOR',
        'Strong CYP3A4 inhibitor',
        'Contraindicated (Appendix 4): for example itraconazole, ketoconazole, posaconazole, voriconazole, clarithromycin, ritonavir or cobicistat in any combination including nirmatrelvir with ritonavir (Paxlovid), idelalisib, and any medicine its SmPC or the BNF describes as a strong CYP3A4 inhibitor. ' + INTERACTION_REFER
      )
    );
  }
  if (medicines.inducer) {
    alerts.push(
      stop(
        'CYP3A4_INDUCER',
        'Moderate or strong CYP3A4 inducer',
        'Excluded (Appendix 4): for example carbamazepine, phenytoin, phenobarbital, primidone, rifampicin, rifabutin, efavirenz, etravirine, enzalutamide, apalutamide, mitotane, modafinil, bosentan or St John\'s wort. Exposure is substantially reduced and the treatment may not work. ' + INTERACTION_REFER
      )
    );
  }
  if (medicines.ntiSubstrate) {
    alerts.push(
      stop(
        'NTI_SUBSTRATE',
        'Narrow therapeutic index medicine affected by daridorexant 50 mg',
        'Excluded (Appendix 4): tacrolimus, sirolimus, everolimus, ciclosporin, digoxin, dabigatran, colchicine taken regularly, or simvastatin 80 mg. ' + INTERACTION_REFER
      )
    );
  }
  if (medicines.cnsDepressantPrescribed) {
    alerts.push(
      stop(
        'CNS_DEPRESSANT',
        'Another hypnotic or sedative taken regularly and continuing',
        'Excluded (Appendix 4). The SmPC says dose adjustment of either medicine may be needed, which a PGD cannot provide. A prescribed medicine is never stopped to allow supply: refer.'
      )
    );
  }
  if (medicines.nonPrescribedSleepAid) {
    if (medicines.sleepAidAgreesStop === 'no') {
      alerts.push(
        stop(
          'SLEEP_AID_NOT_STOPPED',
          `Non-prescribed sleep aid that the patient will not stop${medicines.sleepAidName.trim() ? ` (${medicines.sleepAidName.trim()})` : ''}`,
          'Sedating antihistamines sold for sleep, melatonin from any source and herbal sedatives such as valerian are stopped before the course and not used during it. Taken regularly and continuing, it is in the CNS depressant exclusion.'
        )
      );
    } else if (medicines.sleepAidAgreesStop === 'yes') {
      const gap = sleepAidIsLongActing(medicines) ? sleepAidGapHours(medicines) : null;
      if (gap !== null && gap < 48) {
        alerts.push(
          stop(
            'SLEEP_AID_48_HOURS',
            `Only ${gap} hours between the last dose of ${medicines.sleepAidName.trim() || 'the long-acting sedating antihistamine'} and the planned first dose of daridorexant (48 hours needed)`,
            `The first dose of daridorexant is taken at least 48 hours after the last dose of a long-acting sedating antihistamine such as promethazine. Not supplied until the gap is met: the earliest first dose is ${(() => {
              const a = londonInstant(medicines.sleepAidLastDose, medicines.sleepAidLastDoseTime);
              return a === null ? '48 hours after the last dose' : new Date(a + 48 * 3600000).toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            })()}. Move the planned first dose, or invite the patient back.`
          )
        );
      }
      alerts.push(
        caution(
          'SLEEP_AID_STOPPED',
          `Non-prescribed sleep aid stopped${medicines.sleepAidName.trim() ? ` (${medicines.sleepAidName.trim()})` : ''}`,
          sleepAidIsLongActing(medicines)
            ? `The first dose of daridorexant is taken at least 48 hours after the last dose of a long-acting sedating antihistamine such as promethazine${medicines.sleepAidLastDose ? ` (last dose ${formatUk(medicines.sleepAidLastDose)} ${medicines.sleepAidLastDoseTime}; planned first dose ${formatUk(medicines.plannedFirstDoseDate)} ${medicines.plannedFirstDoseTime})` : ''}. Record when it was stopped.`
            : 'For other sleep aids, the first dose is taken at least the night after the last dose. Record when it was stopped.'
        )
      );
    }
  }
  if (medicines.moderateInhibitorRegular) {
    if (moderateInhibitorQualifies(medicines)) {
      alerts.push(
        caution(
          'MODERATE_INHIBITOR_25MG',
          `Regular moderate CYP3A4 inhibitor${medicines.moderateInhibitorName.trim() ? ` (${medicines.moderateInhibitorName.trim()})` : ''}: the dose is 25 mg`,
          'Taken regularly, at a stable dose and expected to continue for the rest of the course: 25 mg once nightly (SmPC 4.2 and 4.5). A patient who stops the inhibitor finishes the 25 mg tablets in hand; the next supply is 50 mg.'
        )
      );
    } else if (medicines.moderateStable === 'no' || medicines.moderateContinue === 'no') {
      alerts.push(
        stop(
          'MODERATE_INHIBITOR_NOT_STABLE',
          'Moderate CYP3A4 inhibitor not at a stable dose, or not expected to continue for the rest of the course',
          '25 mg applies ONLY where the patient regularly takes a moderate CYP3A4 inhibitor at a stable dose and expects to continue it for the rest of the course; no other reason for 25 mg applies, and 50 mg is not given alongside a moderate inhibitor. ' + INTERACTION_REFER
        )
      );
    }
  }
  if (medicines.shortCourseInhibitor) {
    alerts.push(
      caution(
        'SHORT_COURSE_INHIBITOR',
        `Short course of a moderate or strong CYP3A4 inhibitor${medicines.shortCourseDetails.trim() ? ` (${medicines.shortCourseDetails.trim()})` : ''}`,
        'Do not take daridorexant from the first dose of that medicine until 7 days after the last dose, then resume. The patient tells the pharmacy when this happens, and the withheld nights are recorded. The dose in the patient\'s possession is never changed.'
      )
    );
  }
  if (medicines.otherSubstrate) {
    alerts.push(
      caution(
        'OTHER_SUBSTRATE',
        'Other CYP3A4 or P-gp substrate not excluded',
        'For example simvastatin up to 40 mg or atorvastatin: no dose change is needed; advise the patient to report unexplained muscle pain.'
      )
    );
  }
  if (medicines.occasionalSedating) {
    alerts.push(
      caution(
        'OCCASIONAL_SEDATING',
        'An occasional single dose of another sedating medicine taken for a different reason',
        'For example chlorphenamine for hay fever or a codeine-containing painkiller: do not take daridorexant that night.'
      )
    );
  }
  if (medicines.scrStatus === 'refused') {
    alerts.push(stop('SCR_REFUSED', 'Refuses consent to the Summary Care Record check where a record exists', 'A patient who refuses consent to the check is not supplied.'));
  }

  // ── Driving ──
  const drives = driving.drives === 'yes';
  if (v1 && drives && driving.first4Arranged === 'no') {
    alerts.push(
      stop(
        'DRIVING_FIRST_4_NOT_POSSIBLE',
        'Cannot arrange 4 nights before days with no driving for the first 4 doses',
        'Excluded. Refer to the GP or occupational health.'
      )
    );
  }
  if (driving.mustEarlyCannot9 === 'yes') {
    alerts.push(
      stop(
        'DRIVING_CANNOT_KEEP_9_HOURS',
        'Must drive, or do other work needing full alertness, early in the morning and cannot reliably keep at least 9 hours between a dose and starting',
        'Excluded, whatever their licence. Refer to the GP or occupational health.'
      )
    );
  }
  const shorts = shortNights(driving);
  const workShorts = shorts.filter((s) => s.work);
  const workDriverShorts = driving.drivesForWork === 'yes' ? shorts : workShorts;
  if (workDriverShorts.length > 0) {
    alerts.push(
      stop(
        'EARLY_MORNING_WORK_DRIVER',
        workShorts.length > 0
          ? `Work driving or alert work less than 9 hours after the usual bedtime on: ${workShorts.map((s) => `${s.day} (${s.hours} hours)`).join(', ')}`
          : `Drives for work, and the plan cannot keep 9 hours on: ${workDriverShorts.map((s) => `${s.day} (${s.hours} hours)`).join(', ')}`,
        'Anyone who must drive, or do other work needing full alertness, early in the morning and cannot reliably keep at least 9 hours between taking a dose and starting is excluded, whatever their licence. Refer to the GP or occupational health. Where the times entered are wrong, correct them.'
      )
    );
  }
  if (shorts.length >= 3 && driving.mustEarlyCannot9 === 'no') {
    alerts.push(
      stop(
        'DRIVING_9_HOURS_INCONSISTENT',
        `${shorts.length} nights a week would need the dose skipped (${shorts.map((s) => s.nightBefore).join(', ')}), but the answer says 9 hours can reliably be kept`,
        'The answer to the 9-hour question does not fit the schedule. A plan that needs the dose skipped on 3 or more nights a week cannot reliably keep 9 hours: correct the times entered, or answer the 9-hour question "yes" (excluded; refer to the GP or occupational health).'
      )
    );
  }
  const nonWorkShorts = shorts.filter((s) => !s.work);
  if (nonWorkShorts.length > 0 && workDriverShorts.length === 0) {
    alerts.push(
      caution(
        'DRIVING_SKIP_NIGHTS',
        `Less than 9 hours between the usual bedtime and driving on: ${nonWorkShorts.map((s) => `${s.day} (${s.hours} hours)`).join(', ')}`,
        `Skip the dose on any night when there will not be at least 9 hours before driving or another activity needing full alertness: here the nights of ${nonWorkShorts.map((s) => s.nightBefore).join(', ')}, unless the driving is moved. Record the agreed plan.`
      )
    );
  }
  if (driving.group2ForWork) {
    alerts.push(stop('GROUP2_DRIVER', 'A Group 2 (lorry or bus) licence holder who drives for work', 'Excluded. Refer to the GP or occupational health.'));
  }
  if (driving.safetyCriticalRole) {
    alerts.push(
      stop(
        'SAFETY_CRITICAL_ROLE',
        'A safety-critical role with its own fitness rules',
        'Excluded (for example pilot, air traffic controller, train driver, or on-call work needing full alertness within 9 hours of bedtime). Refer to the GP or occupational health.'
      )
    );
  }

  // ── Review and supply ──
  if (v2 && supply.wishesToContinue === 'no') {
    if (isiNotImproved(course, screening)) {
      alerts.push(
        stop(
          'EARLY_STOP_VISIT2',
          'EARLY STOP at supply visit 2: ISI unchanged or higher than baseline and the patient wishes to stop',
          'No supply 2; the GP is informed. Stopping is safe without tapering. Advise re-engaging with CBT-I.'
        )
      );
    } else {
      alerts.push(stop('NOT_WISHING_TO_CONTINUE', 'The patient does not wish to continue', 'Supply 2 requires that the patient wishes to continue. No supply; the GP is informed. Stopping is safe without tapering.'));
    }
  }
  if (v3) {
    if (course.nightsTakenOf14 !== null && course.nightsTakenOf14 < ADHERENCE_MIN_NIGHTS) {
      alerts.push(
        stop(
          'ADHERENCE_BELOW_10',
          `Tablets taken on ${course.nightsTakenOf14} of the last ${ADHERENCE_WINDOW_NIGHTS} nights on which a dose was due (fewer than ${ADHERENCE_MIN_NIGHTS})`,
          'At least 10 are needed for the response to be judged; with fewer, no supply 3 and refer to the GP.'
        )
      );
    }
    const r = responseTest(course, screening, supply);
    if (r.complete && !r.adequate) {
      const failed = [
        !r.fallOk ? `ISI fall ${r.fall} (6 or more needed)` : '',
        !r.currentOk ? `current ISI ${screening.isi} (14 or below needed)` : '',
        !r.daytimeOk ? 'daytime functioning not better' : '',
        !r.wishesOk ? 'the patient does not wish to continue' : '',
      ]
        .filter(Boolean)
        .join('; ');
      alerts.push(
        stop(
          'INADEQUATE_RESPONSE',
          `Effectiveness assessment does not show an adequate response: ${failed}`,
          'STOP, no supply 3; the patient stops the next night (no tapering is needed), is advised to re-engage with CBT-I, and the GP is informed.'
        )
      );
    } else if (r.complete && r.adequate) {
      alerts.push(
        caution(
          'ADEQUATE_RESPONSE',
          `Adequate response: ISI fall ${r.fall}, current ISI ${screening.isi}, daytime functioning better, wishes to continue`,
          'With the other supply visit 3 criteria met: SUPPLY 3 (30 tablets, the last under this PGD), and the handover letter is sent to the GP or another prescriber the same day.'
        )
      );
    }
  }

  return alerts;
}

// ─── GP letters ───

export interface LetterInputs extends AlertInputs {
  pharmacistName: string;
  pharmacyName: string;
  strength: Strength;
  supplied: boolean;
  stopReasons: string[];
  /** The stop codes standing today (choose the not-supplied wording). */
  stopCodes: string[];
  adverseEffects: string;
}

/** What the patient is invited back for, per return-later code. */
function returnLaterLine(code: string, x: LetterInputs): string {
  switch (code) {
    case 'NO_SLEEP_DIARY':
      return 'the patient has been given a sleep diary to keep for at least 7 consecutive nights, and supply 1 will be considered when it is complete';
    case 'CBTI_AVAILABLE_NOT_TRIED':
    case 'CBTI_PREFERENCE':
    case 'CBTI_TRIED_NOT_MET':
    case 'CBTI_NHS_AVAILABLE':
      return 'NHS CBT-I is available to the patient and is the first treatment: they have been signposted to it and invited to return if it has not worked after at least 4 weeks of engagement';
    case 'INTERVAL_TOO_SHORT': {
      const from = addDaysIso(x.course.previousSupplyDate, intervalMinDays(x.course));
      return `the visit was earlier than the supply interval allows; the patient has been asked to return${from ? ` from ${formatUk(from)}` : ' within the supply window'}`;
    }
    case 'SLEEP_AID_48_HOURS':
      return 'the first dose must be at least 48 hours after the last dose of a long-acting sedating antihistamine; the patient has been asked to return once that gap is met';
    default:
      return '';
  }
}

function patientLine(p: DPatientDetails): string {
  return `${p.firstName} ${p.lastName}, date of birth ${formatUk(p.dateOfBirth)}${p.nhsNumber ? `, NHS number ${p.nhsNumber}` : ''}`;
}

function cbtiPosition(c: DCbti): string {
  if (c.status === 'tried') return `CBT-I tried and not worked (${c.triedProgramme || 'programme not recorded'}, ${c.triedDates || 'dates not recorded'})`;
  if (c.status === 'not-available') return 'NHS CBT-I not available to the patient; brief CBT-I components delivered by the pharmacist';
  if (c.status === 'unsuitable') return `CBT-I unsuitable (${c.unsuitableReason || 'reason not recorded'}); brief CBT-I components delivered by the pharmacist`;
  return 'CBT-I position recorded at supply 1';
}

/** The GP letter text: notification of supply 1 or 2, the handover letter at supply visit 3, or a stop notification. */
export function gpLetterText(x: LetterInputs): string {
  const { patient, course, screening, supply } = x;
  const n = supplyNumber(course);
  const p = patientLine(patient);
  const sign = `\n\nYours sincerely,\n${x.pharmacistName || '[pharmacist]'}\n${x.pharmacyName || '[pharmacy]'}\nSupplied under Get Real Health PGD Long-Term Insomnia (Daridorexant), version 001.`;
  const strengthWords = x.strength === '25' ? '25 mg (regular moderate CYP3A4 inhibitor)' : '50 mg';
  const scores = `ISI ${course.baselineIsi ?? screening.isi ?? 'not recorded'} at baseline${n && n > 1 ? `, ${screening.isi ?? 'not recorded'} today` : ''}; PHQ-9 ${screening.phq9 ?? 'not recorded'} (question 9: ${screening.phq9Q9 === 'not-at-all' ? 'not at all' : screening.phq9Q9 || 'not recorded'}); GAD-2 ${screening.gad2 ?? 'not recorded'}${screening.gad7 !== null ? `, GAD-7 ${screening.gad7}` : ''}`;

  if (!x.supplied) {
    const today = formatUk(todayIso());
    const codes = x.stopCodes;
    const stopRules = stopRuleCodesFor(course);
    const courseEnding = codes.some((c) => COURSE_ENDED_CODES.has(c) || stopRules.has(c));
    const returnLater = codes.length > 0 && codes.every((c) => RETURN_LATER_CODES.has(c));
    const header = `Dear Doctor,\n\nRe: ${p}\n\nYour patient attended ${n ? `supply visit ${n}` : 'the pharmacy'} under our daridorexant (QUVIVIQ, black triangle) Patient Group Direction for long-term insomnia on ${today}.`;
    const ae = x.adverseEffects ? ` Adverse effects reported: ${x.adverseEffects}; a Yellow Card report has been made.` : '';
    if (returnLater && !courseEnding) {
      const lines = [...new Set(codes.map((c) => returnLaterLine(c, x)).filter(Boolean))];
      return `${header} No supply was made today, for the following reason(s): ${x.stopReasons.join('; ') || 'see the record'}.\n\nThis is not the end of ${n && n > 1 ? 'the course' : 'the assessment'}: ${lines.join('; ')}.\n\nScores today: ${scores}.${ae}${sign}`;
    }
    const stopped = courseEnding || (n !== null && n > 1);
    return `${header} No supply was made today, and ${stopped ? (n && n > 1 ? 'the course under the PGD has stopped' : 'the course under the PGD has ended') : 'treatment was not started'}, for the following reason(s): ${x.stopReasons.join('; ') || 'see the record'}.\n\nScores today: ${scores}.${ae}\n\nThe patient has been advised accordingly${n && n > 1 ? ', and that stopping daridorexant is safe without tapering' : ''}. Any further treatment is for a prescriber.${sign}`;
  }
  if (n === 3) {
    const r = responseTest(course, screening, supply);
    return `Dear Doctor${supply.handoverRecipient === 'other' && supply.handoverOtherName ? ` (${supply.handoverOtherName})` : ''},\n\nRe: ${p}\n\nHANDOVER: daridorexant (QUVIVIQ, black triangle) initiation course under a Patient Group Direction\n\nYour patient has today completed the NICE TA922 effectiveness assessment at supply visit 3 and has received supply 3, the last of three 30-tablet supplies under our PGD, at ${strengthWords} once nightly. They now have about a month of tablets.\n\nSupply dates: supply 1 ${formatUk(course.supply1Date)}; supply 2 ${formatUk(course.previousSupplyDate)}; supply 3 ${formatUk(todayIso())}.\nScores: ISI ${course.baselineIsi ?? '?'} at baseline and ${screening.isi ?? '?'} today (a fall of ${r.fall ?? '?'}); PHQ-9 ${screening.phq9 ?? '?'} (question 9 not at all); GAD-2 ${screening.gad2 ?? '?'}${screening.gad7 !== null ? `, GAD-7 ${screening.gad7}` : ''}.\nThe patient reports better daytime functioning and wishes to continue.\nAdherence: tablets taken on ${course.nightsTakenOf14 ?? '?'} of the last 14 nights on which a dose was due${(course.withheldNights ?? 0) > 0 ? `; ${course.withheldNights} nights withheld for an interacting medicine (${course.withheldDetails || 'details on the record'})` : ''}.\nAdverse effects: ${x.adverseEffects || 'none reported'}.\nCBT-I: ${cbtiPosition(x.cbti)}.\n\nNICE TA922 requires continued treatment to be reassessed at regular intervals. We ask you to consider whether to continue daridorexant. The decision is yours. If you do not continue it, the patient may see a private prescriber; they have been told this, and that if treatment does not continue, stopping is safe without tapering.${sign}`;
  }
  return `Dear Doctor,\n\nRe: ${p}\n\nWe are writing to let you know that your patient has received supply ${n ?? '?'} of up to three 30-tablet supplies of daridorexant (QUVIVIQ, black triangle) ${strengthWords} once nightly under our Patient Group Direction for long-term insomnia (NICE TA922), today, ${formatUk(todayIso())}.\n\nScores: ${scores}.\nCBT-I: ${cbtiPosition(x.cbti)}.\n${n === 2 ? `Adverse effects since supply 1: ${x.adverseEffects || 'none reported'}.\n` : ''}\nThe course is an initiation course only. At supply visit 3 the effectiveness assessment is made; with an adequate response we will write to ask you to consider continuing, which is your decision. The patient has been told that you may decline to continue it.${sign}`;
}

export { PRODUCTS };
