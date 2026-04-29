import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies, clinicians } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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
    return NextResponse.json({ clinicians: [] })
  }

  const list = await db
    .select()
    .from(clinicians)
    .where(eq(clinicians.groupSlug, groupSlug))

  return NextResponse.json({ clinicians: list })
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
  const { name, gphcNumber, role } = body

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const [created] = await db
    .insert(clinicians)
    .values({
      groupSlug,
      name,
      gphcNumber: gphcNumber || null,
      role: role || 'Pharmacist',
    })
    .returning()

  return NextResponse.json({ clinician: created }, { status: 201 })
}
