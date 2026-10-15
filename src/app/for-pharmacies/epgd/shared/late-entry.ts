/**
 * Late entry: recording a vaccine dose that was given on an earlier day.
 *
 * WHY
 * ---
 * Every vaccination tool assumed the dose was given today. A pharmacist at
 * Audley Pharmacy gave a rabies first dose, could not get onto the system
 * that day, and had no way to record it afterwards: the next-due dates, the
 * batch expiry check and the saved consultation date would all have been
 * worked out from the day the record was typed, not the day the vaccine went
 * in. The record would have been wrong in the places that matter.
 *
 * HOW
 * ---
 * The late-entry state lives in a module-level store keyed by PGD slug, in
 * the same way as the pre-vaccination safety checks, so one panel mounted in
 * StepWrapper serves every tool without threading props through each one.
 * Tools read the administration date with getAdministrationDate(slug) (or the
 * useAdministrationDate hook) and use it in place of "today" for every date
 * calculation tied to the dose. The consultation save (useConsultationTracking)
 * writes the date given as the consultation date and stores the flag, the
 * reason and the date the entry was made in the clinical record.
 *
 * Held in memory only. It is deliberately NOT kept in sessionStorage: the
 * tools' form drafts do not carry the late entry with them, so restoring it on
 * reload could attach a ticked late entry to a different patient's form.
 * Cleared when a tool mounts (useAdministrationDate), on New Consultation and
 * when a saved or completed consultation returns to the first step.
 */

import { VACCINE_SLUGS } from "./vaccine-slugs";

/** Maximum age, in days, of a dose that may be recorded as a late entry. */
export const LATE_ENTRY_MAX_DAYS = 90;

/** Minimum length of the reason for a late entry. */
export const LATE_ENTRY_MIN_REASON = 5;

/**
 * Tools that offer the late-entry panel: every vaccination tool, plus the
 * draft vaccine tools that are not yet in VACCINE_SLUGS.
 */
export const LATE_ENTRY_SLUGS = new Set<string>([
  ...VACCINE_SLUGS,
  "cholera",
  "tick-borne-encephalitis",
  "chikungunya",
]);

export interface LateEntryState {
  lateEntry: boolean;
  /** Date the dose was given, YYYY-MM-DD. Only meaningful when lateEntry. */
  dateGiven: string;
  reason: string;
}

const EMPTY: LateEntryState = { lateEntry: false, dateGiven: "", reason: "" };

/**
 * Today's date in London (Europe/London), YYYY-MM-DD. Every pharmacy is in
 * the UK, and the server runs in UTC, so the calendar date is always taken
 * in London time: between midnight and 01:00 BST, UTC is still on the day
 * before. Falls back to the device's local date if Intl cannot do it.
 */
export function todayLocalIso(): string {
  const d = new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value;
    const y = get("year");
    const m = get("month");
    const day = get("day");
    if (y && m && day) return `${y}-${m}-${day}`;
  } catch {
    // fall through to the device date
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Parse YYYY-MM-DD as a local-midnight Date (null when not a real date). */
export function parseIsoLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getMonth() !== Number(m[2]) - 1) return null;
  return d;
}

/** YYYY-MM-DD to DD/MM/YYYY. Returns the input unchanged if not ISO. */
export function formatUkDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** Whole days from a to b (b minus a), both YYYY-MM-DD. */
export function daysBetweenIso(a: string, b: string): number | null {
  const da = parseIsoLocal(a);
  const db = parseIsoLocal(b);
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/**
 * A date string as a calendar date, YYYY-MM-DD. Accepts YYYY-MM-DD (or a
 * longer ISO string, whose first ten characters are used); anything else is
 * read with new Date() and converted to the local calendar date. Null when
 * not a date.
 */
export function toCalendarIso(value: string | undefined | null): string | null {
  if (!value) return null;
  const head = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return parseIsoLocal(head) ? head : null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Years from one calendar date to another (to minus from), counted on the
 * calendar: the anniversary day is exactly a whole number (5 years after
 * 15/10/2021 is 15/10/2026, which returns 5), and the part-year is the share
 * of the year since the last anniversary. `to` defaults to today. Null when
 * either date is missing or invalid.
 */
export function calendarYearsBetween(from: string | undefined | null, to?: string): number | null {
  const a = toCalendarIso(from);
  const b = toCalendarIso(to ?? todayLocalIso());
  if (!a || !b) return null;
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const anniversary = (years: number) => Date.UTC(ay + years, am - 1, ad);
  const target = Date.UTC(by, bm - 1, bd);
  let years = by - ay;
  while (anniversary(years) > target) years--;
  while (anniversary(years + 1) <= target) years++;
  const start = anniversary(years);
  const next = anniversary(years + 1);
  return years + (target - start) / (next - start);
}

/** Completed years of age on a given date (default today). */
export function ageOn(dob: string, onIso?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const on = (onIso && parseIsoLocal(onIso)) || new Date();
  let age = on.getFullYear() - birth.getFullYear();
  const md = on.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && on.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Validation for the late-entry fields. Null when the panel is unticked or
 * the entry is complete and in range.
 */
export function lateEntryError(s: LateEntryState, today: string = todayLocalIso()): string | null {
  if (!s.lateEntry) return null;
  if (!s.dateGiven) return "Enter the date the dose was given.";
  const diff = daysBetweenIso(s.dateGiven, today);
  if (diff === null) return "Enter the date the dose was given as a real date.";
  if (diff < 0) return "The date the dose was given cannot be in the future.";
  if (diff > LATE_ENTRY_MAX_DAYS)
    return `The date the dose was given cannot be more than ${LATE_ENTRY_MAX_DAYS} days ago. Record older doses through your paper process.`;
  if (s.reason.trim().length < LATE_ENTRY_MIN_REASON)
    return `Give the reason for the late entry (at least ${LATE_ENTRY_MIN_REASON} characters).`;
  return null;
}

/** The single line shown on the record and the printed summary. */
export function lateEntryLine(dateGiven: string, recordedOn: string, reason: string): string {
  return `Late entry: dose given ${formatUkDate(dateGiven)}, recorded ${formatUkDate(recordedOn)}. Reason: ${reason.trim()}`;
}

// ─── Store ───

const store = new Map<string, LateEntryState>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeLateEntry(slug: string, listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLateEntry(slug: string): LateEntryState {
  return store.get(slug) ?? EMPTY;
}

export function getEmptyLateEntry(): LateEntryState {
  return EMPTY;
}

export function setLateEntry(slug: string, next: LateEntryState): void {
  store.set(slug, next);
  emit();
}

export function clearLateEntry(slug: string): void {
  if (!store.has(slug)) return;
  store.delete(slug);
  emit();
}

/** True when a late entry is ticked and complete. */
export function lateEntryActive(slug: string): boolean {
  const s = getLateEntry(slug);
  return s.lateEntry && lateEntryError(s) === null;
}

/**
 * The date the dose was given: the late-entry date when one is ticked and
 * valid, otherwise today. Use this, not new Date(), for every calculation
 * tied to the administration (next-due dates, intervals since a previous
 * dose, batch expiry, age at vaccination, days before departure).
 */
export function getAdministrationDate(slug: string): string {
  const s = getLateEntry(slug);
  return s.lateEntry && lateEntryError(s) === null ? s.dateGiven : todayLocalIso();
}

/** False when the late-entry panel is ticked but incomplete or out of range. */
export function lateEntrySatisfied(slug: string): boolean {
  if (!LATE_ENTRY_SLUGS.has(slug)) return true;
  return lateEntryError(getLateEntry(slug)) === null;
}

/**
 * Fields for the saved record. Spread into clinicalData and summary by
 * useConsultationTracking.saveRecord.
 */
export function lateEntryRecord(slug: string):
  | { lateEntry: true; dateGiven: string; recordedOn: string; reason: string; line: string }
  | null {
  if (!LATE_ENTRY_SLUGS.has(slug) || !lateEntryActive(slug)) return null;
  const s = getLateEntry(slug);
  const recordedOn = todayLocalIso();
  return {
    lateEntry: true,
    dateGiven: s.dateGiven,
    recordedOn,
    reason: s.reason.trim(),
    line: lateEntryLine(s.dateGiven, recordedOn, s.reason),
  };
}
