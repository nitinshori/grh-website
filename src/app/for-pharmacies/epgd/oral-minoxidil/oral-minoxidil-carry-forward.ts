import type { Dose, OMPrefill, OMSupplyHistory, PrefillableField, Sex, SupplyType } from './oral-minoxidil-types';
import { DOSE_INFO, SUPPLY_DAYS } from './oral-minoxidil-types';
import { addDays, dosesForSex, formatLocalDate, maximumDose, parseLocalDate } from './oral-minoxidil-clinical-logic';

// ─────────────────────────────────────────────────────────────────────────
// Carry-forward from the patient's previous oral minoxidil record.
//
// The same returning-patient mechanism the weight tools use: the pharmacist
// picks the patient from the search box on the Patient step (or the name and
// date of birth are typed), the tool looks up the most recent record under
// this PGD for that patient at this pharmacy, and the course history is
// prefilled from it. Prefilled values are shown read-only; each may be
// changed only with a reason, and the record stores what was prefilled, from
// which record, and every override with its reason.
//
// The weight tools go through /api/dashboard/previous-consultation, which is
// restricted to the weight management slugs and distils only height, weight
// and dose. This tool needs the whole course history, so it uses the
// consultation-records API directly: the list endpoint filtered by pgd slug
// and patient (name and date of birth, as the weight hook does), then the
// audited detail endpoint for that record's clinicalData.
// ─────────────────────────────────────────────────────────────────────────

export const ORAL_MINOXIDIL_SLUG = 'oral-minoxidil';

type Json = Record<string, unknown>;

const asRecord = (v: unknown): Json | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null);

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function bool(v: unknown): boolean {
  return v === true;
}

export interface PreviousOralMinoxidilRecord {
  recordId: string;
  /** YYYY-MM-DD */
  consultationDate: string;
  outcome: string;
  clinical: Json;
}

interface ListRow {
  id: string;
  pgdSlug: string;
  patientFirstName: string;
  patientLastName: string;
  patientDob: string;
  outcome: string;
  consultationDate: string | null;
  createdAt: string | null;
}

function isoDay(v: string | null | undefined): string {
  if (!v) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
  return m ? m[1] : '';
}

/**
 * The most recent oral minoxidil record for this patient at this pharmacy,
 * with its clinical data, or null where there is none (or the lookup fails:
 * carry-forward is a convenience and a safeguard, never a blocker).
 */
export async function fetchPreviousOralMinoxidilRecord(patient: { firstName: string; lastName: string; dateOfBirth: string }): Promise<PreviousOralMinoxidilRecord | null> {
  const firstName = patient.firstName.trim().toLowerCase();
  const lastName = patient.lastName.trim().toLowerCase();
  const dob = patient.dateOfBirth.trim();
  if (!firstName || !lastName || !dob) return null;
  try {
    const qs = new URLSearchParams({ pgdSlug: ORAL_MINOXIDIL_SLUG, search: patient.lastName.trim(), limit: '50' });
    const res = await fetch(`/api/consultation-records?${qs}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { records?: ListRow[] };
    const rows = (data.records ?? []).filter(
      (r) =>
        r.pgdSlug === ORAL_MINOXIDIL_SLUG &&
        str(r.patientFirstName).trim().toLowerCase() === firstName &&
        str(r.patientLastName).trim().toLowerCase() === lastName &&
        isoDay(r.patientDob) === isoDay(dob)
    );
    if (rows.length === 0) return null;
    rows.sort((a, b) => {
      const da = `${isoDay(a.consultationDate)}T${a.createdAt ?? ''}`;
      const db = `${isoDay(b.consultationDate)}T${b.createdAt ?? ''}`;
      return db.localeCompare(da);
    });
    const newest = rows[0];
    const detail = await fetch(`/api/consultation-records/${newest.id}`, { cache: 'no-store' });
    if (!detail.ok) return null;
    const body = (await detail.json()) as { record?: { clinicalData?: unknown; consultationDate?: string | null; outcome?: string } };
    let clinical: unknown = body.record?.clinicalData;
    if (typeof clinical === 'string') {
      try {
        clinical = JSON.parse(clinical);
      } catch {
        clinical = null;
      }
    }
    const rec = asRecord(clinical);
    if (!rec) return null;
    return {
      recordId: newest.id,
      consultationDate: isoDay(newest.consultationDate) || isoDay(body.record?.consultationDate) || '',
      outcome: newest.outcome || body.record?.outcome || '',
      clinical: rec,
    };
  } catch {
    return null;
  }
}

/** The prefill and the history values derived from the previous record. */
export interface DerivedPrefill {
  prefill: OMPrefill;
  values: Partial<OMSupplyHistory>;
}

/**
 * Distil the previous record into the course history for today. The tool
 * stores its whole state, so the previous history, measurements, supply and
 * the derived fields (supplyNumber, dose, doseIncrease, restart,
 * cardiovascularStop, bloodPressure.baselineSystolic) are all available.
 */
export function derivePrefill(prev: PreviousOralMinoxidilRecord, sex: Sex): DerivedPrefill {
  const c = prev.clinical;
  const ph = asRecord(c.history) ?? {};
  const pm = asRecord(c.measurements) ?? {};
  const ps = asRecord(c.supply) ?? {};
  const pbp = asRecord(c.bloodPressure) ?? {};
  const pinc = asRecord(c.doseIncrease) ?? {};
  const prestart = asRecord(c.restart) ?? {};
  const alerts = Array.isArray(c.clinicalAlerts) ? (c.clinicalAlerts as unknown[]) : [];
  const alertCodes = new Set(alerts.map((a) => str(asRecord(a)?.code)).filter(Boolean));

  const supplied = bool(c.suppliedUnderPgd);
  const prevType = (str(ph.supplyType) || '') as SupplyType;
  const prevSupplyNumber = num(c.supplyNumber);
  const prevSuppliesSoFar = num(ph.suppliesSoFar);
  const wasCvStop = bool(c.cardiovascularStop);
  const doseSupplied = str(c.dose) as Dose;
  const validDoses = dosesForSex(sex) as string[];

  const values: Partial<OMSupplyHistory> = {};
  const fields: PrefillableField[] = [];
  const set = <K extends PrefillableField>(key: K, value: OMSupplyHistory[K]) => {
    values[key] = value;
    fields.push(key);
  };

  // First supply date: the previous record if it was the first supply,
  // otherwise whatever it carried.
  const firstSupplyDate = prevType === 'first' && supplied ? prev.consultationDate : str(ph.firstSupplyDate);
  if (firstSupplyDate) set('firstSupplyDate', firstSupplyDate);

  // Supplies so far: the previous record's supply number where it supplied,
  // otherwise the count it carried (a not-supplied visit adds nothing).
  const suppliesSoFar = supplied ? prevSupplyNumber ?? (prevSuppliesSoFar !== null ? prevSuppliesSoFar + 1 : null) : prevType === 'first' ? 0 : prevSuppliesSoFar;
  if (suppliesSoFar !== null && suppliesSoFar > 0) set('suppliesSoFar', suppliesSoFar);

  // Prescriber review: carried as recorded; the supplies since it move on by
  // one where the previous visit supplied.
  // Locked only where a review was held: obtaining one after supply 6 is the
  // normal next event, so an unheld review is prefilled as "no" but left open.
  const reviewHeld = bool(ph.prescriberReviewHeld);
  if (reviewHeld) set('prescriberReviewHeld', true);
  else values.prescriberReviewHeld = false;
  if (reviewHeld) {
    values.prescriberReviewDate = str(ph.prescriberReviewDate);
    values.prescriberReviewBy = str(ph.prescriberReviewBy);
    values.prescriberReviewType = str(ph.prescriberReviewType) as OMSupplyHistory['prescriberReviewType'];
    const since = num(ph.suppliesSinceReview);
    if (since !== null) set('suppliesSinceReview', supplied ? since + 1 : since);
  }

  // The dose the patient has been taking: what was supplied, otherwise what
  // the previous record said they were on.
  const currentDose = supplied && validDoses.includes(doseSupplied) ? doseSupplied : validDoses.includes(str(ph.currentDose)) ? (str(ph.currentDose) as Dose) : '';
  if (currentDose) set('currentDose', currentDose);

  // The increase, once used, never resets.
  const increaseUsed = bool(pinc.usedBefore) || bool(pinc.usedToday) || bool(pinc.resumedToday) || bool(ph.doseIncreasedBefore) || (!!currentDose && currentDose === maximumDose(sex));
  set('doseIncreasedBefore', increaseUsed);

  // Restart status: the previous visit was a restart, or one was recorded.
  const restartedBefore = bool(prestart.restartedBefore) || bool(ph.restartedBefore) || (prevType === 'restart' && supplied);
  set('restartedBefore', restartedBefore);
  if (restartedBefore) {
    const since = prevType === 'restart' && supplied ? 1 : num(prestart.suppliesSinceRestart) ?? num(ph.suppliesSinceRestart);
    if (since !== null) set('suppliesSinceRestart', supplied && prevType !== 'restart' ? since + 1 : since);
  }

  // The baseline systolic: recorded at the first supply or the most recent
  // restart, carried at a continuation. The previous record wrote the
  // applicable value into bloodPressure.baselineSystolic.
  const baseline = num(pbp.baselineSystolic) ?? num(ph.baselineSystolic);
  if (baseline !== null) set('baselineSystolic', baseline);

  // Today's weight at the previous visit is the previous weight for the 2 kg
  // rule (a restart makes today's weight the new previous weight).
  const prevWeight = num(pm.weightKg) ?? num(pbp.weightKg);
  if (prevWeight !== null) set('previousWeightKg', prevWeight);

  // A cardiovascular stop at the previous visit, or one carried unresolved,
  // stands until the face to face review is recorded today.
  const prevCvUnresolved = str(ph.previousCvStop) === 'yes' && !bool(ph.cvStopReviewHeld);
  set('previousCvStop', wasCvStop || prevCvUnresolved ? 'yes' : 'no');

  // A non-cardiovascular stop (starting dose not tolerated): the one further
  // try, and whether it has already failed.
  const stoppedNonCvNow = str(ps.doseDecision) === 'stop-non-cv' && prevType === 'continuation';
  const prevNonCv = str(ph.previousNonCvStop) === 'yes';
  const nonCvStop = stoppedNonCvNow || prevNonCv;
  set('previousNonCvStop', nonCvStop ? 'yes' : 'no');
  if (nonCvStop) set('nonCvStopRetriedBefore', bool(ph.nonCvStopRetriedBefore) || (prevNonCv && stoppedNonCvNow));

  // The one return visit after a reading outside the limits on repeat at a
  // first visit: used where the previous record was such a first visit.
  const bpCodes = ['BP_HIGH_ON_REPEAT', 'BP_LOW', 'BP_LOW_WITH_SYMPTOMS', 'POSTURAL_FALL', 'PULSE_OUT_OF_RANGE'];
  const returnVisitUsed = prevType === 'first' && !supplied && bpCodes.some((code) => alertCodes.has(code));
  if (returnVisitUsed) set('returnVisitUsedBefore', true);

  const expectedRunOut = supplied && parseLocalDate(prev.consultationDate) ? formatLocalDate(addDays(parseLocalDate(prev.consultationDate) as Date, SUPPLY_DAYS)) : null;

  const prefillValues: OMPrefill['values'] = {};
  for (const f of fields) prefillValues[f] = values[f] as string | number | boolean | null;

  return {
    prefill: {
      recordId: prev.recordId,
      consultationDate: prev.consultationDate,
      previousSupplied: supplied,
      previousSupplyType: prevType,
      previousSupplyNumber: supplied ? prevSupplyNumber : null,
      previousDoseLabel: supplied && validDoses.includes(doseSupplied) ? DOSE_INFO[doseSupplied as Exclude<Dose, ''>].label : null,
      expectedRunOutDate: expectedRunOut,
      previousWasCvStop: wasCvStop,
      fields,
      values: prefillValues,
      overrides: {},
    },
    values,
  };
}

/** Apply the prefill to a history object (used when the supply type is re-selected, which otherwise resets the course history). */
export function applyPrefill(base: OMSupplyHistory, derived: DerivedPrefill): OMSupplyHistory {
  return { ...base, ...derived.values, prefill: derived.prefill };
}

/** A prefilled field is locked until the pharmacist unlocks it with a reason. */
export function prefillLocked(history: OMSupplyHistory, field: PrefillableField): boolean {
  const p = history.prefill;
  return !!p && p.fields.includes(field) && !(field in p.overrides);
}

export function prefilledValue(history: OMSupplyHistory, field: PrefillableField): string | number | boolean | null | undefined {
  return history.prefill?.values[field];
}

/** Human summary of what was carried forward, for the banner. */
export function describePrefill(p: OMPrefill): string {
  const bits: string[] = [];
  bits.push(p.previousSupplied ? `supply ${p.previousSupplyNumber ?? '?'} (${p.previousSupplyType || 'type not recorded'}) of ${p.previousDoseLabel ?? 'dose not recorded'}` : `not supplied${p.previousWasCvStop ? ' (cardiovascular stop)' : ''}`);
  if (p.values.suppliesSoFar !== undefined) bits.push(`${p.values.suppliesSoFar} supplies so far`);
  if (p.values.baselineSystolic !== undefined) bits.push(`baseline systolic ${p.values.baselineSystolic} mmHg`);
  if (p.values.previousWeightKg !== undefined) bits.push(`weight ${p.values.previousWeightKg} kg`);
  if (p.values.doseIncreasedBefore === true) bits.push('increase used');
  if (p.values.restartedBefore === true) bits.push('restarted before');
  if (p.values.previousCvStop === 'yes') bits.push('cardiovascular stop outstanding');
  if (p.values.previousNonCvStop === 'yes') bits.push('non-cardiovascular stop recorded');
  if (p.values.returnVisitUsedBefore === true) bits.push('the one return visit used');
  return bits.join('; ');
}
