import { db } from '@/lib/db'
import { pgdConsultations } from '@/lib/db/schema'
import { eq, and, gte, sql, desc } from 'drizzle-orm'

// ── Record events ────────────────────────────────────────────────

export async function recordConsultationStart(
  userId: string,
  pharmacyId: string,
  pgdSlug: string
): Promise<string> {
  const [row] = await db
    .insert(pgdConsultations)
    .values({ userId, pharmacyId, pgdSlug })
    .returning({ id: pgdConsultations.id })
  return row.id
}

export async function recordConsultationComplete(
  consultationId: string
): Promise<void> {
  await db
    .update(pgdConsultations)
    .set({ completedAt: new Date() })
    .where(eq(pgdConsultations.id, consultationId))
}

// ── Query helpers ────────────────────────────────────────────────

export interface PgdUsageStat {
  pgdSlug: string
  total: number
  completed: number
}

export interface RecentConsultation {
  id: string
  pgdSlug: string
  startedAt: Date
  completedAt: Date | null
  userId: string
  pharmacyId: string
}

/**
 * Get aggregated stats for a specific pharmacy over the given period
 */
export async function getPharmacyStats(
  pharmacyId: string,
  days: number = 30
): Promise<{
  totalConsultations: number
  completedConsultations: number
  byPgd: PgdUsageStat[]
  recent: RecentConsultation[]
}> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const [countResult] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(${pgdConsultations.completedAt})::int`,
    })
    .from(pgdConsultations)
    .where(
      and(
        eq(pgdConsultations.pharmacyId, pharmacyId),
        gte(pgdConsultations.startedAt, cutoff)
      )
    )

  const byPgd = await db
    .select({
      pgdSlug: pgdConsultations.pgdSlug,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(${pgdConsultations.completedAt})::int`,
    })
    .from(pgdConsultations)
    .where(
      and(
        eq(pgdConsultations.pharmacyId, pharmacyId),
        gte(pgdConsultations.startedAt, cutoff)
      )
    )
    .groupBy(pgdConsultations.pgdSlug)
    .orderBy(sql`count(*) desc`)

  const recent = await db
    .select({
      id: pgdConsultations.id,
      pgdSlug: pgdConsultations.pgdSlug,
      startedAt: pgdConsultations.startedAt,
      completedAt: pgdConsultations.completedAt,
      userId: pgdConsultations.userId,
      pharmacyId: pgdConsultations.pharmacyId,
    })
    .from(pgdConsultations)
    .where(eq(pgdConsultations.pharmacyId, pharmacyId))
    .orderBy(desc(pgdConsultations.startedAt))
    .limit(10)

  return {
    totalConsultations: countResult?.total ?? 0,
    completedConsultations: countResult?.completed ?? 0,
    byPgd,
    recent,
  }
}

/**
 * Get system-wide stats (for super_admin)
 */
export async function getSystemStats(days: number = 30): Promise<{
  totalConsultations: number
  completedConsultations: number
  topPgds: PgdUsageStat[]
  recent: RecentConsultation[]
}> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const [countResult] = await db
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(${pgdConsultations.completedAt})::int`,
    })
    .from(pgdConsultations)
    .where(gte(pgdConsultations.startedAt, cutoff))

  const topPgds = await db
    .select({
      pgdSlug: pgdConsultations.pgdSlug,
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(${pgdConsultations.completedAt})::int`,
    })
    .from(pgdConsultations)
    .where(gte(pgdConsultations.startedAt, cutoff))
    .groupBy(pgdConsultations.pgdSlug)
    .orderBy(sql`count(*) desc`)
    .limit(10)

  const recent = await db
    .select({
      id: pgdConsultations.id,
      pgdSlug: pgdConsultations.pgdSlug,
      startedAt: pgdConsultations.startedAt,
      completedAt: pgdConsultations.completedAt,
      userId: pgdConsultations.userId,
      pharmacyId: pgdConsultations.pharmacyId,
    })
    .from(pgdConsultations)
    .orderBy(desc(pgdConsultations.startedAt))
    .limit(15)

  return {
    totalConsultations: countResult?.total ?? 0,
    completedConsultations: countResult?.completed ?? 0,
    topPgds,
    recent,
  }
}
