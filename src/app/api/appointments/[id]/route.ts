import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointments } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { getAccessiblePharmacyIds } from '@/lib/access-pharmacies'

// ── PATCH /api/appointments/[id] ────────────────────────────────
// Update an appointment. Allowed if the appointment belongs to any
// pharmacy the caller has access to (own pharmacy OR any pharmacy in
// their group).

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const accessibleIds = await getAccessiblePharmacyIds(session.user.pharmacyId)

  const [existing] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        inArray(appointments.pharmacyId, accessibleIds)
      )
    )
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.status !== undefined) updates.status = body.status
  if (body.pharmacyId !== undefined && accessibleIds.includes(body.pharmacyId)) {
    updates.pharmacyId = body.pharmacyId
  }
  if (body.clinicianId !== undefined) updates.clinicianId = body.clinicianId || null
  if (body.appointmentTypeId !== undefined) updates.appointmentTypeId = body.appointmentTypeId || null
  if (body.bookedByStaffId !== undefined) updates.bookedByStaffId = body.bookedByStaffId || null
  if (body.patientName !== undefined) updates.patientName = body.patientName?.trim() || null
  if (body.patientFirstName !== undefined) updates.patientFirstName = body.patientFirstName?.trim() || null
  if (body.patientSurname !== undefined) updates.patientSurname = body.patientSurname?.trim() || null
  if (body.patientDob !== undefined) updates.patientDob = body.patientDob?.trim() || null
  if (body.patientPhone !== undefined) updates.patientPhone = body.patientPhone?.trim() || null
  if (body.patientEmail !== undefined) updates.patientEmail = body.patientEmail?.trim() || null
  if (body.serviceDetails !== undefined) updates.serviceDetails = body.serviceDetails?.trim() || null
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null
  if (body.startTime !== undefined) updates.startTime = new Date(body.startTime)
  if (body.endTime !== undefined) updates.endTime = new Date(body.endTime)

  const [updated] = await db
    .update(appointments)
    .set(updates)
    .where(eq(appointments.id, id))
    .returning()

  return NextResponse.json({ appointment: updated })
}

// ── DELETE /api/appointments/[id] ───────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const accessibleIds = await getAccessiblePharmacyIds(session.user.pharmacyId)

  const [deleted] = await db
    .delete(appointments)
    .where(
      and(
        eq(appointments.id, id),
        inArray(appointments.pharmacyId, accessibleIds),
      )
    )
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
