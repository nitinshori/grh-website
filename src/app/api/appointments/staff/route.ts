import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies, staffMembers } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

// GET /api/appointments/staff — the group's staff list ("booked by" names).

export async function GET() {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [pharmacy] = await db
    .select({ groupSlug: pharmacies.groupSlug })
    .from(pharmacies)
    .where(eq(pharmacies.id, session.user.pharmacyId))
    .limit(1)
  if (!pharmacy?.groupSlug) {
    return NextResponse.json({ staff: [] })
  }

  const staff = await db
    .select()
    .from(staffMembers)
    .where(and(eq(staffMembers.groupSlug, pharmacy.groupSlug), eq(staffMembers.isActive, true)))
    .orderBy(staffMembers.sortOrder, staffMembers.name)

  return NextResponse.json({ staff })
}
