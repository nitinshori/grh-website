import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consultationRecords } from '@/lib/db/schema'
import { and, eq, isNotNull, lt, sql } from 'drizzle-orm'

/**
 * GET /api/cron/retention — runs the data retention policy.
 *
 * Two passes:
 *
 *  1. Permanently purges any record that was soft-deleted more than 30 days
 *     ago. This is the GDPR "right to erasure" finalisation.
 *
 *  2. Soft-deletes any record older than 8 years and 30 days. UK PGD record
 *     keeping requires 8 years for adults; we add a 30-day buffer so admin
 *     can review before purge.
 *
 * Vercel cron schedule (in vercel.json):
 *   { "path": "/api/cron/retention", "schedule": "0 3 * * *" }
 *
 * Auth: requires header `Authorization: Bearer <CRON_SECRET>` matching env.
 * This stops anyone hitting the endpoint to prematurely purge records.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()

  // 1. Hard-purge records soft-deleted >30 days ago
  const purgeCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const purged = await db
    .delete(consultationRecords)
    .where(
      and(
        isNotNull(consultationRecords.deletedAt),
        lt(consultationRecords.deletedAt, purgeCutoff)
      )
    )
    .returning({ id: consultationRecords.id })

  // 2. Soft-delete records older than 8 years + 30-day buffer
  const archiveCutoff = new Date(
    now.getFullYear() - 8,
    now.getMonth(),
    now.getDate() - 30
  )
  const archived = await db
    .update(consultationRecords)
    .set({
      deletedAt: now,
      deletedReason: 'retention-policy:8y',
    })
    .where(
      and(
        lt(consultationRecords.consultationDate, archiveCutoff),
        sql`${consultationRecords.deletedAt} IS NULL`
      )
    )
    .returning({ id: consultationRecords.id })

  return NextResponse.json({
    success: true,
    purgedCount: purged.length,
    archivedCount: archived.length,
    purgeCutoff: purgeCutoff.toISOString(),
    archiveCutoff: archiveCutoff.toISOString(),
  })
}
