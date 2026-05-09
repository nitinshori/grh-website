'use client'

import { useEffect, useRef } from 'react'

/**
 * Persists form state to sessionStorage so data survives accidental tab closes
 * or navigation during a consultation. Clears on unmount or when the consultation
 * is completed (caller should call clearSaved()).
 *
 * @param key   Unique key per ePGD (e.g. 'epgd-meningitis-acwy')
 * @param state The current form state object
 * @param setState Function to restore state
 * @returns { clearSaved } — call when consultation is complete to clean up
 */
export function useFormPersistence<T>(
  key: string,
  state: T,
  setState: (val: T) => void
) {
  const hasRestored = useRef(false)

  // Restore on mount (once)
  useEffect(() => {
    if (hasRestored.current) return
    hasRestored.current = true
    try {
      const saved = sessionStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved) as T
        setState(parsed)
      }
    } catch {
      // Ignore parse errors
    }
  }, [key, setState])

  // Save on every state change (debounced via effect)
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Storage full or unavailable — fail silently
    }
  }, [key, state])

  function clearSaved() {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // Ignore
    }
  }

  return { clearSaved }
}
