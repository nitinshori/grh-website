'use client'

import { useState, useEffect } from 'react'

interface PharmacistProfile {
  name: string
  email: string
  role: string
  gphcNumber: string
  pharmacyName: string
  pharmacyAddress: string
}

/**
 * Fetches the logged-in pharmacist's profile (name, GPhC, pharmacy details)
 * for auto-filling the Summary step of ePGD consultations.
 */
export function usePharmacistProfile() {
  const [profile, setProfile] = useState<PharmacistProfile | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setProfile(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return profile
}
