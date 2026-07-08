"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  /** Slug of the PGD (e.g. "meningitis-acwy-travel"). */
  pgdSlug: string;
  /** Live patient identifiers for the drafts list display. */
  patientFirstName?: string;
  patientLastName?: string;
  patientDob?: string;
  /** A serialisable snapshot of the entire form state for this consultation. */
  getDraftState: () => unknown;
  /** Optional className for layout tweaks. */
  className?: string;
}

/**
 * Save-as-draft button. Drops the current PGD form state to the server.
 * If a `?draftId=` is in the URL we PATCH that draft instead of creating a
 * new one. After save, redirects to the drafts list.
 */
export function SaveDraftButton({
  pgdSlug,
  patientFirstName,
  patientLastName,
  patientDob,
  getDraftState,
  className = "",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function handleSave() {
    setBusy(true);
    try {
      const draftState = getDraftState();
      const note = window.prompt(
        "Optional note to leave for the pharmacist (e.g. 'ready for clinical review'):",
        ""
      );
      if (note === null) {
        // user cancelled the prompt
        setBusy(false);
        return;
      }

      const payload = {
        pgdSlug,
        patientFirstName,
        patientLastName,
        patientDob,
        draftState,
        note: note.trim() || undefined,
      };

      const url = draftId
        ? `/api/consultation-drafts/${draftId}`
        : "/api/consultation-drafts";
      const res = await fetch(url, {
        method: draftId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Could not save draft: ${err.error ?? res.statusText}`);
        return;
      }
      setSavedAt(new Date());
      // Brief visual confirmation, then go to drafts list
      setTimeout(() => {
        router.push("/for-pharmacies/dashboard/drafts");
      }, 600);
    } catch (e) {
      alert(`Could not save draft: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={busy}
      className={
        "inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-sm font-medium transition-colors disabled:opacity-50 " +
        className
      }
      title="Save what you've entered so far. The pharmacist can finish it later."
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4v16l7-3.5L19 20V4a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
      </svg>
      {busy ? "Saving…" : savedAt ? "Saved" : "Save as draft"}
    </button>
  );
}
