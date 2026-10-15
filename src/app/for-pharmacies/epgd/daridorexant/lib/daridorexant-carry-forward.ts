import type { CarriedCourse, DCourse, Strength, VisitType } from './daridorexant-types';
import { COURSE_ENDED_CODES, RISK_CODES, STOP_RULE_CODES, formatUk } from './daridorexant-clinical-logic';

// ─────────────────────────────────────────────────────────────────────────
// Course history from the patient's previous daridorexant records at this
// pharmacy, the same mechanism as oral minoxidil: the list endpoint filtered
// by pgd slug and patient (name and date of birth), then the audited detail
// endpoint for each record's clinicalData. The supply number, supply 1 date,
// previous supply date and strength, and the baseline ISI are derived from
// the records and shown read-only; the pharmacist may enter them by hand only
// with a recorded reason, and the course is then marked unverified.
// ─────────────────────────────────────────────────────────────────────────

export const DARIDOREXANT_SLUG = 'daridorexant';
const MAX_RECORDS = 12;

type Json = Record<string, unknown>;

const asRecord = (v: unknown): Json | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}
function isoDay(v: string | null | undefined): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(v ?? '');
  return m ? m[1] : '';
}

export interface PreviousDaridorexantRecord {
  recordId: string;
  consultationDate: string;
  createdAt: string;
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

/**
 * Every daridorexant record for this patient at this pharmacy (up to 12, oldest
 * first), or [] where there is none; null where the lookup failed.
 */
export async function fetchPreviousDaridorexantRecords(patient: { firstName: string; lastName: string; dateOfBirth: string }): Promise<PreviousDaridorexantRecord[] | null> {
  const firstName = patient.firstName.trim().toLowerCase();
  const lastName = patient.lastName.trim().toLowerCase();
  const dob = patient.dateOfBirth.trim();
  if (!firstName || !lastName || !dob) return [];
  try {
    const qs = new URLSearchParams({ pgdSlug: DARIDOREXANT_SLUG, search: patient.lastName.trim(), limit: '50' });
    const res = await fetch(`/api/consultation-records?${qs}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { records?: ListRow[] };
    const rows = (data.records ?? []).filter(
      (r) =>
        r.pgdSlug === DARIDOREXANT_SLUG &&
        str(r.patientFirstName).trim().toLowerCase() === firstName &&
        str(r.patientLastName).trim().toLowerCase() === lastName &&
        isoDay(r.patientDob) === isoDay(dob)
    );
    const key = (r: ListRow) => `${isoDay(r.consultationDate)}T${r.createdAt ?? ''}`;
    rows.sort((a, b) => key(b).localeCompare(key(a)));
    const newest = rows.slice(0, MAX_RECORDS);
    const out: PreviousDaridorexantRecord[] = [];
    for (const row of newest) {
      const detail = await fetch(`/api/consultation-records/${row.id}`, { cache: 'no-store' });
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
      out.push({
        recordId: row.id,
        consultationDate: isoDay(row.consultationDate) || isoDay(body.record?.consultationDate) || '',
        createdAt: row.createdAt ?? '',
        outcome: row.outcome || body.record?.outcome || '',
        clinical: asRecord(clinical) ?? {},
      });
    }
    return out.reverse();
  } catch {
    return null;
  }
}

/** Marker for a record whose not-supplied reasons include a stop rule (exclusion.stopRule). */
export const STOP_RULE_RECORDED = 'STOP_RULE_RECORDED';

/**
 * The stop codes in force when a record was saved: stop-history entries that
 * were never cleared (an entry with a clearedAt timestamp was raised and then
 * resolved during the consultation, so it does not count), the stop alerts
 * saved with the record, and a stop rule recorded as a reason for not supplying.
 */
function recordStopCodes(c: Json): string[] {
  const codes = new Set<string>();
  for (const e of Array.isArray(c.stopHistory) ? (c.stopHistory as unknown[]) : []) {
    const r = asRecord(e);
    const code = str(r?.code);
    const cleared = r ? r.clearedAt : undefined;
    if (code && !(typeof cleared === 'string' ? cleared.trim() : cleared)) codes.add(code);
  }
  for (const a of Array.isArray(c.clinicalAlerts) ? (c.clinicalAlerts as unknown[]) : []) {
    const r = asRecord(a);
    if (r && str(r.severity) === 'stop' && str(r.code)) codes.add(str(r.code));
  }
  if (asRecord(c.exclusion)?.stopRule === true) codes.add(STOP_RULE_RECORDED);
  return [...codes];
}

/** Distil the records (oldest first) into the course history for today. */
export function deriveCarriedCourse(records: PreviousDaridorexantRecord[]): CarriedCourse | null {
  if (records.length === 0) return null;
  const supplied = records.filter((r) => r.clinical.suppliedUnderPgd === true);
  const maxNumber = supplied.reduce((m, r) => Math.max(m, num(r.clinical.supplyNumber) ?? 0), 0);
  const count = Math.max(supplied.length, maxNumber);
  const latest = supplied[supplied.length - 1];
  const s1 = supplied.find((r) => num(r.clinical.supplyNumber) === 1);
  const screens = (r: PreviousDaridorexantRecord | undefined) => asRecord(r?.clinical.screens) ?? {};

  const supply1Date = s1?.consultationDate || (latest ? isoDay(str(latest.clinical.supply1Date)) : '');
  const strengthRaw = latest ? str(latest.clinical.strength) : '';
  const previousStrength: Strength = strengthRaw === '50' || strengthRaw === '25' ? strengthRaw : '';
  const baselineIsi = s1 ? num(screens(s1).isi) ?? num(screens(s1).isiBaseline) : latest ? num(screens(latest).isiBaseline) : null;
  const visitType: VisitType = count === 0 ? 'visit1' : count === 1 ? 'visit2' : count === 2 ? 'visit3' : 'after3';

  // A not-supplied record after the last supply that stopped the course.
  let courseStoppedOnRecord = '';
  if (latest) {
    const after = records.slice(records.indexOf(latest) + 1).filter((r) => r.clinical.suppliedUnderPgd !== true);
    const ending = new Set([...COURSE_ENDED_CODES, ...STOP_RULE_CODES, ...RISK_CODES, STOP_RULE_RECORDED]);
    ending.delete('INTERVAL_TOO_SHORT');
    for (const r of after) {
      const hit = recordStopCodes(r.clinical).filter((c) => ending.has(c));
      if (hit.length > 0) {
        courseStoppedOnRecord = `record of ${formatUk(r.consultationDate)} (${hit.join(', ')})`;
        break;
      }
    }
  }

  return {
    recordIds: records.map((r) => r.recordId),
    latestRecordDate: records[records.length - 1].consultationDate,
    suppliesOnRecord: count,
    supply1Date: count > 0 ? supply1Date : '',
    previousSupplyDate: latest?.consultationDate ?? '',
    previousStrength,
    baselineIsi: count > 0 ? baselineIsi : null,
    visitType,
    courseStoppedOnRecord,
  };
}

/** A carried course restored from a saved draft: malformed values are treated as empty (null where unusable). */
export function sanitizeCarried(v: unknown): CarriedCourse | null {
  const r = asRecord(v);
  if (!r) return null;
  const visit = str(r.visitType);
  const strength = str(r.previousStrength);
  const supplies = num(r.suppliesOnRecord);
  return {
    recordIds: Array.isArray(r.recordIds) ? r.recordIds.filter((x): x is string => typeof x === 'string') : [],
    latestRecordDate: isoDay(str(r.latestRecordDate)),
    suppliesOnRecord: supplies !== null && supplies >= 0 ? Math.floor(supplies) : 0,
    supply1Date: isoDay(str(r.supply1Date)),
    previousSupplyDate: isoDay(str(r.previousSupplyDate)),
    previousStrength: strength === '50' || strength === '25' ? strength : '',
    baselineIsi: num(r.baselineIsi),
    visitType: visit === 'visit1' || visit === 'visit2' || visit === 'visit3' || visit === 'after3' ? visit : '',
    courseStoppedOnRecord: str(r.courseStoppedOnRecord),
  };
}

/** The highest visit the manual override may select: one more than the supplies on record (any visit where the records could not be read). */
export function maxOverrideVisitNumber(c: Pick<DCourse, 'recordLookup' | 'carried'>): number {
  if (c.recordLookup === 'error') return 3;
  return Math.min(3, (c.carried?.suppliesOnRecord ?? 0) + 1);
}

/** The course fields that come from the records (or visit 1 where there are none). */
export function carriedCourseFields(carried: CarriedCourse | null): Pick<DCourse, 'visitType' | 'supply1Date' | 'previousSupplyDate' | 'previousStrength' | 'baselineIsi'> {
  if (!carried || carried.suppliesOnRecord === 0) return { visitType: 'visit1', supply1Date: '', previousSupplyDate: '', previousStrength: '', baselineIsi: null };
  return {
    visitType: carried.visitType,
    supply1Date: carried.supply1Date,
    previousSupplyDate: carried.previousSupplyDate,
    previousStrength: carried.previousStrength,
    baselineIsi: carried.baselineIsi,
  };
}

export function describeCarried(c: CarriedCourse | null): string {
  if (!c || c.suppliesOnRecord === 0) return 'No supply under this PGD on record at this pharmacy: today is supply visit 1';
  const bits = [`${c.suppliesOnRecord} ${c.suppliesOnRecord === 1 ? 'supply' : 'supplies'} on record`];
  if (c.supply1Date) bits.push(`supply 1 on ${formatUk(c.supply1Date)}`);
  else bits.push('no supply 1 record found');
  if (c.previousSupplyDate) bits.push(`last supply ${formatUk(c.previousSupplyDate)}${c.previousStrength ? ` at ${c.previousStrength} mg` : ''}`);
  if (c.baselineIsi !== null) bits.push(`baseline ISI ${c.baselineIsi}`);
  if (c.courseStoppedOnRecord) bits.push(`course stopped: ${c.courseStoppedOnRecord}`);
  return bits.join('; ');
}
