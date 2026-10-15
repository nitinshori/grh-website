import type { Dose, MelCarryForward, MelHistory } from './melatonin-types';
import { REVIEW_ACCEPTED_UNTIL } from './melatonin-types';
import { COURSE_ENDING_CODES } from './melatonin-clinical-logic';

// ─────────────────────────────────────────────────────────────────────────
// Carry-forward from the patient's previous melatonin records at this
// pharmacy, the same mechanism the oral minoxidil tool uses: the list
// endpoint filtered by pgd slug and patient (name and date of birth), then
// the audited detail endpoint for each record's clinicalData. The supply
// number, supply 1 date, last supply date, previous dose and baseline rating
// are derived from the records, never self-declared, where a record exists.
// The lookup is a safeguard, never a blocker: where it finds nothing or
// fails, a supply 2 or 3 needs a reason and the supply 1 record, and the
// supply 1 gates that depend on the course history apply. Where it shows an
// open (or recently lapsed) course, supply 1 needs a recorded reason.
// ─────────────────────────────────────────────────────────────────────────

export const MELATONIN_SLUG = 'melatonin';

/** The most records read (newest first). */
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
  if (!v) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(v);
  return m ? m[1] : '';
}
function addDaysIso(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

export interface PreviousMelatoninRecord {
  recordId: string;
  consultationDate: string;
  clinical: Json;
}

/** The patient's melatonin records at this pharmacy, newest first, with clinical data; null where the lookup failed. */
export async function fetchPreviousMelatoninRecords(patient: { firstName: string; lastName: string; dateOfBirth: string }): Promise<PreviousMelatoninRecord[] | null> {
  const firstName = patient.firstName.trim().toLowerCase();
  const lastName = patient.lastName.trim().toLowerCase();
  const dob = patient.dateOfBirth.trim();
  if (!firstName || !lastName || !dob) return null;
  try {
    const qs = new URLSearchParams({ pgdSlug: MELATONIN_SLUG, search: patient.lastName.trim(), limit: '50' });
    const res = await fetch(`/api/consultation-records?${qs}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { records?: ListRow[] };
    const rows = (data.records ?? []).filter(
      (r) =>
        r.pgdSlug === MELATONIN_SLUG &&
        str(r.patientFirstName).trim().toLowerCase() === firstName &&
        str(r.patientLastName).trim().toLowerCase() === lastName &&
        isoDay(r.patientDob) === isoDay(dob)
    );
    rows.sort((a, b) => `${isoDay(b.consultationDate)}T${b.createdAt ?? ''}`.localeCompare(`${isoDay(a.consultationDate)}T${a.createdAt ?? ''}`));
    const out: PreviousMelatoninRecord[] = [];
    for (const row of rows.slice(0, MAX_RECORDS)) {
      const detail = await fetch(`/api/consultation-records/${row.id}`, { cache: 'no-store' });
      if (!detail.ok) return null;
      const body = (await detail.json()) as { record?: { clinicalData?: unknown; consultationDate?: string | null } };
      let clinical: unknown = body.record?.clinicalData;
      if (typeof clinical === 'string') {
        try {
          clinical = JSON.parse(clinical);
        } catch {
          clinical = null;
        }
      }
      const rec = asRecord(clinical);
      if (!rec) continue;
      out.push({ recordId: row.id, consultationDate: isoDay(row.consultationDate) || isoDay(body.record?.consultationDate) || isoDay(str(asRecord(rec.summary)?.consultationDate)), clinical: rec });
    }
    return out;
  } catch {
    return null;
  }
}

function stopCodes(c: Json): string[] {
  const alerts = Array.isArray(c.clinicalAlerts) ? (c.clinicalAlerts as unknown[]) : [];
  return alerts
    .map((a) => asRecord(a))
    .filter((a): a is Json => !!a && str(a.severity) === 'stop')
    .map((a) => str(a.code));
}

function supplyNumberOf(c: Json): string {
  return str(asRecord(c.course)?.supplyNumber) || str(asRecord(c.history)?.supplyNumber);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The later of two ISO dates ('' counts as none). */
const laterIso = (a: string, b: string): string => (!a ? b : !b ? a : a > b ? a : b);

/**
 * Derive today's course position from the records (newest first). Null where
 * there are no records. A course whose last supply (supply 1 or 2) has had no
 * further supply or review by day 37 has ended, on day 37 after that supply:
 * the 6 month interval and the two-course rule run from that date.
 */
export function deriveCarryForward(records: PreviousMelatoninRecord[], today: string = todayIso()): MelCarryForward | null {
  if (!records.length) return null;
  const armA = records.filter((r) => str(r.clinical.arm) === 'A' || str(asRecord(r.clinical.consent)?.arm) === 'A');
  const supplied = armA.filter((r) => r.clinical.suppliedUnderPgd === true);
  const stopRule2Found = records.some((r) => stopCodes(r.clinical).some((code) => code === 'STOP_RULE_2_DROWSINESS' || code === 'STOP_RULE_2_FALL' || code === 'PREVIOUS_STOP_RULE_2'));
  const coursesFound = supplied.filter((r) => supplyNumberOf(r.clinical) === '1').length;

  const endedAt = (r: PreviousMelatoninRecord): string => {
    const c = r.clinical;
    const course = asRecord(c.course);
    if (course && course.courseEnded === true) {
      // Supply 3: the course ends with the last tablet (day 29 after supply 3).
      return c.suppliedUnderPgd === true ? addDaysIso(r.consultationDate, 29) : r.consultationDate;
    }
    if (c.suppliedUnderPgd === true && supplyNumberOf(c) === '3') return addDaysIso(r.consultationDate, 29);
    if (c.suppliedUnderPgd !== true && supplyNumberOf(c) !== '1' && stopCodes(c).some((code) => COURSE_ENDING_CODES.has(code))) return r.consultationDate;
    return '';
  };
  const lastEnding = armA.find((r) => !!endedAt(r));
  let lastCourseEndDate = lastEnding ? endedAt(lastEnding) : '';

  const latest = supplied[0];
  const base: MelCarryForward = {
    recordId: latest?.recordId ?? records[0].recordId,
    consultationDate: latest?.consultationDate ?? records[0].consultationDate,
    expectedSupply: '1',
    supply1Date: '',
    lastSupplyDate: '',
    previousDose: '',
    baselineRating: null,
    coursesFound,
    lastCourseEndDate,
    latestCourseState: 'none',
    latestCourseLastSupplyDate: '',
    stopRule2Found,
    recordsRead: records.length,
  };
  if (!latest) return base;
  const n = supplyNumberOf(latest.clinical);
  // A course is open where the latest arm A supply was supply 1 or 2 and no
  // record since (or that record itself) ended the course.
  const idx = armA.indexOf(latest);
  const endedSince = armA.slice(0, idx + 1).some((r) => !!endedAt(r));
  if ((n !== '1' && n !== '2') || endedSince) return base;
  // No supply or review by day 37 after the last supply: the course ended on day 37.
  const lapseDate = addDaysIso(latest.consultationDate, REVIEW_ACCEPTED_UNTIL);
  if (lapseDate && today > lapseDate) {
    lastCourseEndDate = laterIso(lastCourseEndDate, lapseDate);
    return { ...base, lastCourseEndDate, latestCourseState: 'lapsed', latestCourseLastSupplyDate: latest.consultationDate };
  }
  const c = latest.clinical;
  const course = asRecord(c.course) ?? {};
  const hist = asRecord(c.history) ?? {};
  const dose = str(asRecord(c.supply)?.dose);
  return {
    ...base,
    expectedSupply: n === '1' ? '2' : '3',
    supply1Date: n === '1' ? latest.consultationDate : isoDay(str(course.supply1Date)) || isoDay(str(hist.supply1Date)),
    lastSupplyDate: latest.consultationDate,
    previousDose: dose === '3' || dose === '5' ? (dose as Dose) : '',
    baselineRating: num(course.baselineRating) ?? num(hist.baselineRating),
    latestCourseState: 'open',
    latestCourseLastSupplyDate: latest.consultationDate,
  };
}

/** Previous courses the records show, not counting a course still open that today continues. */
export function previousCoursesFromRecords(cf: MelCarryForward | null, supplyNumber: MelHistory['supplyNumber']): number {
  if (!cf) return 0;
  const continuing = cf.latestCourseState === 'open' && supplyNumber !== '1' && supplyNumber !== '';
  return Math.max(0, cf.coursesFound - (continuing ? 1 : 0));
}

/**
 * Apply the carried-forward values. The supply 2 or 3 details are filled where
 * today's supply number is the one the records show; the previous course end
 * date and the course count are carried whichever supply is selected (they are
 * never lower or earlier than the records show).
 */
export function applyCarryForward(h: MelHistory, cf: MelCarryForward | null, lookup: MelHistory['recordLookup']): MelHistory {
  const next: MelHistory = { ...h, recordLookup: lookup, carriedForward: cf };
  if (!cf) return next;
  if (!next.supplyNumber) next.supplyNumber = cf.expectedSupply;
  if (next.supplyNumber === cf.expectedSupply && cf.expectedSupply !== '1') {
    if (cf.supply1Date) next.supply1Date = cf.supply1Date;
    if (cf.lastSupplyDate) next.lastSupplyDate = cf.lastSupplyDate;
    if (cf.previousDose) next.previousDose = cf.previousDose;
    if (cf.baselineRating !== null) next.baselineRating = cf.baselineRating;
  }
  if (cf.stopRule2Found) next.previousStopRule2 = 'yes';
  const found = previousCoursesFromRecords(cf, next.supplyNumber);
  if (found > 0 && (next.previousCoursesThisPgd === null || next.previousCoursesThisPgd < found)) {
    next.previousCoursesThisPgd = found;
  }
  if (cf.lastCourseEndDate && (!next.previousCourseEndDate || next.previousCourseEndDate < cf.lastCourseEndDate)) next.previousCourseEndDate = cf.lastCourseEndDate;
  return next;
}

export function describeCarryForward(cf: MelCarryForward): string {
  const bits: string[] = [`${cf.recordsRead} melatonin record(s) read`, `${cf.coursesFound} arm A course(s) found`];
  if (cf.latestCourseState === 'lapsed') bits.push(`the last course lapsed (no supply or review by day 37 after the supply on ${cf.latestCourseLastSupplyDate || '?'}), so it ended on day 37`);
  if (cf.expectedSupply === '1') bits.push('no course open: today is supply 1 of a new course');
  else bits.push(`course open: today is supply ${cf.expectedSupply} (supply 1 on ${cf.supply1Date || '?'}, last supply on ${cf.lastSupplyDate || '?'} at ${cf.previousDose || '?'} mg, baseline rating ${cf.baselineRating ?? '?'})`);
  if (cf.lastCourseEndDate) bits.push(`most recent course ended ${cf.lastCourseEndDate}`);
  if (cf.stopRule2Found) bits.push('a stopping rule 2 stop is on record');
  return bits.join('; ');
}
