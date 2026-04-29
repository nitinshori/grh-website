import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointments } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

// ── GET /api/appointments?from=ISO&to=ISO ───────────────────────
// Returns appointments for the logged-in user's pharmacy in range

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json(
      { error: 'from and to query params required (ISO date strings)' },
      { status: 400 }
    )
  }

  const rows = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.pharmacyId, session.user.pharmacyId),
        gte(appointments.startTime, new Date(from)),
        lte(appointments.endTime, new Date(to))
      )
    )
    .orderBy(appointments.startTime)

  return NextResponse.json({ appointments: rows })
}

// ── POST /api/appointments ──────────────────────────────────────
// Create a new appointment slot (or booked appointment)

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { startTime, endTime, status, patientName, patientPhone, patientEmail, notes } = body

  if (!startTime || !endTime) {
    return NextResponse.json(
      { error: 'startTime and endTime are required' },
      { status: 400 }
    )
  }

  const start = new Date(startTime)
  const end = new Date(endTime)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (end <= start) {
    return NextResponse.json(
      { error: 'endTime must be after startTime' },
      { status: 400 }
    )
  }

  const [created] = await db
    .insert(appointments)
    .values({
      pharmacyId: session.user.pharmacyId,
      createdByUserId: session.user.id,
      startTime: start,
      endTime: end,
      status: status || 'available',
      patientName: patientName?.trim() || null,
      patientPhone: patientPhone?.trim() || null,
      patientEmail: patientEmail?.trim() || null,
      notes: notes?.trim() || null,
    })
    .returning()

  return NextResponse.json({ appointment: created }, { status: 201 })
}
