import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies, appointmentTypes } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function getGroupSlug(pharmacyId: string): Promise<string | null> {
  const [pharmacy] = await db
    .select({ groupSlug: pharmacies.groupSlug })
    .from(pharmacies)
    .where(eq(pharmacies.id, pharmacyId))
    .limit(1)
  return pharmacy?.groupSlug || null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const groupSlug = await getGroupSlug(session.user.pharmacyId)
  if (!groupSlug) {
    return NextResponse.json({ types: [] })
  }

  const types = await db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.groupSlug, groupSlug))
    .orderBy(appointmentTypes.sortOrder)

  return NextResponse.json({ types })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const groupSlug = await getGroupSlug(session.user.pharmacyId)
  if (!groupSlug) {
    return NextResponse.json({ error: 'No group configured' }, { status: 400 })
  }

  const body = await req.json()
  const { name, durationMinutes, requiresDetails, color } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const [created] = await db
    .insert(appointmentTypes)
    .values({
      groupSlug,
      name,
      durationMinutes: durationMinutes || 15,
      requiresDetails: !!requiresDetails,
      color: color || '#25b4b4',
    })
    .returning()

  return NextResponse.json({ type: created }, { status: 201 })
}
