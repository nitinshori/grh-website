import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointments } from '@/lib/db/schema'
import { and, gte, lte, eq, inArray } from 'drizzle-orm'
import { getAccessiblePharmacyIds } from '@/lib/access-pharmacies'

// POST /api/appointments/bulk — "Set availability" for a day at a branch.
// Creates a run of 'available' slots between two times. Skips any slot
// that would overlap an existing appointment at that branch.
//
// Body: { pharmacyId, date: "YYYY-MM-DD", startTime: "09:00",
//         endTime: "17:00", slotMinutes: 15, clinicianId? }

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { pharmacyId, date, startTime, endTime, slotMinutes, clinicianId } = body

  if (!pharmacyId || !date || !startTime || !endTime || !slotMinutes) {
    return NextResponse.json(
      { error: 'pharmacyId, date, startTime, endTime and slotMinutes are required' },
      { status: 400 }
    )
  }
  const accessibleIds = await getAccessiblePharmacyIds(session.user.pharmacyId)
  if (!accessibleIds.includes(pharmacyId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const mins = parseInt(String(slotMinutes), 10)
  if (isNaN(mins) || mins < 5 || mins > 120) {
    return NextResponse.json({ error: 'slotMinutes must be 5–120' }, { status: 400 })
  }

  const dayStart = new Date(`${date}T${startTime}:00`)
  const dayEnd = new Date(`${date}T${endTime}:00`)
  if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime()) || dayEnd <= dayStart) {
    return NextResponse.json({ error: 'Invalid date or time range' }, { status: 400 })
  }
  const maxSlots = 100
  const slots: { start: Date; end: Date }[] = []
  for (
    let t = dayStart.getTime();
    t + mins * 60000 <= dayEnd.getTime() && slots.length < maxSlots;
    t += mins * 60000
  ) {
    slots.push({ start: new Date(t), end: new Date(t + mins * 60000) })
  }
  if (slots.length === 0) {
    return NextResponse.json({ error: 'No slots fit in that window' }, { status: 400 })
  }

  // Existing appointments that day at this branch (any status except cancelled)
  const existing = await db
    .select({ start: appointments.startTime, end: appointments.endTime, status: appointments.status })
    .from(appointments)
    .where(
      and(
        eq(appointments.pharmacyId, pharmacyId),
        gte(appointments.startTime, dayStart),
        lte(appointments.endTime, dayEnd),
      )
    )
  const blocked = existing.filter((e) => e.status !== 'cancelled')
  const free = slots.filter(
    (s) => !blocked.some((e) => s.start < e.end && s.end > e.start)
  )

  if (free.length === 0) {
    return NextResponse.json({ created: 0, skipped: slots.length })
  }

  await db.insert(appointments).values(
    free.map((s) => ({
      pharmacyId,
      clinicianId: clinicianId || null,
      createdByUserId: session.user.id,
      startTime: s.start,
      endTime: s.end,
      status: 'available' as const,
    }))
  )

  return NextResponse.json({ created: free.length, skipped: slots.length - free.length })
}
