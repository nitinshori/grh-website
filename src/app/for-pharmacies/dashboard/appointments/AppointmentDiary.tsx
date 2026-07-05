'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ── Types ───────────────────────────────────────────────────────

interface Appointment {
  id: string
  pharmacyId: string
  clinicianId: string | null
  appointmentTypeId: string | null
  bookedByStaffId: string | null
  startTime: string
  endTime: string
  status: 'available' | 'booked' | 'completed' | 'cancelled' | 'no_show'
  patientName: string | null
  patientDob: string | null
  patientPhone: string | null
  notes: string | null
  createdAt: string
}

interface Clinician {
  id: string
  name: string
  role?: string | null
}

interface Branch {
  id: string
  name: string
}

interface StaffMember {
  id: string
  name: string
}

interface ApptType {
  id: string
  name: string
  durationMinutes: number
  color: string | null
  isActive: boolean
}

type ModalMode = 'create' | 'edit' | null
type ViewMode = 'day' | 'week'

const LENGTH_OPTIONS = [15, 30, 45, 60]

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

function ymd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function hm(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function lengthMinutes(startIso: string, endIso: string): number {
  return Math.max(0, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000))
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  booked: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Booked' },
  completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Completed' },
  cancelled: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-400 line-through', dot: 'bg-gray-400', label: 'Cancelled' },
  no_show: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', dot: 'bg-red-500', label: 'No show' },
  available: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Unbooked' },
}

// ── Component ───────────────────────────────────────────────────

export default function AppointmentDiary() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clinicians, setClinicians] = useState<Clinician[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [apptTypes, setApptTypes] = useState<ApptType[]>([])
  const [ownPharmacyId, setOwnPharmacyId] = useState<string>('')
  const [branchFilter, setBranchFilter] = useState<string>('') // '' = all

  // Remember the last-used branch so switching diaries survives reloads.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('diary-branch')
      if (saved) setBranchFilter(saved)
    } catch {}
  }, [])
  const pickBranch = (id: string) => {
    setBranchFilter(id)
    try { localStorage.setItem('diary-branch', id) } catch {}
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Phones default to the day view — a stacked 7-day week is a lot of
  // scrolling on a shop floor. Set once on mount to avoid hydration
  // mismatches; the user can still toggle freely.
  useEffect(() => {
    if (window.innerWidth < 768) setViewMode('day')
  }, [])

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form fields
  const [fDate, setFDate] = useState('')          // YYYY-MM-DD
  const [fStart, setFStart] = useState('09:00')   // HH:MM
  const [fLength, setFLength] = useState(15)       // minutes
  const [fClinicianId, setFClinicianId] = useState('')
  const [fPharmacyId, setFPharmacyId] = useState('')
  const [fApptTypeId, setFApptTypeId] = useState('')
  const [fBookedById, setFBookedById] = useState('')
  const [fPatientName, setFPatientName] = useState('')
  const [fPatientDob, setFPatientDob] = useState('')
  const [fPatientPhone, setFPatientPhone] = useState('')
  const [fNotes, setFNotes] = useState('')
  const [fStatus, setFStatus] = useState<Appointment['status']>('booked')

  // Availability tool state
  const [availOpen, setAvailOpen] = useState(false)
  const [aPharmacyId, setAPharmacyId] = useState('')
  const [aDate, setADate] = useState('')
  const [aStart, setAStart] = useState('09:00')
  const [aEnd, setAEnd] = useState('17:00')
  const [aSlot, setASlot] = useState(15)
  const [aClinicianId, setAClinicianId] = useState('')
  const [aBusy, setABusy] = useState(false)
  const [aMsg, setAMsg] = useState<string | null>(null)

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate])
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  // Multi-branch groups (e.g. Pritchards Meliden + Victoria Road) get
  // branch chips, a filter row, and a branch picker in the modal.
  const multiBranch = branches.length > 1
  const branchName = useCallback(
    (id: string) => branches.find((b) => b.id === id)?.name ?? '',
    [branches]
  )
  const visibleAppointments = useMemo(
    () =>
      branchFilter
        ? appointments.filter((a) => a.pharmacyId === branchFilter)
        : appointments,
    [appointments, branchFilter]
  )

  const clinicianName = useCallback(
    (id: string | null) => (id ? clinicians.find((c) => c.id === id)?.name ?? 'Unknown clinician' : 'No clinician'),
    [clinicians]
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

  const fetchClinicians = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments/clinicians')
      if (!res.ok) return
      const data = await res.json()
      setClinicians(data.clinicians || [])
    } catch {
      /* non-fatal — dropdown just shows empty */
    }
  }, [])

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments/pharmacies')
      if (!res.ok) return
      const data = await res.json()
      setBranches(data.pharmacies || [])
      setOwnPharmacyId(data.ownPharmacyId || '')
    } catch {
      /* non-fatal — diary just behaves single-branch */
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments/staff')
      if (!res.ok) return
      const data = await res.json()
      setStaff(data.staff || [])
    } catch { /* non-fatal */ }
  }, [])

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments/types')
      if (!res.ok) return
      const data = await res.json()
      setApptTypes((data.types || []).filter((t: ApptType) => t.isActive !== false))
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => {
    fetchClinicians()
    fetchBranches()
    fetchStaff()
    fetchTypes()
  }, [fetchClinicians, fetchBranches, fetchStaff, fetchTypes])

  const staffName = useCallback(
    (id: string | null) => (id ? staff.find((s) => s.id === id)?.name ?? '' : ''),
    [staff]
  )
  const typeOf = useCallback(
    (id: string | null) => (id ? apptTypes.find((t) => t.id === id) ?? null : null),
    [apptTypes]
  )

  // ── Navigation ────────────────────────────────────────────────

  const step = viewMode === 'day' ? 1 : 7
  const goToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setSelectedDate(d)
  }
  const goPrev = () => setSelectedDate(addDays(selectedDate, -step))
  const goNext = () => setSelectedDate(addDays(selectedDate, step))

  // ── Modal helpers ─────────────────────────────────────────────

  function openCreate(day: Date) {
    setSelectedAppt(null)
    setFormError(null)
    setFDate(ymd(day))
    setFStart('09:00')
    setFLength(15)
    setFClinicianId(clinicians.length === 1 ? clinicians[0].id : '')
    // Default branch: the active filter if one is set, else the user's own
    setFPharmacyId(branchFilter || ownPharmacyId)
    setFApptTypeId(apptTypes.length === 1 ? apptTypes[0].id : '')
    setFBookedById('')
    setFPatientName('')
    setFPatientDob('')
    setFPatientPhone('')
    setFNotes('')
    setFStatus('booked')
    setModalMode('create')
  }

  function openEdit(appt: Appointment) {
    setSelectedAppt(appt)
    setFormError(null)
    setFDate(ymd(new Date(appt.startTime)))
    setFStart(hm(appt.startTime))
    setFLength(lengthMinutes(appt.startTime, appt.endTime) || 15)
    setFClinicianId(appt.clinicianId || '')
    setFPharmacyId(appt.pharmacyId)
    setFApptTypeId(appt.appointmentTypeId || '')
    setFBookedById(appt.bookedByStaffId || '')
    setFPatientName(appt.patientName || '')
    setFPatientDob(appt.patientDob || '')
    setFPatientPhone(appt.patientPhone || '')
    setFNotes(appt.notes || '')
    setFStatus(appt.status === 'available' ? 'booked' : appt.status)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedAppt(null)
    setFormError(null)
  }

  function buildTimes(): { start: Date; end: Date } | null {
    if (!fDate || !fStart) return null
    const [h, m] = fStart.split(':').map(Number)
    const start = new Date(`${fDate}T00:00:00`)
    if (isNaN(start.getTime())) return null
    start.setHours(h, m, 0, 0)
    const end = new Date(start.getTime() + fLength * 60000)
    return { start, end }
  }

  // ── Save / delete ─────────────────────────────────────────────

  async function handleSave() {
    // Required: patient name, DOB, clinician, length, and a valid time.
    if (!fPatientName.trim()) return setFormError('Patient name is required.')
    if (!fPatientDob) return setFormError('Patient date of birth is required.')
    if (!fClinicianId) return setFormError('Please choose a clinician.')
    if (apptTypes.length > 0 && !fApptTypeId) return setFormError('Please choose an appointment category.')
    if (staff.length > 0 && !fBookedById) return setFormError('Please choose who is booking this (Booked by).')
    if (!fLength) return setFormError('Please choose an appointment length.')
    const times = buildTimes()
    if (!times) return setFormError('Please set a valid date and start time.')

    setSaving(true)
    setFormError(null)
    setError(null)
    try {
      const payload = {
        clinicianId: fClinicianId,
        appointmentTypeId: fApptTypeId || undefined,
        bookedByStaffId: fBookedById || undefined,
        pharmacyId: fPharmacyId || undefined,
        startTime: times.start.toISOString(),
        endTime: times.end.toISOString(),
        status: fStatus,
        patientName: fPatientName.trim(),
        patientDob: fPatientDob,
        patientPhone: fPatientPhone.trim() || undefined,
        notes: fNotes.trim() || undefined,
      }

      const res =
        modalMode === 'create'
          ? await fetch('/api/appointments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/appointments/${selectedAppt!.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Could not save the appointment.')
      }
      closeModal()
      fetchAppointments()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedAppt) return
    if (!confirm('Delete this appointment? This cannot be undone.')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      closeModal()
      fetchAppointments()
    } catch {
      setFormError('Failed to delete appointment.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────

  const todayStr = new Date().toDateString()
  const noClinicians = clinicians.length === 0

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Diary</h1>
          <p className="text-gray-500 text-sm mt-1">
            Book patients in by time, length and clinician. Click a day to add an appointment.
          </p>
        </div>
        <button
          onClick={() => openCreate(new Date())}
          className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--tenant-primary)' }}
        >
          + Book appointment
        </button>
      </div>

      {noClinicians && !loading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 mb-6 text-sm">
          No clinicians are set up yet. Add clinicians in <strong>Settings</strong> before booking —
          every appointment needs a clinician.
        </div>
      )}

      {/* Date navigation + day/week toggle */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-2 sm:px-4 py-3 mb-4">
        <button onClick={goPrev} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label={viewMode === 'day' ? 'Previous day' : 'Previous week'}>
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          <span className="text-sm font-semibold text-gray-900">
            {viewMode === 'day'
              ? formatDate(selectedDate)
              : <>{formatDate(weekStart)} &mdash; {formatDate(addDays(weekStart, 6))}</>}
          </span>
          <button
            onClick={goToday}
            className="text-xs px-3 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-xs font-medium">
            {(['day', 'week'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 transition-colors ${
                  viewMode === m ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                style={viewMode === m ? { backgroundColor: 'var(--tenant-primary)' } : undefined}
              >
                {m === 'day' ? 'Day' : 'Week'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={goNext} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label={viewMode === 'day' ? 'Next day' : 'Next week'}>
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Branch filter — only for multi-site groups */}
      {multiBranch && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => pickBranch('')}
            className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors ${
              branchFilter === '' ? 'text-white border-transparent shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
            style={branchFilter === '' ? { backgroundColor: 'var(--tenant-primary)' } : undefined}
          >
            Both diaries
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => pickBranch(b.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap transition-colors ${
                branchFilter === b.id ? 'text-white border-transparent shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
              style={branchFilter === b.id ? { backgroundColor: 'var(--tenant-primary)' } : undefined}
            >
              {b.name}
            </button>
          ))}
          <button
            onClick={() => {
              setAPharmacyId(branchFilter || ownPharmacyId)
              setADate(ymd(selectedDate))
              setAMsg(null)
              setAvailOpen(true)
            }}
            className="ml-auto px-4 py-2 rounded-full text-sm font-semibold border border-dashed whitespace-nowrap transition-colors bg-white hover:bg-gray-50"
            style={{ borderColor: 'var(--tenant-primary)', color: 'var(--tenant-primary)' }}
          >
            ⚡ Set availability
          </button>
        </div>
      )}
      {!multiBranch && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setAPharmacyId(ownPharmacyId)
              setADate(ymd(selectedDate))
              setAMsg(null)
              setAvailOpen(true)
            }}
            className="px-4 py-2 rounded-full text-sm font-semibold border border-dashed whitespace-nowrap transition-colors bg-white hover:bg-gray-50"
            style={{ borderColor: 'var(--tenant-primary)', color: 'var(--tenant-primary)' }}
          >
            ⚡ Set availability
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-[3px] border-[color:var(--tenant-primary)]/30 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className={viewMode === 'day' ? '' : 'grid grid-cols-1 md:grid-cols-7 gap-3'}>
          {(viewMode === 'day' ? [selectedDate] : days).map((day) => {
            const isToday = day.toDateString() === todayStr
            const dayAppts = visibleAppointments
              .filter((a) => isSameDay(new Date(a.startTime), day))
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            const dayView = viewMode === 'day'

            return (
              <div
                key={day.toISOString()}
                className={`bg-white rounded-xl border shadow-sm flex flex-col ${
                  dayView ? 'min-h-[300px]' : 'min-h-[200px]'
                } ${
                  isToday ? 'border-[color:var(--tenant-primary)]/40 ring-2 ring-[color:var(--tenant-primary)]/30' : 'border-gray-200'
                }`}
              >
                {/* Day header */}
                <div
                  className={`px-3 py-2 border-b text-center ${
                    isToday
                      ? 'bg-[color:var(--tenant-primary)]/10 border-[color:var(--tenant-primary)]/30'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-[color:var(--tenant-primary)]' : 'text-gray-500'}`}>
                    {new Intl.DateTimeFormat('en-GB', { weekday: dayView ? 'long' : 'short' }).format(day)}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-[color:var(--tenant-primary)]' : 'text-gray-900'}`}>
                    {dayView
                      ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(day)
                      : day.getDate()}
                  </p>
                </div>

                {/* Appointments */}
                <div className="p-2 space-y-1.5 flex-1">
                  {dayAppts.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center py-4">No appointments</p>
                  ) : (
                    dayAppts.map((appt) => {
                      const s = STATUS_STYLES[appt.status] || STATUS_STYLES.booked
                      const len = lengthMinutes(appt.startTime, appt.endTime)
                      return (
                        <button
                          key={appt.id}
                          onClick={() => openEdit(appt)}
                          className={`w-full text-left rounded-lg border transition-all hover:shadow-sm ${s.bg} ${
                            dayView ? 'px-3 py-2.5 text-sm' : 'px-2.5 py-2 text-xs'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                            <span className={`font-semibold ${s.text}`}>
                              {formatTime(appt.startTime)}–{formatTime(appt.endTime)}
                            </span>
                            <span className="text-gray-400 ml-auto">{len}m</span>
                          </div>
                          <p className={`mt-0.5 truncate font-semibold ${appt.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {appt.patientName || 'Unnamed patient'}
                          </p>
                          {typeOf(appt.appointmentTypeId) && (
                            <p className="truncate flex items-center gap-1">
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: typeOf(appt.appointmentTypeId)?.color || '#9ca3af' }}
                              />
                              <span className="text-gray-600">{typeOf(appt.appointmentTypeId)?.name}</span>
                            </p>
                          )}
                          <p className="text-gray-500 truncate">{clinicianName(appt.clinicianId)}</p>
                          {staffName(appt.bookedByStaffId) && (
                            <p className="text-gray-400 truncate">booked by {staffName(appt.bookedByStaffId)}</p>
                          )}
                          {multiBranch && !branchFilter && branchName(appt.pharmacyId) && (
                            <p className="truncate">
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-white/70 border border-gray-200 text-[10px] font-medium text-gray-600">
                                {branchName(appt.pharmacyId)}
                              </span>
                            </p>
                          )}
                          {appt.notes && (
                            <p className="text-gray-400 truncate italic">{appt.notes}</p>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Add on this day */}
                <button
                  onClick={() => openCreate(day)}
                  className={`m-2 mt-0 text-xs font-medium text-[color:var(--tenant-primary)] hover:bg-[color:var(--tenant-primary)]/10 rounded-lg transition-colors ${
                    dayView ? 'py-2.5 text-sm' : 'py-1.5'
                  }`}
                >
                  + Book
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {(['booked', 'completed', 'cancelled', 'no_show'] as const).map((st) => {
            const count = visibleAppointments.filter((a) => a.status === st).length
            const s = STATUS_STYLES[st]
            return (
              <div key={st} className={`rounded-lg border px-4 py-3 text-center ${s.bg}`}>
                <p className={`text-2xl font-bold ${s.text}`}>{count}</p>
                <p className={`text-xs ${s.text} opacity-75`}>{s.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Set Availability Modal ───────────────────────────────── */}
      {availOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Set availability</h2>
              <p className="text-xs text-gray-500 mt-1">
                Creates bookable slots for a day — pick the branch, hours and slot length.
                Times that already have appointments are skipped.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {multiBranch && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Pharmacy <span className="text-red-500">*</span></label>
                  <select
                    value={aPharmacyId}
                    onChange={(e) => setAPharmacyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Day <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={aDate}
                  onChange={(e) => setADate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                  <input
                    type="time"
                    step={900}
                    value={aStart}
                    onChange={(e) => setAStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Until</label>
                  <input
                    type="time"
                    step={900}
                    value={aEnd}
                    onChange={(e) => setAEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slot length</label>
                <div className="grid grid-cols-4 gap-2">
                  {LENGTH_OPTIONS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setASlot(min)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        aSlot === min ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      style={aSlot === min ? { backgroundColor: 'var(--tenant-primary)' } : undefined}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Clinician <span className="text-gray-400">(optional — set later when booking)</span></label>
                <select
                  value={aClinicianId}
                  onChange={(e) => setAClinicianId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                >
                  <option value="">No clinician yet</option>
                  {clinicians.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.role ? ` — ${c.role}` : ''}</option>
                  ))}
                </select>
              </div>
              {aMsg && <p className="text-sm text-gray-700">{aMsg}</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setAvailOpen(false)}
                disabled={aBusy}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  if (!aPharmacyId || !aDate) { setAMsg('Pick a pharmacy and a day.'); return }
                  setABusy(true)
                  setAMsg(null)
                  try {
                    const res = await fetch('/api/appointments/bulk', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        pharmacyId: aPharmacyId,
                        date: aDate,
                        startTime: aStart,
                        endTime: aEnd,
                        slotMinutes: aSlot,
                        clinicianId: aClinicianId || undefined,
                      }),
                    })
                    const d = await res.json()
                    if (!res.ok) throw new Error(d.error || 'Failed')
                    setAMsg(`✓ Created ${d.created} slot${d.created === 1 ? '' : 's'}${d.skipped ? ` (${d.skipped} skipped — already busy)` : ''}. Add another day or close.`)
                    fetchAppointments()
                  } catch (err) {
                    setAMsg(err instanceof Error ? err.message : 'Something went wrong.')
                  } finally {
                    setABusy(false)
                  }
                }}
                disabled={aBusy}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: 'var(--tenant-primary)' }}
              >
                {aBusy ? 'Creating…' : 'Create slots'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Modal ────────────────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {modalMode === 'create' ? 'Book appointment' : 'Edit appointment'}
              </h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Date + start time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={fDate}
                    onChange={(e) => setFDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start time</label>
                  <input
                    type="time"
                    step={900}
                    value={fStart}
                    onChange={(e) => setFStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  />
                </div>
              </div>

              {/* Length */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Length <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-4 gap-2">
                  {LENGTH_OPTIONS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setFLength(min)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        fLength === min
                          ? 'text-white border-transparent'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      style={fLength === min ? { backgroundColor: 'var(--tenant-primary)' } : undefined}
                    >
                      {min}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch — only shown for multi-site groups */}
              {multiBranch && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Branch <span className="text-red-500">*</span></label>
                  <select
                    value={fPharmacyId}
                    onChange={(e) => setFPharmacyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Appointment category */}
              {apptTypes.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category <span className="text-red-500">*</span></label>
                  <div className="grid gap-2">
                    {apptTypes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setFApptTypeId(t.id)
                          if (t.durationMinutes) setFLength(t.durationMinutes)
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border text-left transition-colors ${
                          fApptTypeId === t.id
                            ? 'text-white border-transparent'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        style={fApptTypeId === t.id ? { backgroundColor: t.color || 'var(--tenant-primary)' } : undefined}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: fApptTypeId === t.id ? 'white' : (t.color || '#9ca3af') }}
                        />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Booked by */}
              {staff.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Booked by <span className="text-red-500">*</span></label>
                  <select
                    value={fBookedById}
                    onChange={(e) => setFBookedById(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  >
                    <option value="">Who is making this booking?</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clinician */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Clinician <span className="text-red-500">*</span></label>
                <select
                  value={fClinicianId}
                  onChange={(e) => setFClinicianId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                >
                  <option value="">Select a clinician…</option>
                  {clinicians.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.role ? ` — ${c.role}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Patient name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Patient name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={fPatientName}
                  onChange={(e) => setFPatientName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                />
              </div>

              {/* DOB + phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date of birth <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={fPatientDob}
                    onChange={(e) => setFPatientDob(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone <span className="text-gray-400">(optional)</span></label>
                  <input
                    type="tel"
                    value={fPatientPhone}
                    onChange={(e) => setFPatientPhone(e.target.value)}
                    placeholder="07700 900000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  />
                </div>
              </div>

              {/* Reason / notes (free text — no service type list) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Appointment / reason <span className="text-gray-400">(optional)</span></label>
                <textarea
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Travel vaccines — yellow fever; or BP review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] resize-none"
                />
              </div>

              {/* Status (edit only) */}
              {modalMode === 'edit' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value as Appointment['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)]"
                  >
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No show</option>
                  </select>
                </div>
              )}

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                {modalMode === 'edit' && (
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
                  style={{ backgroundColor: 'var(--tenant-primary)' }}
                >
                  {saving ? 'Saving…' : modalMode === 'create' ? 'Book appointment' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
