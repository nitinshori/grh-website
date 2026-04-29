import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies, clinicianAvailability, clinicians } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all availability for this pharmacy site
  const rows = await db
    .select({
      id: clinicianAvailability.id,
      clinicianId: clinicianAvailability.clinicianId,
      clinicianName: clinicians.name,
      pharmacyId: clinicianAvailability.pharmacyId,
      dayOfWeek: clinicianAvailability.dayOfWeek,
      startTime: clinicianAvailability.startTime,
      endTime: clinicianAvailability.endTime,
      isActive: clinicianAvailability.isActive,
    })
    .from(clinicianAvailability)
    .innerJoin(clinicians, eq(clinicians.id, clinicianAvailability.clinicianId))
    .where(eq(clinicianAvailability.pharmacyId, session.user.pharmacyId))
    .orderBy(clinicianAvailability.dayOfWeek, clinicianAvailability.startTime)

  return NextResponse.json({ availability: rows })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { clinicianId, dayOfWeek, startTime, endTime } = body

  if (!clinicianId || dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json(
      { error: 'clinicianId, dayOfWeek, startTime, endTime required' },
      { status: 400 }
    )
  }

  const [created] = await db
    .insert(clinicianAvailability)
    .values({
      clinicianId,
      pharmacyId: session.user.pharmacyId,
      dayOfWeek,
      startTime,
      endTime,
    })
    .returning()

  return NextResponse.json({ availability: created }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  await db
    .delete(clinicianAvailability)
    .where(
      and(
        eq(clinicianAvailability.id, id),
        eq(clinicianAvailability.pharmacyId, session.user.pharmacyId)
      )
    )

  return NextResponse.json({ success: true })
}
