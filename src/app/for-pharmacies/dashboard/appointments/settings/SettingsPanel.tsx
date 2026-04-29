'use client'

import { useState, useEffect } from 'react'

// ── Types ───────────────────────────────────────────────────────

interface AppointmentType {
  id: string
  name: string
  durationMinutes: number
  requiresDetails: boolean
  color: string
  isActive: boolean
}

interface Clinician {
  id: string
  name: string
  gphcNumber: string | null
  role: string | null
  isActive: boolean
}

interface Availability {
  id: string
  clinicianId: string
  clinicianName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ── Component ───────────────────────────────────────────────────

export default function SettingsPanel() {
  const [tab, setTab] = useState<'types' | 'clinicians' | 'availability'>('types')
  const [types, setTypes] = useState<AppointmentType[]>([])
  const [clinicianList, setClinicianList] = useState<Clinician[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDuration, setNewTypeDuration] = useState(15)
  const [newTypeDetails, setNewTypeDetails] = useState(false)

  const [newClinicianName, setNewClinicianName] = useState('')
  const [newClinicianGphc, setNewClinicianGphc] = useState('')
  const [newClinicianRole, setNewClinicianRole] = useState('Pharmacist')

  const [newAvailClinician, setNewAvailClinician] = useState('')
  const [newAvailDay, setNewAvailDay] = useState(1)
  const [newAvailStart, setNewAvailStart] = useState('09:00')
  const [newAvailEnd, setNewAvailEnd] = useState('17:00')

  // ── Fetch ─────────────────────────────────────────────────────

  async function fetchAll() {
    setLoading(true)
    try {
      const [typesRes, clinRes, availRes] = await Promise.all([
        fetch('/api/appointments/types'),
        fetch('/api/appointments/clinicians'),
        fetch('/api/appointments/availability'),
      ])
      const typesData = await typesRes.json()
      const clinData = await clinRes.json()
      const availData = await availRes.json()

      setTypes(typesData.types || [])
      setClinicianList(clinData.clinicians || [])
      setAvailability(availData.availability || [])
    } catch {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // ── Add handlers ──────────────────────────────────────────────

  async function addType(e: React.FormEvent) {
    e.preventDefault()
    if (!newTypeName) return
    try {
      const res = await fetch('/api/appointments/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTypeName,
          durationMinutes: newTypeDuration,
          requiresDetails: newTypeDetails,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setNewTypeName('')
      setNewTypeDuration(15)
      setNewTypeDetails(false)
      fetchAll()
    } catch {
      setError('Failed to add appointment type')
    }
  }

  async function addClinician(e: React.FormEvent) {
    e.preventDefault()
    if (!newClinicianName) return
    try {
      const res = await fetch('/api/appointments/clinicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClinicianName,
          gphcNumber: newClinicianGphc || undefined,
          role: newClinicianRole,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setNewClinicianName('')
      setNewClinicianGphc('')
      fetchAll()
    } catch {
      setError('Failed to add clinician')
    }
  }

  async function addAvailability(e: React.FormEvent) {
    e.preventDefault()
    if (!newAvailClinician) return
    try {
      const res = await fetch('/api/appointments/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicianId: newAvailClinician,
          dayOfWeek: newAvailDay,
          startTime: newAvailStart,
          endTime: newAvailEnd,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      fetchAll()
    } catch {
      setError('Failed to add availability')
    }
  }

  async function removeAvailability(id: string) {
    try {
      await fetch(`/api/appointments/availability?id=${id}`, { method: 'DELETE' })
      fetchAll()
    } catch {
      setError('Failed to remove')
    }
  }

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your services, clinicians, and their weekly availability.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {(['types', 'clinicians', 'availability'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'types' ? 'Appointment Types' : t === 'clinicians' ? 'Clinicians' : 'Availability'}
          </button>
        ))}
      </div>

      {/* ── Appointment Types ──────────────────────────────────── */}
      {tab === 'types' && (
        <div className="space-y-4">
          {types.map((type) => (
            <div key={type.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{type.name}</p>
                <p className="text-sm text-gray-500">{type.durationMinutes} minutes</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${type.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                {type.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}

          <form onSubmit={addType} className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Add appointment type</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Travel Consultation"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <select
                value={newTypeDuration}
                onChange={(e) => setNewTypeDuration(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reqDetails"
                checked={newTypeDetails}
                onChange={(e) => setNewTypeDetails(e.target.checked)}
              />
              <label htmlFor="reqDetails" className="text-sm text-gray-600">
                Ask patient for additional details
              </label>
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg"
              style={{ backgroundColor: '#25b4b4' }}
            >
              Add Type
            </button>
          </form>
        </div>
      )}

      {/* ── Clinicians ─────────────────────────────────────────── */}
      {tab === 'clinicians' && (
        <div className="space-y-4">
          {clinicianList.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{c.name}</p>
                <p className="text-sm text-gray-500">
                  {c.role}{c.gphcNumber ? ` — GPhC ${c.gphcNumber}` : ''}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                {c.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}

          <form onSubmit={addClinician} className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Add clinician</h3>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={newClinicianName}
                onChange={(e) => setNewClinicianName(e.target.value)}
                placeholder="Full name"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                type="text"
                value={newClinicianGphc}
                onChange={(e) => setNewClinicianGphc(e.target.value)}
                placeholder="GPhC number"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={newClinicianRole}
                onChange={(e) => setNewClinicianRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Pharmacist">Pharmacist</option>
                <option value="Technician">Technician</option>
                <option value="Independent Prescriber">Independent Prescriber</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg"
              style={{ backgroundColor: '#25b4b4' }}
            >
              Add Clinician
            </button>
          </form>
        </div>
      )}

      {/* ── Availability ───────────────────────────────────────── */}
      {tab === 'availability' && (
        <div className="space-y-4">
          {DAY_NAMES.map((dayName, dayIdx) => {
            const daySlots = availability.filter((a) => a.dayOfWeek === dayIdx)
            if (daySlots.length === 0) return null
            return (
              <div key={dayIdx} className="bg-white rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">{dayName}</h4>
                <div className="space-y-1">
                  {daySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {slot.clinicianName}: {slot.startTime} – {slot.endTime}
                      </span>
                      <button
                        onClick={() => removeAvailability(slot.id)}
                        className="text-red-500 hover:text-red-700 text-xs underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {availability.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No availability set. Add clinician schedules below.
            </p>
          )}

          <form onSubmit={addAvailability} className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Add availability</h3>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newAvailClinician}
                onChange={(e) => setNewAvailClinician(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="">Select clinician...</option>
                {clinicianList.filter((c) => c.isActive).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={newAvailDay}
                onChange={(e) => setNewAvailDay(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start time</label>
                <input
                  type="time"
                  value={newAvailStart}
                  onChange={(e) => setNewAvailStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End time</label>
                <input
                  type="time"
                  value={newAvailEnd}
                  onChange={(e) => setNewAvailEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!newAvailClinician}
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: '#25b4b4' }}
            >
              Add Availability
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
