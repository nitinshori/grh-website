'use client'

import { useRef, useCallback, useEffect } from 'react'

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
export function useConsultationTracking(pgdSlug: string, currentStep: number) {
  const consultationIdRef = useRef<string | null>(null)
  const hasStartedRef = useRef(false)
  const hasCompletedRef = useRef(false)
  const hasSavedRef = useRef(false)
  const isSavingRef = useRef(false)

  // Record start when user advances past step 0
  useEffect(() => {
    if (currentStep > 0 && !hasStartedRef.current) {
      hasStartedRef.current = true

      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pgdSlug, action: 'start' }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.consultationId) {
            consultationIdRef.current = data.consultationId
          }
        })
        .catch(() => {
          // Analytics should never block the user — silently fail
        })
    }
  }, [currentStep, pgdSlug])

  const markComplete = useCallback(() => {
    if (hasCompletedRef.current || !consultationIdRef.current) return

    hasCompletedRef.current = true

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pgdSlug,
        action: 'complete',
        consultationId: consultationIdRef.current,
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
      if (hasSavedRef.current || isSavingRef.current) return hasSavedRef.current
      isSavingRef.current = true

      try {
        const response = await fetch('/api/consultation-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consultationId: consultationIdRef.current,
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
          hasSavedRef.current = true
          return true
        }

        console.error('Failed to save consultation record:', await response.text())
        return false
      } catch (error) {
        console.error('Error saving consultation record:', error)
        return false
      } finally {
        isSavingRef.current = false
      }
    },
    [pgdSlug]
  )

  return {
    markComplete,
    saveRecord,
    consultationId: consultationIdRef.current,
  }
}
