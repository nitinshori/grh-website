import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointments } from '@/lib/db/schema'
import { and, gte, lte, inArray, eq } from 'drizzle-orm'
import { getAccessiblePharmacyIds } from '@/lib/access-pharmacies'

// ── GET /api/appointments?from=ISO&to=ISO ───────────────────────
// Returns appointments for the logged-in user's pharmacy — OR all
// pharmacies in the same group, if the pharmacy is part of a multi-site
// group like Pritchards (Meliden + Victoria Road).

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

  const pharmacyIds = await getAccessiblePharmacyIds(session.user.pharmacyId)
  if (pharmacyIds.length === 0) {
    return NextResponse.json({ appointments: [] })
  }

  const rows = await db
    .select()
    .from(appointments)
    .where(
      and(
        inArray(appointments.pharmacyId, pharmacyIds),
        gte(appointments.startTime, new Date(from)),
        lte(appointments.endTime, new Date(to)),
      )
    )
    .orderBy(appointments.startTime)

  return NextResponse.json({ appointments: rows })
}

// ── POST /api/appointments ──────────────────────────────────────
// Create a new appointment slot (or booked appointment). If the caller
// belongs to a group, they can pass `pharmacyId` to specify which branch
// the appointment is at — otherwise it defaults to their own pharmacy.

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    pharmacyId: requestedPharmacyId,
    clinicianId,
    appointmentTypeId,
    bookedByStaffId,
    startTime,
    endTime,
    status,
    patientName,
    patientFirstName,
    patientSurname,
    patientDob,
    patientPhone,
    patientEmail,
    serviceDetails,
    notes,
  } = body

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

  // Validate that the target pharmacy is one the user can access.
  const accessibleIds = await getAccessiblePharmacyIds(session.user.pharmacyId)
  const targetPharmacyId =
    (requestedPharmacyId && accessibleIds.includes(requestedPharmacyId))
      ? requestedPharmacyId
      : session.user.pharmacyId

  const [created] = await db
    .insert(appointments)
    .values({
      pharmacyId: targetPharmacyId,
      clinicianId: clinicianId || null,
      appointmentTypeId: appointmentTypeId || null,
      bookedByStaffId: bookedByStaffId || null,
      createdByUserId: session.user.id,
      startTime: start,
      endTime: end,
      status: status || 'available',
      patientName: patientName?.trim() || null,
      patientFirstName: patientFirstName?.trim() || null,
      patientSurname: patientSurname?.trim() || null,
      patientDob: patientDob?.trim() || null,
      patientPhone: patientPhone?.trim() || null,
      patientEmail: patientEmail?.trim() || null,
      serviceDetails: serviceDetails?.trim() || null,
      notes: notes?.trim() || null,
    })
    .returning()

  return NextResponse.json({ appointment: created }, { status: 201 })
}
