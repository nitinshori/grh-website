'use client'

import { useRef, useCallback, useEffect } from 'react'

/**
 * Lightweight hook to track consultation start & completion.
 *
 * Usage in any ePGD tool:
 *   const { markComplete } = useConsultationTracking(pgdSlug, currentStep)
 *
 * - Automatically records a 'start' event when currentStep first exceeds 0
 * - Call markComplete() on the final step (e.g. when Print is clicked)
 */
export function useConsultationTracking(pgdSlug: string, currentStep: number) {
  const consultationIdRef = useRef<string | null>(null)
  const hasStartedRef = useRef(false)
  const hasCompletedRef = useRef(false)

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

  return { markComplete }
}
