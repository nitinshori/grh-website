'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ── Types ───────────────────────────────────────────────────────

interface Appointment {
  id: string
  pharmacyId: string
  startTime: string
  endTime: string
  status: 'available' | 'booked' | 'completed' | 'cancelled' | 'no_show'
  patientName: string | null
  patientPhone: string | null
  patientEmail: string | null
  notes: string | null
  createdAt: string
}

type ModalMode = 'create' | 'edit' | 'book' | null

// ── Helpers ─────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

function toLocalISO(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', dot: 'bg-teal-500' },
  booked: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-400', dot: 'bg-gray-400' },
  no_show: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

// ── Component ───────────────────────────────────────────────────

export default function AppointmentDiary() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formStatus, setFormStatus] = useState<Appointment['status']>('available')
  const [formPatientName, setFormPatientName] = useState('')
  const [formPatientPhone, setFormPatientPhone] = useState('')
  const [formPatientEmail, setFormPatientEmail] = useState('')
  const [formNotes, setFormNotes] = useState('')

  // Batch slot creation
  const [showBatch, setShowBatch] = useState(false)
  const [batchDate, setBatchDate] = useState('')
  const [batchStartHour, setBatchStartHour] = useState('09:00')
  const [batchEndHour, setBatchEndHour] = useState('17:00')
  const [batchDuration, setBatchDuration] = useState(15)

  // weekEnd / days must be memoised — deriving them inline would create a
  // fresh Date object on every render, which would re-trigger fetchAppointments
  // (→ loading=true forever, the bug we hit on launch day).
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  // ── Fetch ─────────────────────────────────────────────────────

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/appointments?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`
      )
      if (!res.ok) throw new Error('Failed to load appointments')
      const data = await res.json()
      setAppointments(data.appointments || [])
    } catch {
      setError('Unable to load appointments.')
    } finally {
      setLoading(false)
    }
  }, [weekStart, weekEnd])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // ── Navigation ────────────────────────────────────────────────

  function goToday() {
    setWeekStart(startOfWeek(new Date()))
  }
  function goPrev() {
    setWeekStart(addDays(weekStart, -7))
  }
  function goNext() {
    setWeekStart(addDays(weekStart, 7))
  }

  // ── Modal helpers ─────────────────────────────────────────────

  function openCreate(day: Date) {
    const start = new Date(day)
    start.setHours(9, 0, 0, 0)
    const end = new Date(day)
    end.setHours(9, 15, 0, 0)
    setFormStart(toLocalISO(start))
    setFormEnd(toLocalISO(end))
    setFormStatus('available')
    setFormPatientName('')
    setFormPatientPhone('')
    setFormPatientEmail('')
    setFormNotes('')
    setSelectedAppt(null)
    setModalMode('create')
  }

  function openEdit(appt: Appointment) {
    setFormStart(toLocalISO(new Date(appt.startTime)))
    setFormEnd(toLocalISO(new Date(appt.endTime)))
    setFormStatus(appt.status)
    setFormPatientName(appt.patientName || '')
    setFormPatientPhone(appt.patientPhone || '')
    setFormPatientEmail(appt.patientEmail || '')
    setFormNotes(appt.notes || '')
    setSelectedAppt(appt)
    setModalMode(appt.status === 'available' ? 'book' : 'edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedAppt(null)
  }

  // ── CRUD ──────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: formStart,
            endTime: formEnd,
            status: formStatus,
            patientName: formPatientName || undefined,
            patientPhone: formPatientPhone || undefined,
            patientEmail: formPatientEmail || undefined,
            notes: formNotes || undefined,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || 'Failed to create')
        }
      } else if (selectedAppt) {
        const res = await fetch(`/api/appointments/${selectedAppt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: formStart,
            endTime: formEnd,
            status: formStatus,
            patientName: formPatientName,
            patientPhone: formPatientPhone,
            patientEmail: formPatientEmail,
            notes: formNotes,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          throw new Error(d.error || 'Failed to update')
        }
      }
      closeModal()
      fetchAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedAppt) return
    if (!confirm('Delete this appointment slot?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete')
      closeModal()
      fetchAppointments()
    } catch {
      setError('Failed to delete appointment')
    } finally {
      setSaving(false)
    }
  }

  // ── Batch create ──────────────────────────────────────────────

  async function handleBatchCreate() {
    if (!batchDate || !batchStartHour || !batchEndHour) return
    setSaving(true)
    setError(null)

    try {
      const [startH, startM] = batchStartHour.split(':').map(Number)
      const [endH, endM] = batchEndHour.split(':').map(Number)
      const baseDate = new Date(batchDate + 'T00:00:00')
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      const slots: { startTime: string; endTime: string }[] = []

      for (let m = startMinutes; m + batchDuration <= endMinutes; m += batchDuration) {
        const s = new Date(baseDate)
        s.setHours(Math.floor(m / 60), m % 60, 0, 0)
        const e = new Date(baseDate)
        e.setHours(Math.floor((m + batchDuration) / 60), (m + batchDuration) % 60, 0, 0)
        slots.push({ startTime: s.toISOString(), endTime: e.toISOString() })
      }

      // Create all slots in parallel
      const results = await Promise.all(
        slots.map((slot) =>
          fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...slot, status: 'available' }),
          })
        )
      )

      const failed = results.filter((r) => !r.ok).length
      if (failed > 0) {
        setError(`${failed} of ${slots.length} slots failed to create`)
      }

      setShowBatch(false)
      fetchAppointments()
    } catch {
      setError('Failed to create batch slots')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────

  const todayStr = new Date().toDateString()

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Diary</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your pharmacy&apos;s appointment slots and patient bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBatchDate(new Date().toISOString().split('T')[0])
              setShowBatch(true)
            }}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#25b4b4' }}
          >
            + Add Slots
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-6">
        <button
          onClick={goPrev}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous week"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            {formatDate(weekStart)} &mdash; {formatDate(addDays(weekStart, 6))}
          </span>
          <button
            onClick={goToday}
            className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={goNext}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Next week"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
        {/* Empty state — onboarding guidance for new pharmacies */}
        {appointments.length === 0 && (
          <div className="bg-white rounded-xl border border-dashed border-teal-300 shadow-sm p-8 text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No appointment slots this week
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Create your first available slots so patients can book consultations.
              Use <strong>Add Slots</strong> to generate a full day of evenly
              spaced slots in one go, or click <strong>+ Add</strong> on any day
              below to add individual slots.
            </p>
            <button
              onClick={() => {
                setBatchDate(new Date().toISOString().split('T')[0])
                setShowBatch(true)
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#25b4b4' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Slots
            </button>
          </div>
        )}

        {/* Weekly grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const isToday = day.toDateString() === todayStr
            const dayAppts = appointments
              .filter((a) => isSameDay(new Date(a.startTime), day))
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

            return (
              <div
                key={day.toISOString()}
                className={`bg-white rounded-xl border shadow-sm min-h-[200px] ${
                  isToday ? 'border-teal-400 ring-2 ring-teal-100' : 'border-gray-200'
                }`}
              >
                {/* Day header */}
                <div
                  className={`px-3 py-2 border-b text-center ${
                    isToday
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      isToday ? 'text-teal-700' : 'text-gray-500'
                    }`}
                  >
                    {new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(day)}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isToday ? 'text-teal-800' : 'text-gray-900'
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </div>

                {/* Appointment slots */}
                <div className="p-2 space-y-1.5">
                  {dayAppts.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-4">No slots</p>
                  ) : (
                    dayAppts.map((appt) => {
                      const colors = STATUS_COLORS[appt.status] || STATUS_COLORS.available
                      return (
                        <button
                          key={appt.id}
                          onClick={() => openEdit(appt)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-all hover:shadow-sm ${colors.bg}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                            <span className={`font-semibold ${colors.text}`}>
                              {formatTime(appt.startTime)}
                            </span>
                          </div>
                          {appt.patientName && (
                            <p className="text-gray-700 mt-0.5 truncate font-medium">
                              {appt.patientName}
                            </p>
                          )}
                          {!appt.patientName && appt.status === 'available' && (
                            <p className="text-teal-500 mt-0.5 italic">Open slot</p>
                          )}
                        </button>
                      )
                    })
                  )}
                  {/* Quick add */}
                  <button
                    onClick={() => openCreate(day)}
                    className="w-full text-center py-1.5 text-xs text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </>
      )}

      {/* Summary stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          {(['available', 'booked', 'completed', 'cancelled', 'no_show'] as const).map((s) => {
            const count = appointments.filter((a) => a.status === s).length
            const colors = STATUS_COLORS[s]
            return (
              <div
                key={s}
                className={`rounded-lg border px-4 py-3 text-center ${colors.bg}`}
              >
                <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
                <p className={`text-xs ${colors.text} opacity-75`}>{STATUS_LABELS[s]}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create/Edit Modal ───────────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'create'
                  ? 'Add Appointment Slot'
                  : modalMode === 'book'
                  ? 'Book This Slot'
                  : 'Edit Appointment'}
              </h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as Appointment['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              {/* Patient details */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={formPatientName}
                  onChange={(e) => setFormPatientName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formPatientPhone}
                    onChange={(e) => setFormPatientPhone(e.target.value)}
                    placeholder="07700 900000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formPatientEmail}
                    onChange={(e) => setFormPatientEmail(e.target.value)}
                    placeholder="patient@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Travel vaccines — needs yellow fever"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                {selectedAppt && (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: '#25b4b4' }}
                >
                  {saving
                    ? 'Saving…'
                    : modalMode === 'create'
                    ? 'Create Slot'
                    : modalMode === 'book'
                    ? 'Book Appointment'
                    : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch Slot Modal ─────────────────────────────────────── */}
      {showBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Add Multiple Slots
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Generate evenly spaced appointment slots for a day.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    First slot at
                  </label>
                  <input
                    type="time"
                    value={batchStartHour}
                    onChange={(e) => setBatchStartHour(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Last slot by
                  </label>
                  <input
                    type="time"
                    value={batchEndHour}
                    onChange={(e) => setBatchEndHour(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Slot duration
                </label>
                <select
                  value={batchDuration}
                  onChange={(e) => setBatchDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              {batchDate && (
                <p className="text-sm text-gray-500">
                  This will create{' '}
                  <strong>
                    {(() => {
                      const [sh, sm] = batchStartHour.split(':').map(Number)
                      const [eh, em] = batchEndHour.split(':').map(Number)
                      const totalMinutes = (eh * 60 + em) - (sh * 60 + sm)
                      return Math.max(0, Math.floor(totalMinutes / batchDuration))
                    })()}
                  </strong>{' '}
                  slots.
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowBatch(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchCreate}
                disabled={saving || !batchDate}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#25b4b4' }}
              >
                {saving ? 'Creating…' : 'Create Slots'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
