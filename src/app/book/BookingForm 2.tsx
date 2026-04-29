'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Types ───────────────────────────────────────────────────────

interface Slot {
  start: string
  end: string
  label: string
}

interface GroupedDay {
  dateLabel: string
  slots: Slot[]
}

type Step = 'loading' | 'slots' | 'form' | 'submitting' | 'confirmed'

// ── Helpers ─────────────────────────────────────────────────────

function groupByDay(slots: Slot[]): GroupedDay[] {
  const map = new Map<string, Slot[]>()
  for (const slot of slots) {
    const date = new Date(slot.start)
    const key = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(slot)
  }
  return Array.from(map.entries()).map(([dateLabel, slots]) => ({ dateLabel, slots }))
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

function formatFullTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

// ── Component ───────────────────────────────────────────────────

export default function BookingForm() {
  const [step, setStep] = useState<Step>('loading')
  const [slots, setSlots] = useState<Slot[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [daysAhead, setDaysAhead] = useState(14)
  const [confirmedTime, setConfirmedTime] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [pharmacyName, setPharmacyName] = useState('')
  const [notes, setNotes] = useState('')

  // ── Fetch slots ─────────────────────────────────────────────

  const fetchSlots = useCallback(async (days: number) => {
    setError(null)
    try {
      const res = await fetch('/api/book/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysAhead: days }),
      })
      if (!res.ok) throw new Error('Failed to load availability')
      const data = await res.json()
      setSlots(data.slots || [])
      setStep('slots')
    } catch {
      setError('Unable to load available times. Please try again.')
      setStep('slots')
    }
  }, [])

  useEffect(() => {
    fetchSlots(daysAhead)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Select slot ─────────────────────────────────────────────

  function handleSelectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setStep('form')
  }

  function handleBack() {
    setSelectedSlot(null)
    setStep('slots')
  }

  // ── Load more ───────────────────────────────────────────────

  function handleLoadMore() {
    const next = daysAhead + 14
    setDaysAhead(next)
    setStep('loading')
    fetchSlots(next)
  }

  // ── Submit booking ──────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !name.trim() || !email.trim()) return

    setStep('submitting')
    setError(null)

    try {
      const res = await fetch('/api/book/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          pharmacyName: pharmacyName.trim() || undefined,
          startTime: selectedSlot.start,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // If the slot was taken, refresh slots
        if (data.error?.includes('conflict') || data.error?.includes('taken')) {
          setError('That time slot has just been taken. Please pick another.')
          setSelectedSlot(null)
          setStep('loading')
          fetchSlots(daysAhead)
          return
        }
        throw new Error(data.error || 'Booking failed')
      }

      setConfirmedTime(data.formattedTime || formatFullTime(selectedSlot.start))
      setStep('confirmed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStep('form')
    }
  }

  // ── Render: Loading ─────────────────────────────────────────

  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 text-sm">Loading available times…</p>
      </div>
    )
  }

  // ── Render: Confirmed ───────────────────────────────────────

  if (step === 'confirmed') {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-navy-900">You&rsquo;re booked!</h2>
        <div className="mt-4 bg-teal-50 border border-teal-200 rounded-lg p-4 inline-block">
          <p className="font-semibold text-teal-800">{confirmedTime}</p>
          <p className="text-sm text-teal-600 mt-1">30 minutes &middot; UK time</p>
        </div>
        <p className="mt-6 text-gray-600 max-w-md mx-auto">
          Check your inbox — we&rsquo;ve sent a confirmation email and a Google Calendar invite.
          Nitin will be in touch if anything changes.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/for-pharmacies"
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Explore our services
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    )
  }

  // ── Render: Form (step 2) ───────────────────────────────────

  if (step === 'form' || step === 'submitting') {
    const isSubmitting = step === 'submitting'
    return (
      <div>
        {/* Selected slot */}
        <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg p-4 mb-8">
          <div>
            <p className="text-sm text-teal-600 font-medium">Selected time</p>
            <p className="font-semibold text-teal-800">{selectedSlot ? formatFullTime(selectedSlot.start) : ''}</p>
          </div>
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium underline disabled:opacity-50"
          >
            Change
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <h2 className="text-xl font-bold text-navy-900 mb-6">Your details</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="e.g. Dr Sarah Khan"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="e.g. sarah@pharmacy.co.uk"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="e.g. 07700 900000"
            />
          </div>

          <div>
            <label htmlFor="pharmacy" className="block text-sm font-medium text-gray-700 mb-1">
              Pharmacy name
            </label>
            <input
              id="pharmacy"
              type="text"
              value={pharmacyName}
              onChange={(e) => setPharmacyName(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="e.g. Well Pharmacy, Leeds"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Anything you&rsquo;d like to discuss?
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none"
              placeholder="e.g. I'm interested in travel health PGDs for my two branches"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !email.trim()}
            className="w-full sm:w-auto px-8 py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {isSubmitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </form>
      </div>
    )
  }

  // ── Render: Slots (step 1) ──────────────────────────────────

  const grouped = groupByDay(slots)

  return (
    <div>
      <h2 className="text-xl font-bold text-navy-900 mb-2">Choose a time</h2>
      <p className="text-gray-500 text-sm mb-8">
        All times are UK time (GMT/BST). Each call is 30 minutes.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error}
          <button
            onClick={() => { setStep('loading'); fetchSlots(daysAhead) }}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {grouped.length === 0 && !error ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No available slots in the next {daysAhead} days.</p>
          <button
            onClick={handleLoadMore}
            className="mt-4 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Check later dates
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {grouped.map(({ dateLabel, slots: daySlots }) => (
              <div key={dateLabel}>
                <h3 className="text-sm font-semibold text-navy-800 mb-3">{dateLabel}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {daySlots.map((slot) => (
                    <button
                      key={slot.start}
                      onClick={() => handleSelectSlot(slot)}
                      className="px-4 py-2.5 border-2 border-teal-400 text-teal-700 font-medium rounded-lg hover:bg-teal-50 hover:border-teal-500 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
                    >
                      {formatTime(slot.start)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium underline"
            >
              Show more times
            </button>
          </div>
        </>
      )}

      <div className="mt-12 border-t border-gray-200 pt-8">
        <p className="text-sm text-gray-500 text-center">
          Prefer to talk first?{' '}
          <Link href="/contact" className="text-teal-600 hover:text-teal-700 underline">
            Send us a message
          </Link>{' '}
          or call{' '}
          <a href="tel:+441135198330" className="text-teal-600 hover:text-teal-700 underline">
            0113 519 8330
          </a>
        </p>
      </div>
    </div>
  )
}
