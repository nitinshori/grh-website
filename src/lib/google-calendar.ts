import { google, calendar_v3 } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

// ── Auth ────────────────────────────────────────────────────────
//
// Uses OAuth2 with a long-lived refresh token. Set the following env vars:
//
//   GOOGLE_CALENDAR_CLIENT_ID
//   GOOGLE_CALENDAR_CLIENT_SECRET
//   GOOGLE_CALENDAR_REFRESH_TOKEN
//   GOOGLE_CALENDAR_ID         (defaults to "primary")
//
// To generate a refresh token: use the Google OAuth Playground with the
// scope https://www.googleapis.com/auth/calendar, sign in as Dr Shori,
// and copy the refresh token into Vercel env vars.

let _calendar: calendar_v3.Calendar | null = null

function getCalendar(): calendar_v3.Calendar {
  if (_calendar) return _calendar

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Google Calendar credentials are not configured. Set GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN.'
    )
  }

  const oauth2Client: OAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret
  )
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  _calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  return _calendar
}

function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || 'primary'
}

// ── Types ───────────────────────────────────────────────────────

export interface AvailableSlot {
  start: string // ISO string in UK time
  end: string
  startLabel: string // human-readable e.g. "Tuesday 9 April, 10:30 AM"
}

export interface CreateAppointmentParams {
  summary: string
  description?: string
  startTime: string // ISO string
  durationMinutes?: number
  attendeeEmail?: string
  attendeeName?: string
}

export interface CreatedAppointment {
  eventId: string
  htmlLink: string | null
  startTime: string
  endTime: string
}

// ── Working hours configuration ─────────────────────────────────

const WORK_TIMEZONE = 'Europe/London'
const WORK_START_HOUR = 9 // 09:00
const WORK_END_HOUR = 17 // 17:00 (last slot starts 16:30)
const SLOT_MINUTES = 30
const DEFAULT_APPOINTMENT_MINUTES = 30

// ── Per-day specific availability overrides ────────────────────
//
// Map of YYYY-MM-DD (UK calendar date) → array of HH:MM slot start times.
// On dates listed here, ONLY these slots are offered (subject to the usual
// busy-period and lead-time checks). Dates not listed fall through to
// the default WORK_START_HOUR..WORK_END_HOUR Mon-Fri envelope.
//
// Use this for one-off availability changes (evening discovery calls,
// blocked travel days, etc) without changing the core working-hours
// constants. Once a date is past, leave the entry or remove it — past
// dates are ignored automatically by the start-time filter.

const SPECIFIC_AVAILABILITY: Record<string, string[]> = {
  // Week of 11–15 May 2026 — launch-week discovery calls
  '2026-05-11': ['16:00', '16:30', '17:00', '17:30', '19:30', '20:00', '20:30'],
  '2026-05-12': ['08:30'],
  '2026-05-13': ['19:00', '19:30', '20:00'],
  '2026-05-14': ['19:00', '19:30', '20:00'],
  '2026-05-15': ['19:00', '19:30', '20:00'],
}

function ukDateKey(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: WORK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

// ── Availability ────────────────────────────────────────────────

/**
 * Returns up to `maxSlots` available 30-minute slots between
 * `startDate` and `endDate`, only on weekdays during working hours
 * (09:00-17:00 UK time), and only at least 1 hour from now.
 */
export async function getAvailability(
  startDate: Date,
  endDate: Date,
  maxSlots: number = 6
): Promise<AvailableSlot[]> {
  const calendar = getCalendar()

  // Look up busy periods using freebusy
  const fb = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      timeZone: WORK_TIMEZONE,
      items: [{ id: calendarId() }],
    },
  })

  const busy =
    fb.data.calendars?.[calendarId()]?.busy?.map((b) => ({
      start: new Date(b.start || ''),
      end: new Date(b.end || ''),
    })) || []

  const slots: AvailableSlot[] = []
  const now = new Date()
  const minStart = new Date(now.getTime() + 60 * 60 * 1000) // at least 1h ahead

  // Iterate day by day
  const cursor = new Date(startDate)
  cursor.setUTCHours(0, 0, 0, 0)

  while (cursor <= endDate && slots.length < maxSlots) {
    const dateKey = ukDateKey(cursor)
    const override = SPECIFIC_AVAILABILITY[dateKey]
    const ukDow = ukDayOfWeek(cursor)

    // Build candidate (hour, minute) tuples for this day
    let candidates: Array<[number, number]> = []
    if (override) {
      // Use the explicit overrides for this date, regardless of weekday
      candidates = override.flatMap((hhmm) => {
        const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10))
        return Number.isFinite(h) && Number.isFinite(m) ? [[h, m] as [number, number]] : []
      })
    } else if (ukDow !== 0 && ukDow !== 6) {
      // Default weekday working-hours envelope
      for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
        for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
          candidates.push([hour, minute])
        }
      }
    }

    for (const [hour, minute] of candidates) {
      const slotStart = ukDateAt(cursor, hour, minute)
      const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000)

      if (slotStart < minStart) continue
      if (slotStart > endDate) break

      const overlaps = busy.some(
        (b) => slotStart < b.end && slotEnd > b.start
      )
      if (!overlaps) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          startLabel: formatSlotLabel(slotStart),
        })
        if (slots.length >= maxSlots) break
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return slots
}

// ── Booking ─────────────────────────────────────────────────────

/**
 * Creates a calendar event for an appointment.
 */
export async function createAppointment(
  params: CreateAppointmentParams
): Promise<CreatedAppointment> {
  const calendar = getCalendar()
  const duration = params.durationMinutes || DEFAULT_APPOINTMENT_MINUTES
  const start = new Date(params.startTime)
  const end = new Date(start.getTime() + duration * 60 * 1000)

  const attendees: calendar_v3.Schema$EventAttendee[] = []
  if (params.attendeeEmail) {
    attendees.push({
      email: params.attendeeEmail,
      displayName: params.attendeeName,
    })
  }

  const event = await calendar.events.insert({
    calendarId: calendarId(),
    sendUpdates: 'all',
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: start.toISOString(),
        timeZone: WORK_TIMEZONE,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: WORK_TIMEZONE,
      },
      attendees: attendees.length > 0 ? attendees : undefined,
      reminders: {
        useDefault: true,
      },
    },
  })

  if (!event.data.id) {
    throw new Error('Google Calendar did not return an event ID')
  }

  return {
    eventId: event.data.id,
    htmlLink: event.data.htmlLink || null,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  }
}

// ── UK time helpers ─────────────────────────────────────────────
//
// Working with timezones in pure JS is awkward. We use Intl APIs
// to project a UTC date into UK local hours.

function ukDayOfWeek(date: Date): number {
  // Returns 0 (Sun) - 6 (Sat) in UK time
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: WORK_TIMEZONE,
    weekday: 'short',
  })
  const name = formatter.format(date)
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[name] ?? 0
}

/**
 * Build a Date that represents the given UK local hour/minute on the
 * provided date. Handles BST/GMT correctly.
 */
function ukDateAt(day: Date, hour: number, minute: number): Date {
  // Get the UK calendar date
  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: WORK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = dateFormatter.formatToParts(day)
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  if (!y || !m || !d) return new Date(NaN)

  // Build a UTC date matching the UK wall-clock time, then adjust
  // for the UK offset on that day
  const naive = new Date(`${y}-${m}-${d}T${pad(hour)}:${pad(minute)}:00Z`)
  const offsetMs = ukOffsetMillis(naive)
  return new Date(naive.getTime() - offsetMs)
}

function ukOffsetMillis(date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const ukDate = new Date(date.toLocaleString('en-US', { timeZone: WORK_TIMEZONE }))
  return ukDate.getTime() - utcDate.getTime()
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatSlotLabel(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: WORK_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return formatter.format(date)
}
