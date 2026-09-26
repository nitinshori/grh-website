import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  pharmacies,
  clinicianAvailability,
  appointments,
  appointmentTypes,
  clinicians,
} from '@/lib/db/schema'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'

// ── GET /api/booking/[slug]/slots?siteId=X&typeId=Y&date=YYYY-MM-DD ──
// Public: returns available time slots for a given site, type, and date

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const siteId = searchParams.get('siteId')
  const typeId = searchParams.get('typeId')
  const dateStr = searchParams.get('date') // "YYYY-MM-DD"

  if (!siteId || !typeId || !dateStr) {
    return NextResponse.json(
      { error: 'siteId, typeId, and date are required' },
      { status: 400 }
    )
  }

  // Validate site belongs to this group
  const [site] = await db
    .select()
    .from(pharmacies)
    .where(
      and(
        eq(pharmacies.id, siteId),
        eq(pharmacies.groupSlug, slug),
        eq(pharmacies.isActive, true)
      )
    )
    .limit(1)

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  // Get appointment type for duration (scoped to this group)
  const [apptType] = await db
    .select()
    .from(appointmentTypes)
    .where(
      and(
        eq(appointmentTypes.id, typeId),
        eq(appointmentTypes.groupSlug, slug)
      )
    )
    .limit(1)

  if (!apptType) {
    return NextResponse.json({ error: 'Appointment type not found' }, { status: 404 })
  }

  const duration = apptType.durationMinutes

  // Parse the requested date
  const targetDate = new Date(dateStr + 'T00:00:00')
  if (isNaN(targetDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  // Don't allow booking in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (targetDate < today) {
    return NextResponse.json({ slots: [] })
  }

  const dayOfWeek = targetDate.getDay() // 0=Sun, 1=Mon...

  // Get all clinician availability for this site + day of week
  const availabilities = await db
    .select({
      clinicianId: clinicianAvailability.clinicianId,
      clinicianName: clinicians.name,
      startTime: clinicianAvailability.startTime,
      endTime: clinicianAvailability.endTime,
    })
    .from(clinicianAvailability)
    .innerJoin(clinicians, eq(clinicians.id, clinicianAvailability.clinicianId))
    .where(
      and(
        eq(clinicianAvailability.pharmacyId, siteId),
        eq(clinicianAvailability.dayOfWeek, dayOfWeek),
        eq(clinicianAvailability.isActive, true),
        eq(clinicians.isActive, true)
      )
    )

  if (availabilities.length === 0) {
    return NextResponse.json({ slots: [] })
  }

  // Get existing booked appointments for this site on this date
  const dayStart = new Date(dateStr + 'T00:00:00')
  const dayEnd = new Date(dateStr + 'T23:59:59')

  const existingAppointments = await db
    .select({
      clinicianId: appointments.clinicianId,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.pharmacyId, siteId),
        gte(appointments.startTime, dayStart),
        lte(appointments.startTime, dayEnd),
        // Only count booked/completed (not cancelled/no_show)
        inArray(appointments.status, ['booked', 'completed'])
      )
    )

  // Generate slots per clinician
  interface Slot {
    clinicianId: string
    clinicianName: string
    startTime: string // ISO
    endTime: string   // ISO
  }

  const slots: Slot[] = []
  const now = new Date()

  for (const avail of availabilities) {
    const [startH, startM] = avail.startTime.split(':').map(Number)
    const [endH, endM] = avail.endTime.split(':').map(Number)
    const availStartMin = startH * 60 + startM
    const availEndMin = endH * 60 + endM

    // Get this clinician's booked slots for the day
    const clinicianBooked = existingAppointments.filter(
      (a) => a.clinicianId === avail.clinicianId
    )

    for (let m = availStartMin; m + duration <= availEndMin; m += duration) {
      const slotStart = new Date(targetDate)
      slotStart.setHours(Math.floor(m / 60), m % 60, 0, 0)

      const slotEnd = new Date(targetDate)
      slotEnd.setHours(
        Math.floor((m + duration) / 60),
        (m + duration) % 60,
        0,
        0
      )

      // Skip if in the past
      if (slotStart <= now) continue

      // Skip if overlaps with existing booking
      const isBooked = clinicianBooked.some((b) => {
        const bStart = new Date(b.startTime).getTime()
        const bEnd = new Date(b.endTime).getTime()
        return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart
      })
      if (isBooked) continue

      slots.push({
        clinicianId: avail.clinicianId,
        clinicianName: avail.clinicianName,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
      })
    }
  }

  // Sort by time, then clinician
  slots.sort((a, b) => a.startTime.localeCompare(b.startTime))

  return NextResponse.json({ slots, durationMinutes: duration })
}
