"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { TextInput } from "./FormInputs";
import {
  LATE_ENTRY_MAX_DAYS,
  LATE_ENTRY_SLUGS,
  clearLateEntry,
  getEmptyLateEntry,
  getLateEntry,
  lateEntryError,
  lateEntryLine,
  setLateEntry,
  subscribeLateEntry,
  todayLocalIso,
  type LateEntryState,
} from "../late-entry";

/** Live late-entry state for a tool. Re-renders when it changes. */
export function useLateEntry(slug: string): LateEntryState {
  const subscribe = useCallback((l: () => void) => subscribeLateEntry(slug, l), [slug]);
  return useSyncExternalStore(
    subscribe,
    () => getLateEntry(slug),
    getEmptyLateEntry
  );
}

/**
 * The date the dose was given (YYYY-MM-DD): the late-entry date when ticked
 * and valid, otherwise today. Use in place of "today" in every calculation
 * tied to the administration.
 *
 * Call it once, at the top of the tool's client component (which mounts once
 * per visit to the tool). Mounting the tool starts with a new or restored
 * form, and the late entry is not saved with form drafts, so any late entry
 * left in memory from an earlier visit is cleared here: it must never carry
 * over to another consultation.
 */
export function useAdministrationDate(slug: string): string {
  useEffect(() => {
    clearLateEntry(slug);
  }, [slug]);
  const s = useLateEntry(slug);
  return s.lateEntry && lateEntryError(s) === null ? s.dateGiven : todayLocalIso();
}

/**
 * "Recording a dose given on an earlier day (late entry)".
 *
 * Mounted once in StepWrapper for every vaccination tool, and directly in
 * the vaccination tools with their own navigation. Ticking it asks for the
 * date the dose was given (not in the future, not more than 90 days ago) and
 * the reason. Unticking puts the administration date back to today.
 */
export function LateEntry({ slug }: { slug: string }) {
  const s = useLateEntry(slug);
  if (!LATE_ENTRY_SLUGS.has(slug)) return null;

  const update = (patch: Partial<LateEntryState>) => {
    const next = { ...getLateEntry(slug), ...patch };
    if (patch.lateEntry === false) {
      next.dateGiven = "";
      next.reason = "";
    }
    setLateEntry(slug, next);
  };
  const error = lateEntryError(s);
  const showError = s.lateEntry && error && (s.dateGiven !== "" || s.reason !== "");

  return (
    <div
      className={`mx-6 mb-4 rounded-lg border p-4 ${
        s.lateEntry
          ? "border-amber-300 bg-amber-50 print:border-gray-400 print:bg-white"
          : "border-gray-200 bg-gray-50 print:hidden"
      }`}
    >
      <label className="flex items-start gap-3 text-sm text-navy-900 cursor-pointer print:hidden">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0"
          checked={s.lateEntry}
          onChange={(e) => update({ lateEntry: e.target.checked })}
        />
        <span>
          <strong>Recording a dose given on an earlier day (late entry)</strong>
          <span className="block text-xs text-gray-600 mt-0.5">
            Tick only if the vaccine was given on an earlier day and is being
            recorded now. Next-due dates, intervals, age and batch expiry are
            then worked out from the date the dose was given.
          </span>
        </span>
      </label>

      {s.lateEntry && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 print:hidden">
          <TextInput
            label="Date the dose was given"
            type="date"
            required
            value={s.dateGiven}
            onChange={(v) => update({ dateGiven: v })}
          />
          <TextInput
            label="Reason for late entry"
            required
            value={s.reason}
            onChange={(v) => update({ reason: v })}
            placeholder="e.g. system unavailable, recorded on paper first"
          />
        </div>
      )}

      {s.lateEntry && (
        <p className="mt-2 text-xs text-gray-600 print:hidden">
          The date must not be in the future or more than {LATE_ENTRY_MAX_DAYS} days ago.
        </p>
      )}

      {showError && (
        <p className="mt-2 text-sm text-red-700 print:hidden">{error}</p>
      )}

      {s.lateEntry && !error && (
        <p className="mt-2 text-sm font-semibold text-amber-900 print:text-black">
          {lateEntryLine(s.dateGiven, todayLocalIso(), s.reason)}
        </p>
      )}
    </div>
  );
}

/**
 * One-line late-entry notice for a printed summary report. Renders nothing
 * unless a valid late entry is ticked.
 */
export function LateEntrySummaryLine({ slug, className = "" }: { slug: string; className?: string }) {
  const s = useLateEntry(slug);
  if (!s.lateEntry || lateEntryError(s) !== null) return null;
  return (
    <p className={`my-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 print:bg-white print:text-black ${className}`}>
      {lateEntryLine(s.dateGiven, todayLocalIso(), s.reason)}
    </p>
  );
}
