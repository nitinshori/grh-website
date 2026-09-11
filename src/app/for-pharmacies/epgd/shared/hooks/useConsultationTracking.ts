'use client'

import { useCallback, useEffect } from 'react'

/**
 * Data shape for saving a consultation record.
 * Each ePGD extracts these from its own state before calling saveRecord().
 */
export interface ConsultationRecordData {
  patient: {
    firstName: string
    lastName: string
    dateOfBirth: string
    nhsNumber?: string
    phone?: string
    email?: string
    address?: string
    gpName?: string
    gpPractice?: string
    gpAddress?: string
    gpPhone?: string
    gpEmail?: string
    gpOdsCode?: string
  }
  clinicalData: Record<string, unknown> // the full ePGD state
  outcome?: 'completed' | 'referred' | 'not_supplied'
  medicine?: {
    name?: string
    medicine?: string
    dose?: string
    duration?: string
    quantity?: string | number
  }
  summary: {
    pharmacistName: string
    pharmacistGPhC: string
    pharmacyName?: string
    pharmacyAddress?: string
    consultationDate?: string
    consultationTime?: string
    clinicalNotes?: string
  }
  /** Optional top-level consent — surfaced so the server can read notifyGp etc.
   *  Each ePGD should pass at minimum { notifyGp } when the patient consented. */
  consent?: {
    notifyGp?: boolean
  }
}

/**
 * Lightweight hook to track consultation start, completion, and record saving.
 *
 * Usage in any ePGD tool:
 *   const { markComplete, saveRecord, isSaving, isSaved } =
 *     useConsultationTracking(pgdSlug, currentStep)
 *
 * - Automatically records a 'start' event when currentStep first exceeds 0
 * - Call markComplete() on the final step (e.g. when Print is clicked)
 * - Call saveRecord(data) to persist clinical data to the database
 */
/**
 * One consultation, one row.
 *
 * The tracking state lives in a module-level store keyed by PGD slug, not in
 * the hook's own refs. Most tools render a SEPARATE <StepWrapper> per step,
 * so moving to the next step unmounts one wrapper and mounts the next: with
 * per-instance refs the hook was recreated at every step and posted another
 * 'start'. One MenACWY consultation on 11 September 2026 wrote seven "started"
 * rows seconds apart and completed the last, which is why the dashboard read
 * 269 started against 43 completed (about one row per step) instead of the
 * real figure of roughly 45 consultations, nearly all completed.
 *
 * Keyed by slug rather than by component instance so the state survives those
 * remounts. reset() clears the entry, and StepWrapper calls it on New
 * Consultation and when the flow returns to step 0, so the next patient gets
 * a new row.
 */
interface TrackingEntry {
  consultationId: string | null
  started: boolean
  completed: boolean
  saved: boolean
  saving: boolean
}

const store = new Map<string, TrackingEntry>()

function entryFor(pgdSlug: string): TrackingEntry {
  let e = store.get(pgdSlug)
  if (!e) {
    e = { consultationId: null, started: false, completed: false, saved: false, saving: false }
    store.set(pgdSlug, e)
  }
  return e
}

export function useConsultationTracking(pgdSlug: string, currentStep: number) {
  // Back at step 0 after a consultation was completed or saved means the next
  // patient, so the entry is cleared here rather than relying on the "New
  // Consultation" button: in a tool with one StepWrapper per step, the button
  // lives on an instance that is no longer mounted. Going back to step 0
  // mid-consultation (nothing completed, nothing saved) keeps the same row.
  useEffect(() => {
    if (currentStep === 0) {
      const entry = store.get(pgdSlug)
      if (entry && (entry.completed || entry.saved)) store.delete(pgdSlug)
    }
  }, [currentStep, pgdSlug])

  // Record start when user advances past step 0
  useEffect(() => {
    const entry = entryFor(pgdSlug)
    if (currentStep > 0 && !entry.started) {
      entry.started = true

      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pgdSlug, action: 'start' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.consultationId) {
            entry.consultationId = data.consultationId
          }
        })
        .catch(() => {
          // Analytics should never block the user — silently fail
        })
    }
  }, [currentStep, pgdSlug])

  const markComplete = useCallback(() => {
    const entry = entryFor(pgdSlug)
    if (entry.completed || !entry.consultationId) return

    entry.completed = true

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pgdSlug,
        action: 'complete',
        consultationId: entry.consultationId,
      }),
    }).catch(() => {
      // Silent fail — analytics should never block consultation workflow
    })
  }, [pgdSlug])

  /**
   * Save the full consultation record to the database.
   * Returns true if save was successful, false otherwise.
   */
  const saveRecord = useCallback(
    async (data: ConsultationRecordData): Promise<boolean> => {
      const entry = entryFor(pgdSlug)
      if (entry.saved || entry.saving) return entry.saved
      entry.saving = true

      try {
        const response = await fetch('/api/consultation-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consultationId: entry.consultationId,
            pgdSlug,
            patient: data.patient,
            clinicalData: data.clinicalData,
            outcome: data.outcome || 'completed',
            medicine: data.medicine,
            summary: data.summary,
            consent: data.consent,
          }),
        })

        if (response.ok) {
          entry.saved = true
          return true
        }

        console.error('Failed to save consultation record:', await response.text())
        return false
      } catch (error) {
        console.error('Error saving consultation record:', error)
        return false
      } finally {
        entry.saving = false
      }
    },
    [pgdSlug]
  )

  /**
   * Forget the current consultation so the next patient is saved. Without
   * this, hasSavedRef stayed true for the life of the component and every
   * consultation after the first in a session showed "saved" without a POST
   * (adversarial review, 11 Sep 2026).
   */
  const reset = useCallback(() => {
    store.delete(pgdSlug)
  }, [pgdSlug])

  return {
    markComplete,
    saveRecord,
    reset,
    consultationId: entryFor(pgdSlug).consultationId,
  }
}
