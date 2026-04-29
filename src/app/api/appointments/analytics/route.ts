import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { appointments, appointmentTypes, pharmacies } from '@/lib/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '30', 10)

  const since = new Date()
  since.setDate(since.getDate() - days)

  // Get group slug to aggregate across sites
  const [pharmacy] = await db
    .select({ groupSlug: pharmacies.groupSlug })
    .from(pharmacies)
    .where(eq(pharmacies.id, session.user.pharmacyId))
    .limit(1)

  const groupSlug = pharmacy?.groupSlug

  // Get all sites in group
  let siteIds: string[] = [session.user.pharmacyId]
  if (groupSlug) {
    const sites = await db
      .select({ id: pharmacies.id })
      .from(pharmacies)
      .where(eq(pharmacies.groupSlug, groupSlug))
    siteIds = sites.map((s) => s.id)
  }

  // Count by appointment type across all sites
  const byType = await db
    .select({
      appointmentTypeId: appointments.appointmentTypeId,
      typeName: appointmentTypes.name,
      status: appointments.status,
      count: sql<number>`count(*)::int`,
    })
    .from(appointments)
    .leftJoin(appointmentTypes, eq(appointmentTypes.id, appointments.appointmentTypeId))
    .where(
      and(
        sql`${appointments.pharmacyId} = ANY(${siteIds})`,
        gte(appointments.createdAt, since)
      )
    )
    .groupBy(appointments.appointmentTypeId, appointmentTypes.name, appointments.status)

  // Count by status
  const byStatus = await db
    .select({
      status: appointments.status,
      count: sql<number>`count(*)::int`,
    })
    .from(appointments)
    .where(
      and(
        sql`${appointments.pharmacyId} = ANY(${siteIds})`,
        gte(appointments.createdAt, since)
      )
    )
    .groupBy(appointments.status)

  // Total
  const total = byStatus.reduce((sum, r) => sum + r.count, 0)

  return NextResponse.json({
    period: `${days} days`,
    total,
    byStatus,
    byType,
  })
}
