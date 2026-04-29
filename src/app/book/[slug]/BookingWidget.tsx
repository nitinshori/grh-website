'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ───────────────────────────────────────────────────────

interface Site {
  id: string
  name: string
  address: string | null
  phone: string | null
}

interface AppointmentType {
  id: string
  name: string
  durationMinutes: number
  requiresDetails: boolean
}

interface ClinicianInfo {
  id: string
  name: string
  role: string | null
}

interface Slot {
  clinicianId: string
  clinicianName: string
  startTime: string
  endTime: string
}

interface BookingConfig {
  brandName: string
  brandColor: string
  sites: Site[]
  appointmentTypes: AppointmentType[]
  clinicians: ClinicianInfo[]
}

interface ConfirmationData {
  siteName: string
  siteAddress: string
  clinicianName: string
  appointmentType: string
  formattedTime: string
  durationMinutes: number
}

type Step = 'loading' | 'location' | 'service' | 'datetime' | 'details' | 'submitting' | 'confirmed'

// ── Helpers ─────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d)
}

function getNextDays(count: number): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 1; i <= count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${day}`)
  }
  return days
}

// ── Component ───────────────────────────────────────────────────

export default function BookingWidget({
  slug,
  brandColor,
}: {
  slug: string
  brandColor: string
}) {
  const [step, setStep] = useState<Step>('loading')
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Selections
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Patient form
  const [firstName, setFirstName] = useState('')
  const [surname, setSurname] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [serviceDetails, setServiceDetails] = useState('')
  const [emailConfirmation, setEmailConfirmation] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)

  // Confirmation
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null)

  // Available dates
  const availableDates = getNextDays(21)

  // ── Load config ───────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/booking/${slug}/services`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setConfig(data)
        // If only one site, skip location step
        if (data.sites.length === 1) {
          setSelectedSite(data.sites[0])
          setStep('service')
        } else {
          setStep('location')
        }
      } catch {
        setError('Unable to load booking information.')
        setStep('location')
      }
    }
    load()
  }, [slug])

  // ── Fetch slots ───────────────────────────────────────────────

  const fetchSlots = useCallback(
    async (date: string) => {
      if (!selectedSite || !selectedType) return
      setLoadingSlots(true)
      setSlots([])
      setSelectedSlot(null)
      setError(null)
      try {
        const res = await fetch(
          `/api/booking/${slug}/slots?siteId=${selectedSite.id}&typeId=${selectedType.id}&date=${date}`
        )
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setSlots(data.slots || [])
      } catch {
        setError('Unable to load available times.')
      } finally {
        setLoadingSlots(false)
      }
    },
    [slug, selectedSite, selectedType]
  )

  useEffect(() => {
    if (selectedDate && step === 'datetime') {
      fetchSlots(selectedDate)
    }
  }, [selectedDate, step, fetchSlots])

  // ── Submit ────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !firstName || !surname || !dob || !phone || !consentGiven) return

    setStep('submitting')
    setError(null)

    try {
      const res = await fetch(`/api/booking/${slug}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite!.id,
          appointmentTypeId: selectedType!.id,
          clinicianId: selectedSlot.clinicianId,
          startTime: selectedSlot.startTime,
          firstName,
          surname,
          dob,
          phone,
          email: email || undefined,
          serviceDetails: serviceDetails || undefined,
          consentGiven,
          emailConfirmation,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError('That time slot has just been taken. Please pick another.')
          setStep('datetime')
          fetchSlots(selectedDate)
          return
        }
        throw new Error(data.error || 'Booking failed')
      }

      setConfirmation(data.appointment)
      setStep('confirmed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStep('details')
    }
  }

  // ── Stepper ───────────────────────────────────────────────────

  const stepLabels = ['Location', 'Service', 'Date & Time', 'Your Details']
  const stepMap: Record<string, number> = { location: 0, service: 1, datetime: 2, details: 3 }
  const currentStepIdx = stepMap[step] ?? -1

  // ── Render: Loading ───────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${brandColor} transparent ${brandColor} ${brandColor}` }}
        />
        <p className="mt-4 text-gray-500 text-sm">Loading...</p>
      </div>
    )
  }

  // ── Render: Confirmed ─────────────────────────────────────────

  if (step === 'confirmed' && confirmation) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8" style={{ color: brandColor }}>
          <h1 className="text-2xl font-bold">{config?.brandName}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: brandColor + '15' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: brandColor }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked</h2>
          <p className="text-gray-500 mb-6">Your appointment has been confirmed.</p>

          <div
            className="rounded-xl p-5 mb-6 text-left space-y-2"
            style={{ backgroundColor: brandColor + '10', border: `1px solid ${brandColor}30` }}
          >
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">When</span>
              <span className="text-sm font-semibold text-gray-900">{confirmation.formattedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Duration</span>
              <span className="text-sm font-semibold text-gray-900">{confirmation.durationMinutes} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Service</span>
              <span className="text-sm font-semibold text-gray-900">{confirmation.appointmentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Clinician</span>
              <span className="text-sm font-semibold text-gray-900">{confirmation.clinicianName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Location</span>
              <span className="text-sm font-semibold text-gray-900">{confirmation.siteName}</span>
            </div>
            {confirmation.siteAddress && (
              <p className="text-xs text-gray-400 text-right">{confirmation.siteAddress}</p>
            )}
          </div>

          <p className="text-sm text-gray-500">
            If you need to cancel or change this appointment, please call the pharmacy directly.
          </p>
        </div>
      </div>
    )
  }

  if (!config) return null

  // ── Render: Booking Steps ─────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Brand header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: brandColor }}>
          {config.brandName}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Request an Appointment</p>
      </div>

      {/* Step indicator */}
      {currentStepIdx >= 0 && (
        <div className="flex items-center justify-center gap-1 mb-8">
          {stepLabels.map((label, i) => {
            const isActive = i === currentStepIdx
            const isDone = i < currentStepIdx
            return (
              <div key={label} className="flex items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isActive
                      ? 'text-white'
                      : isDone
                      ? 'text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                  style={isActive || isDone ? { backgroundColor: brandColor } : {}}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:inline ${
                    isActive ? 'font-semibold text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div className="w-6 sm:w-10 h-px bg-gray-300 mx-1" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        {/* ── Step 1: Location ──────────────────────────────────── */}
        {step === 'location' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Select your preferred branch
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              We will always try to accommodate your preferred branch, but this is not
              always possible due to pharmacist and technician availability.
            </p>

            <div className="space-y-3">
              {config.sites.map((site) => (
                <button
                  key={site.id}
                  onClick={() => {
                    setSelectedSite(site)
                    setStep('service')
                  }}
                  className="w-full text-left p-5 rounded-xl border-2 transition-all hover:shadow-md"
                  style={{
                    borderColor: selectedSite?.id === site.id ? brandColor : '#e5e7eb',
                  }}
                >
                  <p className="font-semibold text-gray-900">{site.name}</p>
                  {site.address && (
                    <p className="text-sm text-gray-500 mt-1">{site.address}</p>
                  )}
                  {site.phone && (
                    <p className="text-sm text-gray-400 mt-1">{site.phone}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Service ───────────────────────────────────── */}
        {step === 'service' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Select service required
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Choose the type of appointment you need.
            </p>

            <div className="space-y-2">
              {config.appointmentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type)
                    setSelectedDate('')
                    setSlots([])
                    setStep('datetime')
                  }}
                  className="w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md flex items-center justify-between"
                  style={{
                    borderColor: selectedType?.id === type.id ? brandColor : '#e5e7eb',
                  }}
                >
                  <span className="font-medium text-gray-900">{type.name}</span>
                  <span className="text-xs text-gray-400">{type.durationMinutes} min</span>
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                config.sites.length > 1 ? setStep('location') : undefined
              }
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ← Change branch
            </button>
          </div>
        )}

        {/* ── Step 3: Date & Time ──────────────────────────────── */}
        {step === 'datetime' && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Choose a date and time
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {selectedSite?.name} &middot; {selectedType?.name} ({selectedType?.durationMinutes} min)
            </p>

            {/* Date selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a date
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {availableDates.map((d) => {
                  const isSelected = d === selectedDate
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'text-white border-transparent'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                      style={isSelected ? { backgroundColor: brandColor } : {}}
                    >
                      {formatDateLabel(d)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available times — {formatDateLabel(selectedDate)}
                </label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div
                      className="w-6 h-6 border-3 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: `${brandColor} transparent ${brandColor} ${brandColor}` }}
                    />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">
                    No available times on this date. Please try another day.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot, i) => {
                      const isSelected =
                        selectedSlot?.startTime === slot.startTime &&
                        selectedSlot?.clinicianId === slot.clinicianId
                      return (
                        <button
                          key={`${slot.clinicianId}-${slot.startTime}`}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            isSelected
                              ? 'text-white border-transparent'
                              : 'border-gray-200 text-gray-700 hover:border-gray-400'
                          }`}
                          style={isSelected ? { backgroundColor: brandColor } : {}}
                          title={`With ${slot.clinicianName}`}
                        >
                          {formatTime(slot.startTime)}
                          <span className="block text-xs opacity-75 mt-0.5 truncate">
                            {slot.clinicianName.split(' ')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep('service')}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                ← Change service
              </button>
              <button
                onClick={() => selectedSlot && setStep('details')}
                disabled={!selectedSlot}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg disabled:opacity-40 transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Patient Details ──────────────────────────── */}
        {(step === 'details' || step === 'submitting') && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Your details
            </h2>

            {/* Selected summary */}
            <div
              className="rounded-lg p-4 mb-6 text-sm"
              style={{ backgroundColor: brandColor + '10', border: `1px solid ${brandColor}25` }}
            >
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span style={{ color: brandColor }} className="font-medium">
                  {selectedSite?.name}
                </span>
                <span className="text-gray-500">{selectedType?.name}</span>
                <span className="text-gray-500">
                  {selectedDate && formatDateLabel(selectedDate)}
                </span>
                <span className="font-medium text-gray-700">
                  {selectedSlot && formatTime(selectedSlot.startTime)} with {selectedSlot?.clinicianName}
                </span>
              </div>
              <button
                onClick={() => setStep('datetime')}
                className="text-xs underline mt-1"
                style={{ color: brandColor }}
              >
                Change
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={step === 'submitting'}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    disabled={step === 'submitting'}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={step === 'submitting'}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={step === 'submitting'}
                  placeholder="e.g. 07700 900000"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={step === 'submitting'}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                />
              </div>

              {selectedType?.requiresDetails && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Please give further details so we can ensure you see the correct clinician
                  </label>
                  <textarea
                    value={serviceDetails}
                    onChange={(e) => setServiceDetails(e.target.value)}
                    disabled={step === 'submitting'}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 disabled:opacity-50 resize-none"
                  />
                </div>
              )}

              {/* Email confirmation opt-in */}
              <div className="flex items-start gap-3 py-2">
                <input
                  type="checkbox"
                  id="emailConfirm"
                  checked={emailConfirmation}
                  onChange={(e) => setEmailConfirmation(e.target.checked)}
                  disabled={step === 'submitting'}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="emailConfirm" className="text-sm text-gray-600">
                  Tick the box if you would like to receive an e-mail confirming the
                  form has been received by {config.brandName}.
                </label>
              </div>

              {/* Privacy / consent */}
              <div className="border-t border-gray-200 pt-5 mt-5">
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Privacy Protection
                </h3>
                <div className="text-sm text-gray-600 space-y-2 mb-4">
                  <p>
                    Information submitted through secure forms is used only for the
                    purposes of processing your request. We may be in touch with you
                    in relation to the information submitted.
                  </p>
                  <p>
                    All information submitted through secure forms is secured with a
                    private key and is accessed over a secure connection by nominated
                    staff. We have a strict confidentiality policy.
                  </p>
                  <p>This information is not shared with any third party organisations.</p>
                  <p className="text-xs text-gray-400">
                    This information is retained for up to 28 days.
                  </p>
                </div>

                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: '#f3f4f6' }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      checked={consentGiven}
                      onChange={(e) => setConsentGiven(e.target.checked)}
                      disabled={step === 'submitting'}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-700">
                      I consent to my information being used for the purposes described
                      above and wish to submit this online form to{' '}
                      <strong>{selectedSite?.name}</strong>
                      {selectedSite?.address && ` — ${selectedSite.address}`}.
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep('datetime')}
                  disabled={step === 'submitting'}
                  className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={
                    step === 'submitting' ||
                    !firstName ||
                    !surname ||
                    !dob ||
                    !phone ||
                    !consentGiven
                  }
                  className="px-8 py-3 text-sm font-semibold text-white rounded-lg disabled:opacity-40 transition-colors"
                  style={{ backgroundColor: brandColor }}
                >
                  {step === 'submitting' ? 'Booking...' : 'Submit Form'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
