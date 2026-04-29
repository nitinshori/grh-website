import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointments } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// ── PATCH /api/appointments/[id] ────────────────────────────────
// Update an appointment (status, patient details, notes, times)

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

  // Only allow updating own pharmacy's appointments
  const [existing] = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.pharmacyId, session.user.pharmacyId)
      )
    )
    .limit(1)

  if (!existing) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() }

  if (body.status !== undefined) updates.status = body.status
  if (body.patientName !== undefined) updates.patientName = body.patientName?.trim() || null
  if (body.patientPhone !== undefined) updates.patientPhone = body.patientPhone?.trim() || null
  if (body.patientEmail !== undefined) updates.patientEmail = body.patientEmail?.trim() || null
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
// Delete an appointment slot

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [deleted] = await db
    .delete(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.pharmacyId, session.user.pharmacyId)
      )
    )
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
