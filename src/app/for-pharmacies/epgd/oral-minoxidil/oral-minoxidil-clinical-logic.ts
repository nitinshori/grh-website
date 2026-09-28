import type { ClinicalAlert } from '../shared/types';
import type {
  Dose,
  OMConsent,
  OMDiagnosis,
  OMMeasurements,
  OMMedicalHistory,
  OMMedicines,
  OMPatientDetails,
  OMSupply,
  OMSupplyHistory,
  OMWomen,
  Sex,
} from './oral-minoxidil-types';
import {
  ACCEPTED_CONTRACEPTION,
  AWAITING_REVIEW_MAX_GAP_DAYS,
  DOSE_INCREASE_MIN_SUPPLY_NUMBER,
  DOSE_INFO,
  FACE_TO_FACE_CV_REVIEW_TYPES,
  MAX_SUPPLIES,
  ORAL_MINOXIDIL_PGD_VERSION,
  PRESCRIBER_REVIEW_SOUGHT_SUPPLY_NUMBER,
  REPEAT_PHOTO_SUPPLY_NUMBERS,
  RESTART_GAP_DAYS,
  SHEDDING_SETTLES_BY_WEEKS,
  SUPPLY_DAYS,
} from './oral-minoxidil-types';

export { ORAL_MINOXIDIL_PGD_VERSION };

// ─── Steps ───

export const STEP_LABELS = [
  'Patient Details',
  'Consent',
  'Supply Type and History',
  'Diagnosis',
  'Women: Bloods and Pregnancy',
  'Cardiovascular and Medical History',
  'Medicines',
  'Measurements',
  'Dose and Supply',
  'Counselling',
  'Summary',
] as const;

export const STEP = {
  patient: 0,
  consent: 1,
  history: 2,
  diagnosis: 3,
  women: 4,
  medical: 5,
  medicines: 6,
  measurements: 7,
  supply: 8,
  counselling: 9,
  summary: 10,
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Calendar days from the date to today (positive when the date is in the past). */
export function daysSince(iso: string): number | null {
  const d = parseLocalDate(iso);
  if (!d) return null;
  return Math.round((todayLocal().getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function isExpired(expiryDate: string): boolean {
  const d = daysSince(expiryDate);
  return d !== null && d > 0;
}

/**
 * "Within the last 12 months" means within 12 calendar months, not 365 days:
 * a test dated on or after the same calendar day 12 months ago qualifies.
 * Where that day does not exist (29 February), the last day of that month
 * is used.
 */
export function withinLastCalendarMonths(iso: string, months: number): boolean | null {
  const d = parseLocalDate(iso);
  if (!d) return null;
  const today = todayLocal();
  let cutoff = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());
  if (cutoff.getDate() !== today.getDate()) cutoff = new Date(today.getFullYear(), today.getMonth() - months + 1, 0);
  return d.getTime() >= cutoff.getTime();
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** The next review is due in 8 weeks (56 days), before the supply runs out. */
export function nextReviewDateFromToday(): string {
  return formatLocalDate(addDays(todayLocal(), SUPPLY_DAYS));
}

/** Days without tablets, from the date the last tablet was taken. */
export function gapDays(history: OMSupplyHistory): number | null {
  const d = daysSince(history.lastTabletDate);
  return d === null ? null : d;
}

/**
 * A gap of more than 4 weeks is a restart, unless it was caused only by
 * waiting for the prescriber review after supply 6 and the patient has been
 * off tablets for no more than 8 weeks. That exception needs the review to be
 * held and no supply made since it.
 */
export function gapIsRestart(history: OMSupplyHistory): boolean | null {
  const gap = gapDays(history);
  if (gap === null) return null;
  if (gap <= RESTART_GAP_DAYS) return false;
  if (gap > AWAITING_REVIEW_MAX_GAP_DAYS) return true;
  const awaitingReviewException =
    history.gapAwaitingReview &&
    history.prescriberReviewHeld &&
    history.suppliesSinceReview === 0 &&
    history.suppliesSoFar !== null &&
    history.suppliesSoFar >= MAX_SUPPLIES;
  return !awaitingReviewException;
}

// ─── Supply count ───
// Everything runs on the supply number, not the calendar. Every supply is
// numbered from the first supply; a gap or restart never resets the number.

/** Supplies counted against the maximum of six: since the last prescriber review where one is held, otherwise since the first supply. */
export function suppliesCounted(history: OMSupplyHistory): number | null {
  if (history.supplyType === 'first' || !history.supplyType) return 0;
  if (history.prescriberReviewHeld) return history.suppliesSinceReview;
  return history.suppliesSoFar;
}

/** Today's supply number counted from the first supply (a restart does not reset it). */
export function todaySupplyNumber(history: OMSupplyHistory): number | null {
  if (history.supplyType === 'first' || !history.supplyType) return 1;
  if (history.suppliesSoFar === null) return null;
  return history.suppliesSoFar + 1;
}

/**
 * Today's supply visit number within the current period of six: counted from
 * the first supply, or from the last prescriber review where one is held. The
 * full reviews with repeat photographs fall at visits 4 and 6 of each period,
 * and the prescriber review is sought at visit 6.
 */
export function periodVisitNumber(history: OMSupplyHistory): number | null {
  const counted = suppliesCounted(history);
  return counted === null ? null : counted + 1;
}

/** Today's supply visit number counted from the most recent restart (the restart supply itself is visit 1). */
export function visitNumberSinceRestart(history: OMSupplyHistory): number | null {
  if (history.supplyType === 'restart') return 1;
  if (history.supplyType !== 'continuation' || !history.restartedBefore) return null;
  return history.suppliesSinceRestart === null ? null : history.suppliesSinceRestart + 1;
}

/** Repeat photographs and a response assessment are required at supply visits 4 and 6. */
export function repeatPhotosRequired(history: OMSupplyHistory): boolean {
  const n = periodVisitNumber(history);
  return n !== null && history.supplyType !== 'first' && REPEAT_PHOTO_SUPPLY_NUMBERS.has(n);
}

/** At supply visit 6 the record is sent for the prescriber review, which must be complete before a seventh supply. */
export function prescriberReviewSoughtToday(history: OMSupplyHistory): boolean {
  const n = periodVisitNumber(history);
  return n !== null && history.supplyType !== 'first' && n === PRESCRIBER_REVIEW_SOUGHT_SUPPLY_NUMBER;
}

/**
 * Approximate weeks of treatment completed before today's visit when the
 * patient has attended on time, counted from the most recent restart where
 * there has been one: 8 weeks per completed supply. Used only as a hint for
 * the 12 week shedding rule; the pharmacist records the determination.
 */
export function approxWeeksOnTreatment(history: OMSupplyHistory): number | null {
  const sinceRestart = visitNumberSinceRestart(history);
  const n = sinceRestart ?? todaySupplyNumber(history);
  if (n === null) return null;
  return (n - 1) * (SUPPLY_DAYS / 7);
}

export { SHEDDING_SETTLES_BY_WEEKS };

// ─── Dose ───

export function startingDose(sex: Sex): Dose {
  if (sex === 'male') return '2.5';
  if (sex === 'female') return '1.25';
  return '';
}

export function maximumDose(sex: Sex): Dose {
  if (sex === 'male') return '5';
  if (sex === 'female') return '2.5';
  return '';
}

export function dosesForSex(sex: Sex): Exclude<Dose, ''>[] {
  if (sex === 'male') return ['2.5', '5'];
  if (sex === 'female') return ['1.25', '2.5'];
  return [];
}

/** True when today is at or after the fourth supply visit counted from the first supply. */
export function increaseWindowOpen(history: OMSupplyHistory): boolean {
  const n = todaySupplyNumber(history);
  return n !== null && n >= DOSE_INCREASE_MIN_SUPPLY_NUMBER;
}

/** True when today is at or after the fourth supply visit following the most recent restart. */
export function resumeWindowOpen(history: OMSupplyHistory): boolean {
  const n = visitNumberSinceRestart(history);
  return n !== null && n >= DOSE_INCREASE_MIN_SUPPLY_NUMBER;
}

/** The patient is currently on the higher dose (the one-step increase, whether first used or resumed). */
export function onHigherDose(sex: Sex, history: OMSupplyHistory): boolean {
  const max = maximumDose(sex);
  return !!max && history.currentDose === max;
}

/**
 * The once-only increase has been used: either recorded as such, or implied
 * by the patient being on the higher dose (nobody reaches the higher dose
 * without it). Used everywhere the increase is offered or refused, so a
 * higher current dose can never be paired with an unused increase.
 */
export function increaseUsed(sex: Sex, history: OMSupplyHistory): boolean {
  return history.doseIncreasedBefore || onHigherDose(sex, history);
}

/**
 * A patient who had already used the increase, restarted at the starting
 * dose, and is now at or after the fourth supply visit following the restart
 * may resume the higher dose if the same conditions are met. Nobody has two
 * increases: the resume is not an increase.
 */
export function resumeAvailable(sex: Sex, history: OMSupplyHistory): boolean {
  return (
    history.supplyType === 'continuation' &&
    increaseUsed(sex, history) &&
    history.restartedBefore &&
    !onHigherDose(sex, history) &&
    history.currentDose === startingDose(sex)
  );
}

/** The conditions shared by the increase and the resume: response, tolerance, today's systolic against the baseline, and the pulse. */
function higherDoseConditionsBlockedReason(history: OMSupplyHistory, diagnosis: OMDiagnosis, measurements: OMMeasurements): string | null {
  if (diagnosis.response !== 'inadequate') return 'The response must be recorded as inadequate against the baseline photographs';
  if (anyStopSymptom(history, measurements)) return 'A stop symptom since the last visit, or dizziness or faintness today, is a cardiovascular stop';
  if (history.seHypertrichosis && history.seHypertrichosisMinds) return 'The patient has hypertrichosis they mind: no higher dose';
  const bp = effectiveSeated(measurements);
  if (!bp) return "Today's seated blood pressure is not yet recorded";
  if (bp.systolic < 100) return "Today's systolic must be 100 mmHg or more";
  if (history.baselineSystolic === null) return 'The baseline systolic (the lower seated systolic at the first supply, or at the most recent restart) is not recorded';
  if (bp.systolic < history.baselineSystolic - 10)
    return `Today's systolic (${bp.systolic}) is more than 10 mmHg below the baseline reading (${history.baselineSystolic})`;
  const p = effectivePulse(measurements);
  if (p === null) return "Today's pulse is not yet recorded";
  if (p < 50 || p > 100) return 'The pulse is outside 50 to 100';
  return null;
}

/** Why the once-only dose increase is not permitted today, or null when every condition is met. */
export function doseIncreaseBlockedReason(
  sex: Sex,
  history: OMSupplyHistory,
  diagnosis: OMDiagnosis,
  measurements: OMMeasurements
): string | null {
  const n = todaySupplyNumber(history);
  if (history.supplyType !== 'continuation') return 'A dose increase is only made at a continuation supply';
  if (increaseUsed(sex, history))
    return 'The dose increase has already been used once in this patient\'s course and nobody has two increases; where the patient restarted at the starting dose after using it, select "Resume the higher dose" instead';
  if (!increaseWindowOpen(history))
    return `Not before the fourth supply visit; today is supply visit ${n ?? '?'}`;
  if (onHigherDose(sex, history)) return 'The patient is already on the higher dose';
  if (history.currentDose !== startingDose(sex)) return 'The patient is not on the starting dose';
  return higherDoseConditionsBlockedReason(history, diagnosis, measurements);
}

/** Why resuming the higher dose after a restart is not permitted today, or null when every condition is met. */
export function doseResumeBlockedReason(
  sex: Sex,
  history: OMSupplyHistory,
  diagnosis: OMDiagnosis,
  measurements: OMMeasurements
): string | null {
  if (history.supplyType !== 'continuation') return 'The higher dose is only resumed at a continuation supply';
  if (!increaseUsed(sex, history)) return 'The patient has not used the dose increase before: this would be the increase, not a resume';
  if (!history.restartedBefore) return 'The patient has not restarted at the starting dose since using the increase';
  if (onHigherDose(sex, history)) return 'The patient is already on the higher dose';
  if (history.currentDose !== startingDose(sex)) return 'The patient is not on the starting dose';
  const n = visitNumberSinceRestart(history);
  if (!resumeWindowOpen(history))
    return `Not before the fourth supply visit following the restart; today is supply visit ${n ?? '?'} since the restart`;
  return higherDoseConditionsBlockedReason(history, diagnosis, measurements);
}

/** The dose supplied today, from the supply type, the sex and the dose decision. */
export function doseToday(sex: Sex, history: OMSupplyHistory, supply: OMSupply): Dose {
  const start = startingDose(sex);
  if (!start) return '';
  if (history.supplyType === 'first' || history.supplyType === 'restart') return start;
  if (history.supplyType !== 'continuation') return '';
  switch (supply.doseDecision) {
    case 'unchanged':
      return history.currentDose;
    case 'increase':
    case 'resume':
      return maximumDose(sex);
    case 'reduce':
      return start;
    default:
      return '';
  }
}

export function tabletsFor(dose: Dose): number | null {
  return dose ? DOSE_INFO[dose].tablets : null;
}

// ─── Measurements ───

export interface Reading {
  systolic: number;
  diastolic: number;
}

/** The lower of the two seated readings (the reading with the lower systolic; on a tie, the lower diastolic). */
export function lowerSeated(m: OMMeasurements): Reading | null {
  const r1 = m.seated1Systolic !== null && m.seated1Diastolic !== null ? { systolic: m.seated1Systolic, diastolic: m.seated1Diastolic } : null;
  const r2 = m.seated2Systolic !== null && m.seated2Diastolic !== null ? { systolic: m.seated2Systolic, diastolic: m.seated2Diastolic } : null;
  if (!r1 || !r2) return null;
  if (r1.systolic !== r2.systolic) return r1.systolic < r2.systolic ? r1 : r2;
  return r1.diastolic <= r2.diastolic ? r1 : r2;
}

export function repeatReading(m: OMMeasurements): Reading | null {
  if (!m.repeatTaken || m.repeatSystolic === null || m.repeatDiastolic === null) return null;
  return { systolic: m.repeatSystolic, diastolic: m.repeatDiastolic };
}

/** The reading the limits are applied to: the third reading where taken, otherwise the lower of the two seated readings. */
export function effectiveSeated(m: OMMeasurements): Reading | null {
  return repeatReading(m) ?? lowerSeated(m);
}

export function effectivePulse(m: OMMeasurements): number | null {
  if (m.pulseRepeatTaken && m.pulseRepeat !== null) return m.pulseRepeat;
  return m.pulse;
}

/**
 * The baseline systolic that applies to the 10 mmHg rule: the lower seated
 * systolic recorded at the first supply or at the most recent restart. At a
 * first supply or a restart it is today's lower seated systolic (a restart
 * records a new baseline); at a continuation it is the value carried in the
 * history.
 */
export function applicableBaselineSystolic(history: OMSupplyHistory, m: OMMeasurements): number | null {
  if (history.supplyType === 'first' || history.supplyType === 'restart') return lowerSeated(m)?.systolic ?? null;
  if (history.supplyType === 'continuation') return history.baselineSystolic;
  return null;
}

export function isHigh(r: Reading): boolean {
  return r.systolic >= 140 || r.diastolic >= 90;
}

/** Systolic below 90: hypotension. */
export function isLow(r: Reading): boolean {
  return r.systolic < 90;
}

/** Systolic 90 to 99: acceptable only where the patient has no dizziness or faintness. */
export function isBorderlineLow(r: Reading): boolean {
  return r.systolic >= 90 && r.systolic <= 99;
}

/** A seated reading outside the limits in either direction (before considering symptoms). */
export function seatedOutsideLimits(r: Reading, dizzinessOrFaintness: boolean): boolean {
  return isHigh(r) || isLow(r) || (isBorderlineLow(r) && dizzinessOrFaintness);
}

/** 180/120 or above: same-day referral for blood pressure assessment. */
export function isSevere(r: Reading): boolean {
  return r.systolic >= 180 || r.diastolic >= 120;
}

export function standingReading(m: OMMeasurements): Reading | null {
  if (m.standingSystolic === null || m.standingDiastolic === null) return null;
  return { systolic: m.standingSystolic, diastolic: m.standingDiastolic };
}

export function posturalFall(m: OMMeasurements): { systolic: number; diastolic: number } | null {
  const seated = effectiveSeated(m);
  const standing = standingReading(m);
  if (!seated || !standing) return null;
  return { systolic: seated.systolic - standing.systolic, diastolic: seated.diastolic - standing.diastolic };
}

export function bmi(m: OMMeasurements): number | null {
  if (m.weightKg === null || m.heightCm === null || m.heightCm <= 0) return null;
  const h = m.heightCm / 100;
  return Math.round((m.weightKg / (h * h)) * 10) / 10;
}

/**
 * Weight change since the previous supply (kg), positive for a gain. Applies
 * at a continuation only: at a restart the weight and symptom comparison
 * starts afresh from today's values, and today's weight becomes the new
 * previous weight.
 */
export function weightChange(history: OMSupplyHistory, m: OMMeasurements): number | null {
  if (history.supplyType !== 'continuation') return null;
  if (history.previousWeightKg === null || m.weightKg === null) return null;
  return Math.round((m.weightKg - history.previousWeightKg) * 10) / 10;
}

/** The "since the last visit" stop symptom checklist applies at a continuation only (a restart starts afresh from today's values). */
export function sinceLastVisitSymptomsApply(history: OMSupplyHistory): boolean {
  return history.supplyType === 'continuation';
}

function anySinceLastVisitSymptom(history: OMSupplyHistory): boolean {
  return (
    sinceLastVisitSymptomsApply(history) &&
    (history.sxWeightGainReported ||
      history.sxAnkleSwelling ||
      history.sxFacialSwelling ||
      history.sxPalpitations ||
      history.sxChestPain ||
      history.sxBreathlessness ||
      history.sxDizzinessFaintness ||
      history.sxFainting)
  );
}

/**
 * Dizziness or faintness today is a cardiovascular stop symptom in its own
 * right at a continuation only. At a first supply or a restart (a new baseline
 * is being recorded) it is treated under the hypotension rule alone: systolic
 * 90 to 99 with dizziness or faintness is a stop on repeat, otherwise a caution.
 */
export function dizzinessTodayIsStop(history: OMSupplyHistory, m: OMMeasurements): boolean {
  return history.supplyType === 'continuation' && m.dizzinessOrFaintness;
}

/** Any cardiovascular stop symptom: since the last visit, or dizziness or faintness today (both continuation only). */
export function anyStopSymptom(history: OMSupplyHistory, m: OMMeasurements): boolean {
  return anySinceLastVisitSymptom(history) || dizzinessTodayIsStop(history, m);
}

/** Same-day referral for chest pain, breathlessness, palpitations, fainting or facial swelling; otherwise routine GP within a week. */
export function stopSymptomUrgency(history: OMSupplyHistory, m: OMMeasurements): 'same-day' | 'routine' | null {
  if (!anyStopSymptom(history, m)) return null;
  if (anySinceLastVisitSymptom(history) && (history.sxChestPain || history.sxBreathlessness || history.sxPalpitations || history.sxFainting || history.sxFacialSwelling)) return 'same-day';
  return 'routine';
}

export function stopSymptomList(history: OMSupplyHistory, m: OMMeasurements, change: number | null): string[] {
  const list: string[] = [];
  if (sinceLastVisitSymptomsApply(history)) {
    if (history.sxWeightGainReported) list.push('weight gain of 2 kg or more (reported)');
    if (change !== null && change >= 2) list.push(`weight gain of ${change} kg on the scales`);
    if (history.sxAnkleSwelling) list.push('ankle swelling');
    if (history.sxFacialSwelling) list.push('facial swelling');
    if (history.sxPalpitations) list.push('palpitations');
    if (history.sxChestPain) list.push('chest pain');
    if (history.sxBreathlessness) list.push('breathlessness');
    if (history.sxDizzinessFaintness) list.push('dizziness or faintness since the last visit');
    if (history.sxFainting) list.push('fainting');
  }
  if (dizzinessTodayIsStop(history, m)) list.push('dizziness or faintness today');
  return list;
}

/**
 * Combined hormonal contraception with migraine with aura: ticked by the
 * pharmacist on the Women step, or triggered automatically where the method
 * recorded is combined hormonal contraception and migraine with aura is
 * recorded on the Medical step.
 */
export function cocMigraineAuraApplies(women: OMWomen, medical: OMMedicalHistory): boolean {
  if (women.childbearingPotential !== 'yes') return false;
  if (women.cocWithMigraineAura) return true;
  return women.contraceptionMethod === 'combined-hormonal' && medical.migraineWithAura;
}

export function nonAndrogeneticFeatures(d: OMDiagnosis, sex: Sex): string[] {
  const f: string[] = [];
  if (d.onset === 'sudden') f.push('sudden onset');
  if (d.pattern === 'other') f.push('pattern not male or female pattern');
  if (d.patchesCompleteLoss) f.push('patches of complete loss');
  if (d.redness) f.push('scalp redness');
  if (d.scale) f.push('scale');
  if (d.pustules) f.push('pustules');
  if (d.scarring) f.push('scarring');
  if (d.pain) f.push('scalp pain');
  if (d.itch) f.push('itch');
  if (d.lossFollicularOpenings) f.push('loss of follicular openings');
  if (d.brokenHairs) f.push('broken hairs');
  if (sex === 'female' && d.womanHairlineRecession) f.push('receding frontal or temporal hairline in a woman');
  if (d.eyebrowLoss) f.push('loss of the eyebrows');
  return f;
}

export function hyperandrogenismFeatures(d: OMDiagnosis): string[] {
  const f: string[] = [];
  if (d.hirsutism) f.push('hirsutism');
  if (d.newAcne) f.push('new acne');
  if (d.irregularPeriods) f.push('irregular periods');
  if (d.deepeningVoice) f.push('deepening voice');
  if (d.pcosDiagnosis) f.push('diagnosis of polycystic ovary syndrome');
  return f;
}

export function cardiovascularDiseaseList(h: OMMedicalHistory): string[] {
  const f: string[] = [];
  if (h.ischaemicHeartDisease) f.push('ischaemic heart disease or angina');
  if (h.previousMI) f.push('previous myocardial infarction');
  if (h.heartFailure) f.push('heart failure');
  if (h.arrhythmia) f.push('arrhythmia including atrial fibrillation');
  if (h.valvularDisease) f.push('valvular heart disease');
  if (h.cardiomyopathy) f.push('cardiomyopathy');
  if (h.congenitalHeartDisease) f.push('congenital heart disease');
  if (h.strokeTia) f.push('previous stroke or transient ischaemic attack');
  if (h.peripheralArterialDisease) f.push('peripheral arterial disease');
  if (h.pulmonaryHypertension) f.push('pulmonary hypertension');
  if (h.pots) f.push('postural tachycardia syndrome or other orthostatic intolerance');
  if (h.pericarditisOrEffusion) f.push('history of pericarditis or pericardial effusion');
  if (h.pleuralEffusion) f.push('history of pleural effusion');
  return f;
}

export function excludedMedicinesList(m: OMMedicines): string[] {
  const f: string[] = [];
  if (m.antihypertensive) f.push('an antihypertensive');
  if (m.betaBlocker) f.push('a beta-blocker (including propranolol for anxiety or migraine)');
  if (m.calciumChannelBlocker) f.push('a calcium channel blocker');
  if (m.diuretic) f.push('a diuretic (including spironolactone)');
  if (m.alphaBlocker) f.push('an alpha-blocker (tamsulosin, doxazosin, alfuzosin, prazosin)');
  if (m.nitrate) f.push('a nitrate');
  if (m.sacubitrilValsartan) f.push('sacubitril/valsartan');
  if (m.centrallyActing) f.push('clonidine, moxonidine or methyldopa');
  if (m.dailyPde5) f.push('daily tadalafil or another PDE5 inhibitor taken daily');
  if (m.sglt2) f.push('an SGLT2 inhibitor');
  if (m.stimulant) f.push('a stimulant (methylphenidate, lisdexamfetamine, dexamfetamine, modafinil)');
  if (m.regularDecongestant) f.push('regular pseudoephedrine or phenylephrine');
  if (m.nonPrescribedStimulant) f.push('non-prescribed stimulant drug use');
  if (m.systemicCorticosteroid) f.push('a systemic corticosteroid');
  return f;
}

export function cautionMedicinesList(m: OMMedicines): string[] {
  const f: string[] = [];
  if (m.dailyNsaid) f.push('a daily NSAID');
  if (m.tricyclic) f.push('a tricyclic antidepressant');
  if (m.phenothiazine) f.push('a phenothiazine');
  if (m.pregabalinGabapentin) f.push('pregabalin or gabapentin');
  return f;
}

// ─── Alerts ───

/** The step each stop originates on. A stop blocks Next from that step onwards. */
export const STOP_ORIGIN_STEP: Record<string, number> = {
  AGE_UNDER_18: STEP.patient,
  AGE_OVER_65: STEP.patient,
  GP_NOT_REGISTERED: STEP.patient,
  GP_NOTIFICATION_DECLINED: STEP.patient,
  OFF_LABEL_NOT_ACCEPTED: STEP.consent,
  LACKS_CAPACITY: STEP.consent,
  PATIENT_DECLINED: STEP.consent,
  // Face to face on the premises is gated by the Consent step validation
  // (the checkbox is required), not by a stop: there is no NOT_FACE_TO_FACE alert.
  ORAL_MINOXIDIL_ELSEWHERE: STEP.history,
  SIX_SUPPLIES: STEP.history,
  PREVIOUS_CV_STOP_NO_REVIEW: STEP.history,
  CV_STOP_REVIEW_NOT_FACE_TO_FACE: STEP.history,
  CV_STOP_NOT_RESOLVED: STEP.history,
  CV_STOP_REVIEW_INCOMPLETE: STEP.history,
  CV_STOP_RETURN_IS_RESTART: STEP.history,
  NON_CV_RETRY_USED: STEP.history,
  // The "since the last visit" checklist and "dizziness or faintness today"
  // sit at the top of the Measurements step, so a cardiovascular stop raised
  // there still lets today's blood pressure, pulse and weight be recorded on
  // the not-supplied record.
  CV_STOP_SYMPTOMS: STEP.measurements,
  CONTRACEPTION_CHANGED: STEP.history,
  NOT_ANDROGENETIC: STEP.diagnosis,
  PULL_TEST: STEP.diagnosis,
  HEAVY_SHEDDING: STEP.diagnosis,
  HEAVY_SHEDDING_PERSISTING: STEP.diagnosis,
  TRIGGER_12_MONTHS: STEP.diagnosis,
  HYPERANDROGENISM: STEP.diagnosis,
  WOMAN_NO_RESULTS: STEP.women,
  FERRITIN_LOW: STEP.women,
  TSH_OUT_OF_RANGE: STEP.women,
  RESULTS_TOO_OLD: STEP.women,
  THYROID_IRON_UNSTABLE: STEP.women,
  PREGNANT: STEP.women,
  BREASTFEEDING: STEP.women,
  PLANNING_PREGNANCY: STEP.women,
  CONTRACEPTION_NOT_ACCEPTED: STEP.women,
  COC_MIGRAINE_AURA_FIRST: STEP.women,
  HYPERSENSITIVITY: STEP.medical,
  HEREDITARY_GALACTOSE: STEP.medical,
  CARDIOVASCULAR_DISEASE: STEP.medical,
  HYPERTENSION_HISTORY: STEP.medical,
  HYPOTENSION_HISTORY: STEP.medical,
  SYNCOPE: STEP.medical,
  PHAEOCHROMOCYTOMA: STEP.medical,
  RENAL_IMPAIRMENT: STEP.medical,
  HEPATIC_IMPAIRMENT: STEP.medical,
  UNTREATED_ANAEMIA: STEP.medical,
  UNSTABLE_THYROID: STEP.medical,
  EATING_DISORDER: STEP.medical,
  PHARMACIST_DOUBT: STEP.medical,
  EXCLUDED_MEDICINE: STEP.medicines,
  ED_VASCULAR_DOUBT: STEP.medicines,
  PHARMACIST_DOUBT_MEDICINES: STEP.medicines,
  BP_HIGH_ON_REPEAT: STEP.measurements,
  BP_LOW: STEP.measurements,
  BP_LOW_WITH_SYMPTOMS: STEP.measurements,
  POSTURAL_FALL: STEP.measurements,
  PULSE_OUT_OF_RANGE: STEP.measurements,
  BMI_LOW: STEP.measurements,
  WEIGHT_GAIN_2KG: STEP.measurements,
  NON_CV_STOP: STEP.supply,
};

export function stopsBlockStep(alerts: ClinicalAlert[], step: number): boolean {
  return alerts.some((a) => a.severity === 'stop' && (STOP_ORIGIN_STEP[a.code] ?? 0) <= step);
}

export function shouldBlockConsultation(alerts: ClinicalAlert[]): boolean {
  return alerts.some((a) => a.severity === 'stop');
}

/** A cardiovascular stop: no further supply under this PGD until a prescriber review. */
export const CV_STOP_CODES: ReadonlySet<string> = new Set([
  'CV_STOP_SYMPTOMS',
  'BP_HIGH_ON_REPEAT',
  'BP_LOW',
  'BP_LOW_WITH_SYMPTOMS',
  'POSTURAL_FALL',
  'PULSE_OUT_OF_RANGE',
  'WEIGHT_GAIN_2KG',
]);

export function isCardiovascularStop(alerts: ClinicalAlert[], history: OMSupplyHistory): boolean {
  if (history.supplyType === 'first' || !history.supplyType) return false;
  return alerts.some((a) => a.severity === 'stop' && CV_STOP_CODES.has(a.code));
}

export function getOralMinoxidilAlerts(
  patient: OMPatientDetails,
  consent: OMConsent,
  history: OMSupplyHistory,
  diagnosis: OMDiagnosis,
  women: OMWomen,
  medical: OMMedicalHistory,
  medicines: OMMedicines,
  measurements: OMMeasurements,
  supply: OMSupply
): ClinicalAlert[] {
  const alerts: ClinicalAlert[] = [];
  const isWoman = patient.sex === 'female';
  const isMan = patient.sex === 'male';
  const isFirst = history.supplyType === 'first';
  const isReview = history.supplyType === 'continuation' || history.supplyType === 'restart';

  // ── Patient ──
  if (patient.age !== null && patient.age >= 0 && patient.age < 18) {
    alerts.push({
      severity: 'stop',
      code: 'AGE_UNDER_18',
      message: 'Under 18 years of age',
      detail: 'Excluded. This PGD is for adults aged 18 to 65: the 2024 consensus reached no agreement on adolescents. Refer to the GP.',
    });
  }
  if (patient.age !== null && patient.age > 65) {
    // Age 18 to 65 applies at every supply. A patient who turns 66 during
    // treatment finishes the supply in hand and is then referred to a
    // prescriber; at the next visit it is a stop. The supply type, supply
    // number and dose of the supply in hand are captured on the Patient step
    // so the not-supplied record carries them.
    const inHand = isReview
      ? ` Supply in hand: ${history.supplyType === 'restart' ? 'restart' : 'continuation'} course, ${history.suppliesSoFar !== null ? `${history.suppliesSoFar} supplies so far (the supply in hand is supply ${history.suppliesSoFar})` : 'supply number not recorded'}, ${history.currentDose ? DOSE_INFO[history.currentDose].label : 'dose not recorded'}.`
      : '';
    alerts.push({
      severity: 'stop',
      code: 'AGE_OVER_65',
      message: 'Over 65 years of age at the time of supply',
      detail: isReview
        ? `Excluded. Aged 18 to 65 applies at every supply: a patient who turns 66 during treatment finishes the supply in hand and is then referred to a prescriber; no further supply under this PGD.${inHand} The SmPC advises a lower starting dose over 65 because of orthostatic hypotension. Refer to a prescriber; offer topical minoxidil 5% (pharmacy medicine).`
        : 'Excluded. This PGD is for adults aged 18 to 65 at every supply: the SmPC advises a lower starting dose over 65 because of orthostatic hypotension. Refer to the GP; offer topical minoxidil 5% (pharmacy medicine).',
    });
  }
  if (patient.gpRegistered === 'no') {
    alerts.push({
      severity: 'stop',
      code: 'GP_NOT_REGISTERED',
      message: 'Not registered with a GP',
      detail: 'Excluded. GP notification within 7 days is a condition of supply. Advise the patient to register with a GP and return.',
    });
  }
  if (patient.gpNotificationAgreed === 'no') {
    alerts.push({
      severity: 'stop',
      code: 'GP_NOTIFICATION_DECLINED',
      message: 'Patient will not allow the GP to be informed',
      detail: 'Excluded. The patient must agree to the GP being informed of the supply, of any dose change and of any stop for a side effect, within 7 days. A patient who will not allow the GP to be told is not supplied.',
    });
  }

  // ── Consent ──
  if (consent.patientDeclined) {
    alerts.push({
      severity: 'stop',
      code: 'PATIENT_DECLINED',
      message: 'Patient declines treatment after counselling',
      detail: 'Record the reason discussed, the alternatives offered (topical minoxidil 5%; for men finasteride under the Male Pattern Hair Loss PGD) and the decision reached.',
    });
  }
  if (consent.acceptsOffLabel === 'no') {
    alerts.push({
      severity: 'stop',
      code: 'OFF_LABEL_NOT_ACCEPTED',
      message: 'Patient does not accept off-label treatment after the explanation',
      detail: 'Excluded. Offer the licensed alternatives: topical minoxidil 5% (pharmacy medicine, men and women) and, for men, finasteride under the Male Pattern Hair Loss PGD. Record which was offered.',
    });
  }
  if (consent.lacksCapacity) {
    alerts.push({
      severity: 'stop',
      code: 'LACKS_CAPACITY',
      message: 'Patient lacks capacity to consent',
      detail: 'Excluded. Valid informed consent, including explicit consent to off-label treatment, is a condition of supply.',
    });
  }

  // ── Supply history ──
  if (history.prefill) {
    const p = history.prefill;
    if (p.previousSupplied && isFirst) {
      alerts.push({
        severity: 'caution',
        code: 'PREVIOUS_RECORD_FIRST_SUPPLY',
        message: `A previous oral minoxidil supply is on record for this patient (${p.consultationDate}, supply ${p.previousSupplyNumber ?? '?'}): "First supply" looks wrong`,
        detail: 'The supply count is by supply number from the first supply and is not reset by a gap or restart. Where the patient has been supplied under this PGD before, select Continuation or Restart so the count, the dose history and the baseline carry forward. If the previous record was in error, say so in the clinical notes.',
      });
    } else if (p.previousWasCvStop && history.previousCvStop !== 'yes') {
      alerts.push({
        severity: 'caution',
        code: 'PREVIOUS_RECORD_CV_STOP',
        message: `The previous record (${p.consultationDate}) was a cardiovascular stop`,
        detail: 'The previous cardiovascular stop was carried forward from that record. If it has been changed here, the reason is recorded. No restart after a cardiovascular stop without the face to face prescriber review.',
      });
    }
  }
  if (history.oralMinoxidilElsewhere) {
    alerts.push({
      severity: 'stop',
      code: 'ORAL_MINOXIDIL_ELSEWHERE',
      message: 'Already taking oral minoxidil from another source',
      detail: 'Excluded. Oral minoxidil is not supplied under this PGD to a patient already taking it from another source.',
    });
  }
  if (isReview) {
    const counted = suppliesCounted(history);
    if (counted !== null && counted >= MAX_SUPPLIES) {
      alerts.push({
        severity: 'stop',
        code: 'SIX_SUPPLIES',
        message: `${counted} supplies under this PGD without a documented prescriber review since`,
        detail: 'Excluded. Before any seventh supply a prescriber (the GP, or where the GP declines a Get Real Health prescriber by face to face or video consultation) reviews the blood pressure, pulse and weight record, the photographs and the side effects, and confirms in writing that treatment may continue. Record the written confirmation with its date on this step; that starts a further period of up to six supplies. The count is by supply number and is not reset by a gap or restart.',
      });
    } else {
      const visit = periodVisitNumber(history);
      if (visit !== null && visit === PRESCRIBER_REVIEW_SOUGHT_SUPPLY_NUMBER) {
        alerts.push({
          severity: 'caution',
          code: 'PRESCRIBER_REVIEW_SOUGHT',
          message: `Supply visit ${visit}: full review with repeat photographs, and the record is sent for the prescriber review`,
          detail: 'This is the sixth supply of the period. Repeat the photographs and the full review and send that record for the prescriber review (the GP, or where the GP declines a Get Real Health prescriber by face to face or video consultation), which must be complete before a seventh supply. Tell the patient to hold their last week of tablets until the review is confirmed; a gap caused only by waiting for that review is not a restart provided they are off tablets for no more than 8 weeks.',
        });
      } else if (visit !== null && REPEAT_PHOTO_SUPPLY_NUMBERS.has(visit)) {
        alerts.push({
          severity: 'caution',
          code: 'FULL_REVIEW_VISIT',
          message: `Supply visit ${visit}: full review with repeat photographs and a response assessment`,
          detail: 'Repeat the photographs in the same way as the baseline and record the response. The once-only dose increase is first available at or after the fourth supply visit where the response is inadequate and the other conditions are met.',
        });
      }
    }
    if (history.previousCvStop === 'yes' && !history.cvStopReviewHeld) {
      alerts.push({
        severity: 'stop',
        code: 'PREVIOUS_CV_STOP_NO_REVIEW',
        message: 'Course stopped for a cardiovascular stop without a prescriber review since',
        detail: 'Excluded. No restart after a cardiovascular stop until a prescriber has reviewed the patient FACE TO FACE (the GP, or a Get Real Health prescriber in person), with examination for oedema and a repeat blood pressure, and confirmed in writing that the symptom has resolved off treatment and that treatment may restart. The pharmacist holds that written confirmation in the record.',
      });
    } else if (history.previousCvStop === 'yes' && history.cvStopReviewHeld) {
      if (history.cvStopReviewType && !FACE_TO_FACE_CV_REVIEW_TYPES.has(history.cvStopReviewType)) {
        alerts.push({
          severity: 'stop',
          code: 'CV_STOP_REVIEW_NOT_FACE_TO_FACE',
          message: 'The prescriber review after the cardiovascular stop was not face to face',
          detail: 'Excluded. Before any restart after a cardiovascular stop the review must be face to face (the GP, or a Get Real Health prescriber in person) with examination for oedema and a repeat blood pressure. A video or telephone review is acceptable only for the routine six-supply review, not after a cardiovascular stop.',
        });
      }
      if (history.cvStopReviewType && FACE_TO_FACE_CV_REVIEW_TYPES.has(history.cvStopReviewType) && !history.cvStopSymptomResolvedConfirmed) {
        alerts.push({
          severity: 'stop',
          code: 'CV_STOP_NOT_RESOLVED',
          message: 'The written confirmation does not say the symptom has resolved off treatment',
          detail: 'Excluded. The written confirmation after a cardiovascular stop must say the symptom has resolved off treatment and that treatment may restart.',
        });
      }
      if (history.cvStopReviewType && FACE_TO_FACE_CV_REVIEW_TYPES.has(history.cvStopReviewType) && !(history.cvStopReviewOedemaExamined && history.cvStopReviewRepeatBp)) {
        alerts.push({
          severity: 'stop',
          code: 'CV_STOP_REVIEW_INCOMPLETE',
          message: `The face to face review did not include ${!history.cvStopReviewOedemaExamined && !history.cvStopReviewRepeatBp ? 'examination for oedema or a repeat blood pressure' : !history.cvStopReviewOedemaExamined ? 'examination for oedema' : 'a repeat blood pressure'}`,
          detail: 'Excluded. Before any restart after a cardiovascular stop the review must be face to face with examination for oedema and a repeat blood pressure. Confirm both from the written confirmation, or refer back to the prescriber.',
        });
      }
      if (history.supplyType === 'continuation' && !alerts.some((a) => a.code === 'CV_STOP_REVIEW_NOT_FACE_TO_FACE' || a.code === 'CV_STOP_NOT_RESOLVED' || a.code === 'CV_STOP_REVIEW_INCOMPLETE')) {
        alerts.push({
          severity: 'stop',
          code: 'CV_STOP_RETURN_IS_RESTART',
          message: 'Returning after a cardiovascular stop: this is a restart at the starting dose, not a continuation',
          detail: 'After a cardiovascular stop the tablets are not resumed until the face to face prescriber review, and the restart is then at the starting dose whatever the dose before the stop and whatever the length of the gap. Select "Restart" as the supply type.',
        });
      }
    }
    if (history.previousNonCvStop === 'yes' && history.nonCvStopRetriedBefore) {
      alerts.push({
        severity: 'stop',
        code: 'NON_CV_RETRY_USED',
        message: 'Starting dose not tolerated and already tried once more: the PGD no longer applies',
        detail: 'Excluded. Where the starting dose is not tolerated the patient may try it once more at a later date, after which the PGD does not apply. Refer to the GP; offer the licensed alternatives.',
      });
    } else if (history.previousNonCvStop === 'yes' && history.supplyType === 'restart') {
      alerts.push({
        severity: 'caution',
        code: 'NON_CV_RETRY',
        message: 'Trying the starting dose once more after a non-cardiovascular stop',
        detail: 'This is the one further try the PGD allows. If the starting dose is not tolerated again, the PGD does not apply to this patient after that.',
      });
    }
    const change = weightChange(history, measurements);
    const symptoms = stopSymptomList(history, measurements, null);
    if (symptoms.length > 0) {
      const urgency = stopSymptomUrgency(history, measurements);
      alerts.push({
        severity: 'stop',
        code: 'CV_STOP_SYMPTOMS',
        message: `Cardiovascular stop: ${symptoms.join(', ')}`,
        detail: `Stop and refer: ${urgency === 'same-day' ? 'the same day (chest pain, breathlessness, palpitations, fainting or facial swelling)' : 'routine GP within a week'}. Dose reduction is not an option for these symptoms. No further supply under this PGD until a prescriber has reviewed the patient and confirmed in writing that treatment may restart. Record today's blood pressure, pulse and weight on the Measurements step so the record carries them. Give the stop-and-seek-help advice in writing. Report every cardiovascular adverse event via Yellow Card.`,
      });
    }
    if (change !== null && change >= 2 && !history.sxWeightGainReported) {
      alerts.push({
        severity: 'stop',
        code: 'WEIGHT_GAIN_2KG',
        message: `Weight gain of ${change} kg since the previous supply`,
        detail: 'Cardiovascular stop: a weight gain of 2 kg or more since the previous supply. Stop, refer to the GP within a week, no dose reduction, and no further supply until a prescriber review confirms in writing that treatment may restart.',
      });
    }
    if (isWoman && history.contraceptionChanged && !history.contraceptionReplacementConfirmed) {
      alerts.push({
        severity: 'stop',
        code: 'CONTRACEPTION_CHANGED',
        message: 'Contraceptive method stopped or changed without a replacement confirmed',
        detail: 'If her method is stopped or changed she must confirm the replacement method before the next supply. Record the replacement method on the Women step and tick that it is confirmed.',
      });
    }
    if (history.supplyType === 'restart') {
      alerts.push({
        severity: 'caution',
        code: 'RESTART',
        message: history.previousCvStop === 'yes' ? 'Restart after a cardiovascular stop: restart inclusion criteria apply' : 'Restart after a gap of more than 4 weeks: restart inclusion criteria apply',
        detail: `Re-examine the scalp and repeat the pull test as at a first supply (heavy diffuse shedding and 6 or more hairs on the pull test are exclusions, as at a first supply), re-take the medicines and cardiovascular history, record a NEW baseline blood pressure today (today's lower seated systolic becomes the baseline for the 10 mmHg rule), and supply the starting dose (${startingDose(patient.sex) ? DOSE_INFO[startingDose(patient.sex) as Exclude<Dose, ''>].label : 'per sex'}) whatever the dose before. The weight and symptom comparison starts afresh from today's values: the 2 kg rule and the "since the last visit" checklist do not apply today, and today's weight becomes the new previous weight. The supply count continues from where it was.${increaseUsed(patient.sex, history) ? ' The patient has already used the dose increase: they may resume the higher dose at or after the fourth supply visit following this restart if the conditions are met, but nobody has two increases.' : ''}`,
      });
    }
    if (history.supplyType === 'continuation' && history.gapAwaitingReview && gapIsRestart(history) === false && (gapDays(history) ?? 0) > RESTART_GAP_DAYS) {
      alerts.push({
        severity: 'caution',
        code: 'GAP_AWAITING_REVIEW',
        message: `${gapDays(history)} days without tablets while awaiting the prescriber review after supply 6: not a restart`,
        detail: 'A gap caused only by waiting for the prescriber review after supply 6 is not a restart provided the patient has been off tablets for no more than 8 weeks. Continue at the recorded dose.',
      });
    }
  }

  // ── Diagnosis ──
  const features = nonAndrogeneticFeatures(diagnosis, patient.sex);
  if (features.length > 0) {
    alerts.push({
      severity: 'stop',
      code: 'NOT_ANDROGENETIC',
      message: `Hair loss not clearly androgenetic: ${features.join(', ')}`,
      detail: 'Excluded. Refer to the GP for diagnosis rather than offering any treatment: alopecia areata, telogen effluvium, scarring alopecia including frontal fibrosing alopecia, tinea capitis and traction alopecia need a diagnosis first (Appendix 2).',
    });
  }
  const isRestartSupply = history.supplyType === 'restart';
  const pullTestApplies = isFirst || isRestartSupply;
  if (pullTestApplies && diagnosis.pullTestCount !== null && diagnosis.pullTestCount >= 6) {
    alerts.push({
      severity: 'stop',
      code: 'PULL_TEST',
      message: `Pull test: ${diagnosis.pullTestCount} hairs released`,
      detail: `Excluded at ${isFirst ? 'the first supply' : 'a restart (the pull test is repeated as at a first supply)'}: 6 or more hairs released by a gentle pull on a bundle of about 50 to 60 hairs suggests active shedding (telogen effluvium). Refer to the GP.`,
    });
  } else if (history.supplyType === 'continuation' && diagnosis.pullTestCount !== null && diagnosis.pullTestCount >= 6) {
    alerts.push({
      severity: 'caution',
      code: 'PULL_TEST_REVIEW',
      message: `Pull test at review: ${diagnosis.pullTestCount} hairs released`,
      detail: 'The pull test limit of 6 hairs is an exclusion at the first supply and at a restart, not at a review. Shedding in the first 4 to 8 weeks of treatment, settling by 12 weeks, is expected; heavy shedding persisting beyond 12 weeks of treatment is a stop (record it below). Use clinical judgement and document the finding.',
    });
  }
  if ((isFirst || isRestartSupply) && diagnosis.heavyDiffuseShedding) {
    alerts.push({
      severity: 'stop',
      code: 'HEAVY_SHEDDING',
      message: 'Heavy diffuse shedding',
      detail: `Excluded at ${isFirst ? 'the first supply' : 'a restart (the scalp assessment is repeated as at a first supply)'}. Diffuse shedding all over the scalp suggests telogen effluvium: refer to the GP to find the cause.`,
    });
  } else if (isReview && diagnosis.heavyDiffuseShedding && diagnosis.sheddingBeyond12Weeks) {
    alerts.push({
      severity: 'stop',
      code: 'HEAVY_SHEDDING_PERSISTING',
      message: `Heavy shedding persisting beyond ${SHEDDING_SETTLES_BY_WEEKS} weeks of treatment`,
      detail: 'Stop and refer to the GP for diagnosis. Shedding in the first 4 to 8 weeks, settling by 12 weeks, is expected; heavy shedding that persists beyond 12 weeks of treatment is not, and needs the cause found. This is not a cardiovascular stop.',
    });
  } else if (isReview && diagnosis.heavyDiffuseShedding) {
    const weeks = approxWeeksOnTreatment(history);
    alerts.push({
      severity: 'caution',
      code: 'SHEDDING_ON_TREATMENT',
      message: 'Shedding reported at review',
      detail: `Shedding in the first 4 to 8 weeks of treatment, settling by 12 weeks, is expected and is not a reason to stop. Heavy shedding persisting beyond 12 weeks of treatment is a stop: refer for diagnosis.${weeks !== null ? ` A patient attending on time has completed about ${weeks} weeks of treatment${history.restartedBefore || history.supplyType === 'restart' ? ' since the restart' : ''}.` : ''} Record on the Diagnosis step whether the shedding has persisted beyond 12 weeks.`,
    });
  }
  if (diagnosis.trigger12Months) {
    alerts.push({
      severity: 'stop',
      code: 'TRIGGER_12_MONTHS',
      message: 'Hair loss began or worsened within 12 months of childbirth, serious illness, major surgery, rapid weight loss or a new medicine',
      detail: 'Excluded. This pattern suggests telogen effluvium, which usually recovers and needs the cause found. Refer to the GP.',
    });
  }
  if (isWoman) {
    const ha = hyperandrogenismFeatures(diagnosis);
    if (ha.length > 0) {
      alerts.push({
        severity: 'stop',
        code: 'HYPERANDROGENISM',
        message: `Signs of hyperandrogenism: ${ha.join(', ')}`,
        detail: 'Excluded. Hair loss with hirsutism, new acne, irregular periods, a deepening voice or polycystic ovary syndrome needs assessment, and the hypertrichosis of minoxidil is a particular problem for these women. Refer to the GP.',
      });
    }
  }

  // ── Women: blood tests and pregnancy ──
  if (isWoman) {
    if (women.resultsAvailable === 'no') {
      alerts.push({
        severity: 'stop',
        code: 'WOMAN_NO_RESULTS',
        message: 'No ferritin and thyroid results from the last 12 months',
        detail: 'Not supplied today. Advise her to ask her GP for the tests or to arrange a private test, and to return with the results (NHS App, GP letter or laboratory report).',
      });
    }
    if (women.resultsAvailable === 'yes') {
      if (women.ferritinValue !== null && women.ferritinValue < 30) {
        alerts.push({
          severity: 'stop',
          code: 'FERRITIN_LOW',
          message: `Ferritin ${women.ferritinValue} micrograms/L (below 30)`,
          detail: 'Excluded. Iron deficiency causes diffuse hair loss that looks like the female pattern and is treated differently. Refer to the GP for treatment first.',
        });
      }
      if (women.tshWithinRange === 'no') {
        alerts.push({
          severity: 'stop',
          code: 'TSH_OUT_OF_RANGE',
          message: 'Thyroid stimulating hormone outside the laboratory reference range',
          detail: 'Excluded. Thyroid disease causes diffuse hair loss that looks like the female pattern. Refer to the GP.',
        });
      }
      if (withinLastCalendarMonths(women.ferritinDate, 12) === false || withinLastCalendarMonths(women.tshDate, 12) === false) {
        alerts.push({
          severity: 'stop',
          code: 'RESULTS_TOO_OLD',
          message: 'Ferritin or thyroid result older than 12 months',
          detail: 'Excluded. Both results must be from the last 12 calendar months. Advise her to ask her GP or arrange a private test and return with the results.',
        });
      }
    }
    if (women.thyroidOrIronUnstable) {
      alerts.push({
        severity: 'stop',
        code: 'THYROID_IRON_UNSTABLE',
        message: 'Thyroid or iron problem under investigation or not yet stable on treatment',
        detail: 'Excluded. Refer to the GP; she may return once the problem is stable.',
      });
    }
    if (women.pregnant === 'yes') {
      alerts.push({
        severity: 'stop',
        code: 'PREGNANT',
        message: 'Pregnant',
        detail: 'Excluded. Minoxidil is not recommended in pregnancy; neonatal hypertrichosis has been reported after exposure.',
      });
    }
    if (women.breastfeeding) {
      alerts.push({
        severity: 'stop',
        code: 'BREASTFEEDING',
        message: 'Breastfeeding',
        detail: 'Excluded. Minoxidil is excreted in milk.',
      });
    }
    if (women.planningPregnancy) {
      alerts.push({
        severity: 'stop',
        code: 'PLANNING_PREGNANCY',
        message: 'Planning a pregnancy within the treatment period',
        detail: 'Excluded. Women must not become pregnant while taking minoxidil and must stop before trying to conceive.',
      });
    }
    if (women.childbearingPotential === 'yes' && women.contraceptionMethod && !ACCEPTED_CONTRACEPTION.has(women.contraceptionMethod)) {
      alerts.push({
        severity: 'stop',
        code: 'CONTRACEPTION_NOT_ACCEPTED',
        message:
          women.contraceptionMethod === 'none'
            ? 'Woman of childbearing potential not using contraception'
            : 'Fertility awareness or withdrawal alone is not an accepted method',
        detail: 'Excluded. Accepted methods: any hormonal method, an intrauterine device or system, sterilisation or a vasectomised partner, or consistent condom use where she declines another method. Signpost to the GP or sexual health service.',
      });
    }
    if (cocMigraineAuraApplies(women, medical)) {
      const auto = !women.cocWithMigraineAura ? ' (triggered automatically: combined hormonal contraception recorded as the method and migraine with aura recorded on the Medical step)' : '';
      if (isFirst && !women.cocPrescriberReviewed) {
        alerts.push({
          severity: 'stop',
          code: 'COC_MIGRAINE_AURA_FIRST',
          message: `Combined hormonal contraception with migraine with aura at a first supply${auto}`,
          detail: 'Not supplied today. The suitability of her contraceptive method is her prescriber\'s responsibility, but where something obvious is wrong do not make a first supply until her prescriber has reviewed the method and she attends with the outcome. Advise her to see her GP or sexual health service about the method and to return with the outcome.',
        });
      } else if (isFirst) {
        alerts.push({
          severity: 'caution',
          code: 'COC_MIGRAINE_AURA_REVIEWED',
          message: 'Combined hormonal contraception with migraine with aura: prescriber has reviewed the method',
          detail: `She attends with the outcome of her prescriber's review${women.cocReviewOutcome.trim() ? `: ${women.cocReviewOutcome.trim()}` : ''}. Record the contraceptive method she is now using; without contraception she is not supplied.`,
        });
      } else {
        alerts.push({
          severity: 'caution',
          code: 'COC_MIGRAINE_AURA',
          message: `Combined hormonal contraception with migraine with aura at a continuation visit${auto}`,
          detail: 'Supply may continue on her existing method provided she is seen about it within 4 weeks and the pharmacist records the referral (tick it on the Women step). If her method is stopped or changed she must tell the pharmacy and confirm the replacement method before she continues minoxidil; without contraception she stops minoxidil.',
        });
      }
    }
  }

  // ── Cardiovascular and medical history ──
  if (medical.hypersensitivity) {
    alerts.push({
      severity: 'stop',
      code: 'HYPERSENSITIVITY',
      message: 'Hypersensitivity to minoxidil (oral or topical) or any excipient',
      detail: 'Excluded. Excipients: lactose monohydrate, microcrystalline cellulose, starch, colloidal silicon dioxide, magnesium stearate.',
    });
  }
  if (medical.hereditaryGalactose) {
    alerts.push({
      severity: 'stop',
      code: 'HEREDITARY_GALACTOSE',
      message: 'Rare hereditary galactose intolerance, total lactase deficiency or glucose-galactose malabsorption',
      detail: 'Excluded. Each tablet contains 95.8 mg lactose monohydrate. Ordinary lactose intolerance is not relevant at this quantity.',
    });
  }
  const cvd = cardiovascularDiseaseList(medical);
  if (cvd.length > 0) {
    alerts.push({
      severity: 'stop',
      code: 'CARDIOVASCULAR_DISEASE',
      message: `Cardiovascular disease: ${cvd.join('; ')}`,
      detail: 'Excluded. Any cardiovascular disease is an exclusion: the SmPC warns of salt and water retention, tachycardia, pericarditis and pericardial effusion. Refer to the GP; offer topical minoxidil 5%.',
    });
  }
  if (medical.hypertension) {
    alerts.push({
      severity: 'stop',
      code: 'HYPERTENSION_HISTORY',
      message: 'Hypertension, whether treated, untreated or managed by lifestyle',
      detail: 'Excluded. Minoxidil is an antihypertensive; use for hair loss is only in people screened to have a normal blood pressure. Refer to the GP.',
    });
  }
  if (medical.hypotensionOrOrthostatic) {
    alerts.push({
      severity: 'stop',
      code: 'HYPOTENSION_HISTORY',
      message: 'Hypotension or orthostatic intolerance',
      detail: 'Excluded. The SmPC warns of orthostatic hypotension and excessive hypotension.',
    });
  }
  if (medical.unexplainedSyncope || medical.syncopeLast12Months) {
    alerts.push({
      severity: 'stop',
      code: 'SYNCOPE',
      message: medical.unexplainedSyncope ? 'Unexplained syncope at any time' : 'Syncope in the last 12 months',
      detail: 'Excluded. Unexplained syncope at any time, or any syncope in the last 12 months, is an exclusion. Refer to the GP.',
    });
  }
  if (medical.phaeochromocytoma) {
    alerts.push({
      severity: 'stop',
      code: 'PHAEOCHROMOCYTOMA',
      message: 'Phaeochromocytoma',
      detail: 'Excluded. A contraindication in the SmPC and the consensus.',
    });
  }
  if (medical.renalImpairment) {
    alerts.push({
      severity: 'stop',
      code: 'RENAL_IMPAIRMENT',
      message: 'Renal impairment (eGFR below 60, CKD stage 3 or worse, or dialysis)',
      detail: 'Excluded. The SmPC requires attention to salt and water balance in renal impairment.',
    });
  }
  if (medical.hepaticImpairment) {
    alerts.push({
      severity: 'stop',
      code: 'HEPATIC_IMPAIRMENT',
      message: 'Hepatic impairment',
      detail: 'Excluded. The SmPC has no data in hepatic impairment.',
    });
  }
  if (medical.untreatedAnaemia) {
    alerts.push({
      severity: 'stop',
      code: 'UNTREATED_ANAEMIA',
      message: 'Known anaemia not yet treated',
      detail: 'Excluded. Refer to the GP for treatment first.',
    });
  }
  if (medical.unstableThyroid) {
    alerts.push({
      severity: 'stop',
      code: 'UNSTABLE_THYROID',
      message: 'Thyroid disease not stable on treatment',
      detail: 'Excluded. Stable treated hypothyroidism is not an exclusion; unstable thyroid disease is. Refer to the GP.',
    });
  }
  if (medical.eatingDisorder) {
    alerts.push({
      severity: 'stop',
      code: 'EATING_DISORDER',
      message: 'Eating disorder',
      detail: 'Excluded. Refer to the GP.',
    });
  }
  if (medical.pharmacistDoubt) {
    alerts.push({
      severity: 'stop',
      code: 'PHARMACIST_DOUBT',
      message: `Pharmacist has clinical doubt about suitability${medical.pharmacistDoubtReason.trim() ? `: ${medical.pharmacistDoubtReason.trim()}` : ''}`,
      detail: 'Not supplied: refer where in doubt. The pharmacist may decline to supply under this PGD for any clinical reason; record the reason, the advice given and the referral. Offer topical minoxidil 5%.',
    });
  }

  // ── Medicines ──
  const excluded = excludedMedicinesList(medicines);
  if (excluded.length > 0) {
    alerts.push({
      severity: 'stop',
      code: 'EXCLUDED_MEDICINE',
      message: `Excluded medicine: ${excluded.join('; ')}`,
      detail: 'Excluded, for any indication. The effect on blood pressure or heart rate is additive and the SmPC warns of excessive hypotension; a systemic corticosteroid adds salt and water retention. Refer to the GP; offer topical minoxidil 5%.',
    });
  }
  if (medicines.pde5OnDemand) {
    alerts.push({
      severity: 'caution',
      code: 'PDE5_ON_DEMAND',
      message: 'PDE5 inhibitor taken on demand',
      detail: 'The blood pressure lowering effects add together and minoxidil\'s effect lasts for days, so there is no safe interval to advise. Tell the patient that light-headedness after the combination is possible, to sit or lie down if it happens, and not to take a second PDE5 dose that day. Daily tadalafil is an exclusion.',
    });
    if (isMan && patient.age !== null && patient.age < 40) {
      if (medicines.edVascularDoubt) {
        alerts.push({
          severity: 'stop',
          code: 'ED_VASCULAR_DOUBT',
          message: 'Erectile dysfunction under 40 with doubt about vascular disease',
          detail: 'Erectile dysfunction in a man under 40 can be an early sign of vascular disease. Where there is any doubt after asking about exercise tolerance and chest symptoms, refer before supplying.',
        });
      } else {
        alerts.push({
          severity: 'caution',
          code: 'ED_UNDER_40',
          message: 'Erectile dysfunction treatment in a man under 40',
          detail: 'Can be an early sign of vascular disease: ask about exercise tolerance and chest symptoms and, where there is any doubt, refer before supplying.',
        });
      }
    }
  }
  const cautionMeds = cautionMedicinesList(medicines);
  if (cautionMeds.length > 0) {
    if (medicines.cautionSatisfied === 'no') {
      alerts.push({
        severity: 'stop',
        code: 'PHARMACIST_DOUBT_MEDICINES',
        message: `Pharmacist not satisfied to supply alongside ${cautionMeds.join(', ')}`,
        detail: 'Not supplied: refer where in doubt. The medicine can lower blood pressure or cause fluid retention; the pharmacist has considered blood pressure and fluid retention and is not satisfied that supply is appropriate. Record the reason, the advice given and the referral. Offer topical minoxidil 5%.',
      });
    } else {
      alerts.push({
        severity: 'caution',
        code: 'CAUTION_MEDICINES',
        message: `Medicine that can lower blood pressure or cause fluid retention: ${cautionMeds.join(', ')}`,
        detail: `Not in the exclusion list. Measure the blood pressure with that in mind, warn about dizziness and swelling, and refer where in doubt.${medicines.cautionSatisfied === 'yes' ? ' The pharmacist has recorded that they are satisfied to supply after considering blood pressure and fluid retention.' : ' Record on the Medicines step whether the pharmacist is satisfied to supply.'}`,
      });
    }
  }
  if (medicines.weightLossTreatment) {
    alerts.push({
      severity: 'caution',
      code: 'WEIGHT_LOSS_TREATMENT',
      message: 'Weight loss treatment (GLP-1 agonist, orlistat or dieting)',
      detail: 'Not an exclusion, but ongoing weight loss can mask the 2 kg fluid retention trigger. Ask specifically about ankle swelling, tight shoes or rings and breathlessness at every supply, and treat new swelling as a cardiovascular stop whatever the scales say.',
    });
  }

  // ── Measurements ──
  const lower = lowerSeated(measurements);
  const repeat = repeatReading(measurements);
  const effective = effectiveSeated(measurements);
  const dizzy = measurements.dizzinessOrFaintness;
  // The one return visit: a patient outside the limits on repeat at a first
  // visit may return once on another day; outside the limits again, refer.
  const returnVisitNote = isFirst
    ? measurements.returnVisitForBp === 'yes' || history.returnVisitUsedBefore
      ? ' This is the one permitted return visit and the reading is outside the limits again: refer to the GP and do not supply.'
      : ' A patient outside the limits on repeat at a first visit may return once on another day; outside the limits again, refer to the GP.'
    : '';
  if (lower && isHigh(lower) && repeat && isHigh(repeat)) {
    const severe = isSevere(repeat) || isSevere(lower);
    alerts.push({
      severity: 'stop',
      code: 'BP_HIGH_ON_REPEAT',
      message: `Blood pressure ${repeat.systolic}/${repeat.diastolic} mmHg on repeat (140 systolic or 90 diastolic or more)`,
      detail: isFirst
        ? `Not supplied.${returnVisitNote} Refer to the GP for blood pressure assessment${severe ? '. 180/120 or above: advise assessment the same day' : ' (routinely for 140/90 to 179/119)'}. Say so plainly and advise the patient to have it assessed whatever they decide about hair loss.`
        : `Cardiovascular stop at a continuation visit. Stop and refer to the GP${severe ? ' the same day (180 systolic or 120 diastolic or above)' : ' within a week'}; no dose reduction and no further supply until a prescriber review confirms in writing that treatment may restart.`,
    });
  } else if (lower && isHigh(lower) && !repeat) {
    alerts.push({
      severity: 'caution',
      code: 'BP_HIGH_NEEDS_REPEAT',
      message: `Lower seated reading ${lower.systolic}/${lower.diastolic} mmHg is at or above 140/90: take a third reading after a further 5 minutes seated`,
      detail: 'The limit applies on the lower of two seated readings and again on a third reading after a further 5 minutes seated ("on repeat"). Record the third reading below.',
    });
  } else if (lower && isHigh(lower) && repeat && !isHigh(repeat)) {
    alerts.push({
      severity: 'caution',
      code: 'BP_WITHIN_ON_REPEAT',
      message: `Lower seated reading ${lower.systolic}/${lower.diastolic} was above the limit; the repeat reading ${repeat.systolic}/${repeat.diastolic} is within it`,
      detail: 'The repeat reading is the one recorded against the limits. Both readings and the repeat are printed on the record.',
    });
  }
  // Hypotension: the same repeat and the same one return visit as hypertension.
  const lowerLow = !!lower && (isLow(lower) || (isBorderlineLow(lower) && dizzy));
  const repeatLow = !!repeat && (isLow(repeat) || (isBorderlineLow(repeat) && dizzy));
  if (lowerLow && repeatLow && repeat) {
    const below90 = isLow(repeat);
    alerts.push({
      severity: 'stop',
      code: below90 ? 'BP_LOW' : 'BP_LOW_WITH_SYMPTOMS',
      message: below90
        ? `Systolic ${repeat.systolic} mmHg on repeat (below 90)`
        : `Systolic ${repeat.systolic} mmHg on repeat with dizziness or faintness (90 to 99 is acceptable only without symptoms)`,
      detail: isFirst
        ? `Not supplied: hypotension on repeat.${returnVisitNote} Refer to the GP.`
        : 'Cardiovascular stop: blood pressure outside the limits on repeat. Stop, refer to the GP within a week, no dose reduction, and no further supply until a prescriber review.',
    });
  } else if (lowerLow && !repeat) {
    alerts.push({
      severity: 'caution',
      code: 'BP_LOW_NEEDS_REPEAT',
      message: lower && isLow(lower)
        ? `Lower seated systolic ${lower.systolic} mmHg is below 90: take a third reading after a further 5 minutes seated`
        : `Lower seated systolic ${lower?.systolic} mmHg (90 to 99) with dizziness or faintness: take a third reading after a further 5 minutes seated`,
      detail: 'The hypotension limits apply on repeat, like the hypertension limits. Record the third reading below.',
    });
  } else if (lowerLow && repeat && !repeatLow) {
    alerts.push({
      severity: 'caution',
      code: 'BP_WITHIN_ON_REPEAT_LOW',
      message: `Lower seated reading ${lower?.systolic}/${lower?.diastolic} was below the limit; the repeat reading ${repeat.systolic}/${repeat.diastolic} is within it`,
      detail: 'The repeat reading is the one recorded against the limits. Both readings and the repeat are printed on the record.',
    });
  } else if (effective && isBorderlineLow(effective) && !dizzy) {
    alerts.push({
      severity: 'caution',
      code: 'BP_90_99',
      message: `Systolic ${effective.systolic} mmHg (90 to 99)`,
      detail: 'Acceptable only where the patient has no dizziness or faintness. Confirm and record on the Measurements step.',
    });
  }
  // Dizziness or faintness today at a first supply or a restart is not a
  // cardiovascular stop in itself (that applies at a continuation): the
  // hypotension rule decides (90 to 99 with dizziness is a stop on repeat).
  // Where the systolic is 100 or more it stands as a caution for judgement.
  if ((isFirst || history.supplyType === 'restart') && dizzy && effective && !isLow(effective) && !isBorderlineLow(effective)) {
    alerts.push({
      severity: 'caution',
      code: 'DIZZINESS_TODAY',
      message: `Dizziness or faintness today with a systolic of ${effective.systolic} mmHg`,
      detail: `${isFirst ? 'At a first supply' : 'At a restart'} dizziness or faintness today is not a cardiovascular stop in itself: the hypotension rule applies (systolic 90 to 99 with dizziness or faintness is a stop on repeat; below 90 is a stop on repeat). The systolic is 100 or more, so this is a caution: consider the cause (postural fall, medicines, illness) and refer where in doubt.`,
    });
  }
  // A voluntary third reading (the lower seated reading was within the
  // limits, so none was required) that is itself outside the limits: the
  // document's "on repeat" rule does not make it a stop, but it should not
  // pass without comment.
  if (lower && repeat && !isHigh(lower) && !lowerLow && (isHigh(repeat) || isLow(repeat) || (isBorderlineLow(repeat) && dizzy))) {
    alerts.push({
      severity: 'caution',
      code: 'BP_REPEAT_OUTSIDE_VOLUNTARY',
      message: `The lower seated reading ${lower.systolic}/${lower.diastolic} was within the limits but the repeat reading ${repeat.systolic}/${repeat.diastolic} is outside them`,
      detail: 'The repeat reading is the one applied to the limits and the higher-dose conditions. A third reading was not required here, so this is not a reading "outside the limits on repeat" under the PGD; take a further seated reading after 5 minutes if in doubt, use clinical judgement, and record the decision. Where the patient has symptoms, treat as hypotension.',
    });
  }
  const fall = posturalFall(measurements);
  const fallOutside = !!fall && (fall.systolic >= 20 || fall.diastolic >= 10);
  if (fallOutside || (standingReading(measurements) && measurements.standingSymptoms)) {
    alerts.push({
      severity: 'stop',
      code: 'POSTURAL_FALL',
      message: fallOutside && fall
        ? `Fall of ${fall.systolic} mmHg systolic and ${fall.diastolic} mmHg diastolic on standing (limit: 20 systolic or 10 diastolic)`
        : 'Symptoms on standing',
      detail: isFirst
        ? `Not supplied: a fall of 20 mmHg or more in systolic OR 10 mmHg or more in diastolic on standing, or symptoms on standing, is hypotension.${returnVisitNote} Refer to the GP.`
        : 'Cardiovascular stop: a fall of 20 mmHg or more in systolic or 10 mmHg or more in diastolic on standing, or symptoms on standing. Stop, refer to the GP within a week, no dose reduction, and no further supply until a prescriber review.',
    });
  }
  const pulse = effectivePulse(measurements);
  if (pulse !== null && (pulse < 50 || pulse > 100)) {
    if (measurements.pulseRepeatTaken && measurements.pulseRepeat !== null) {
      alerts.push({
        severity: 'stop',
        code: 'PULSE_OUT_OF_RANGE',
        message: `Resting pulse ${pulse} on repeat (outside 50 to 100)`,
        detail: isFirst
          ? `Not supplied.${returnVisitNote} Refer to the GP.`
          : 'Cardiovascular stop: pulse outside the limits on repeat. Stop, refer, and no further supply until a prescriber review.',
      });
    } else {
      alerts.push({
        severity: 'caution',
        code: 'PULSE_NEEDS_REPEAT',
        message: `Resting pulse ${pulse} (outside 50 to 100): repeat after a further 5 minutes seated`,
        detail: 'The pulse limit applies on repeat. Record the repeat pulse below.',
      });
    }
  }
  const b = bmi(measurements);
  if (isFirst && b !== null && b < 18.5) {
    alerts.push({
      severity: 'stop',
      code: 'BMI_LOW',
      message: `Body mass index ${b} (below 18.5)`,
      detail: 'Excluded at the first supply. Refer to the GP.',
    });
  }
  if (effective && isSevere(effective)) {
    alerts.push({
      severity: 'caution',
      code: 'BP_SEVERE',
      message: `Blood pressure ${effective.systolic}/${effective.diastolic} mmHg: 180/120 or above`,
      detail: 'Advise the patient to have the blood pressure assessed by their GP the same day, whatever they decide about hair loss; the same day also for chest pain, breathlessness, headache with visual change or confusion.',
    });
  }

  // ── Dose decision ──
  if (history.supplyType === 'continuation' && supply.doseDecision === 'stop-non-cv') {
    const secondTime = history.previousNonCvStop === 'yes';
    alerts.push({
      severity: 'stop',
      code: 'NON_CV_STOP',
      message: secondTime
        ? 'Starting dose not tolerated on the one further try: the PGD no longer applies'
        : 'Starting dose not tolerated: stopped for a non-cardiovascular side effect',
      detail: secondTime
        ? 'Not supplied. This is not a cardiovascular stop, but the patient has now tried the starting dose once more after a previous non-cardiovascular stop, after which the PGD does not apply. Refer to the GP; offer the licensed alternatives. Inform the GP within 7 days of the stop.'
        : 'Not supplied. This is not a cardiovascular stop: the patient may try the starting dose once more at a later date if they wish, without a prescriber review, after which the PGD does not apply. Record the stop so that a later restart is counted as that one further try. Inform the GP within 7 days of the stop.',
    });
  }

  return alerts;
}
