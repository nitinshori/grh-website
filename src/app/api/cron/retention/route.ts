import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consultationAttachments, consultationRecords, paperConsultations } from '@/lib/db/schema'
import { and, inArray, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import { audit } from '@/lib/audit'
import { deleteBlobsQuietly } from '@/lib/consultation-attachments'

const CHUNK = 500

function chunks<T>(list: T[]): T[][] {
  const out: T[][] = []
  for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK))
  return out
}

/** Blob URLs of the paper-form scans attached to these parents. */
async function attachmentUrls(column: 'record' | 'paper', ids: string[]): Promise<string[]> {
  const col = column === 'record' ? consultationAttachments.consultationRecordId : consultationAttachments.paperConsultationId
  const urls: string[] = []
  for (const part of chunks(ids)) {
    const rows = await db
      .select({ url: consultationAttachments.blobUrl })
      .from(consultationAttachments)
      .where(inArray(col, part))
    for (const r of rows) urls.push(r.url)
  }
  return urls
}

/**
 * GET /api/cron/retention — runs the data retention policy.
 *
 * Two passes, applied to ePGD consultation records and to paper
 * consultations alike:
 *
 *  1. Permanently purges any record that was soft-deleted more than 30 days
 *     ago. This is the GDPR "right to erasure" finalisation. Scans of paper
 *     forms attached to those records are deleted from the Blob store first
 *     (best effort); their rows go with the record (ON DELETE CASCADE).
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
  const toPurge = await db
    .select({ id: consultationRecords.id })
    .from(consultationRecords)
    .where(
      and(
        isNotNull(consultationRecords.deletedAt),
        lt(consultationRecords.deletedAt, purgeCutoff)
      )
    )
  const purgeIds = toPurge.map((r) => r.id)
  await deleteBlobsQuietly(await attachmentUrls('record', purgeIds), 'retention purge: consultation records')
  const purged: Array<{ id: string }> = []
  for (const part of chunks(purgeIds)) {
    purged.push(
      ...(await db
        .delete(consultationRecords)
        .where(inArray(consultationRecords.id, part))
        .returning({ id: consultationRecords.id }))
    )
  }

  // 1b. Same for paper consultations
  const paperToPurge = await db
    .select({ id: paperConsultations.id })
    .from(paperConsultations)
    .where(and(isNotNull(paperConsultations.deletedAt), lt(paperConsultations.deletedAt, purgeCutoff)))
  const paperPurgeIds = paperToPurge.map((r) => r.id)
  await deleteBlobsQuietly(await attachmentUrls('paper', paperPurgeIds), 'retention purge: paper consultations')
  const paperPurged: Array<{ id: string }> = []
  for (const part of chunks(paperPurgeIds)) {
    paperPurged.push(
      ...(await db
        .delete(paperConsultations)
        .where(inArray(paperConsultations.id, part))
        .returning({ id: paperConsultations.id }))
    )
  }

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

  // 2b. Same for paper consultations (consultation_date is a plain date)
  const archiveCutoffDate = `${archiveCutoff.getFullYear()}-${String(archiveCutoff.getMonth() + 1).padStart(2, '0')}-${String(archiveCutoff.getDate()).padStart(2, '0')}`
  const paperArchived = await db
    .update(paperConsultations)
    .set({ deletedAt: now, deletedReason: 'retention-policy:8y' })
    .where(and(lt(paperConsultations.consultationDate, archiveCutoffDate), isNull(paperConsultations.deletedAt)))
    .returning({ id: paperConsultations.id })

  // Audit each purged + archived record. CQC-grade retention policy proof:
  // every legally-significant deletion has an immutable trail with timestamp.
  for (const row of purged) {
    await audit({
      action: 'record_purge',
      recordId: row.id,
      userEmail: 'cron@retention',
      details: { reason: 'soft_deleted_more_than_30d', purgedAt: now.toISOString() },
    })
  }
  for (const row of paperPurged) {
    await audit({
      action: 'record_purge',
      recordId: row.id,
      userEmail: 'cron@retention',
      details: { kind: 'paper_consultation', reason: 'soft_deleted_more_than_30d', purgedAt: now.toISOString() },
    })
  }
  for (const row of paperArchived) {
    await audit({
      action: 'record_soft_delete',
      recordId: row.id,
      userEmail: 'cron@retention',
      details: { kind: 'paper_consultation', reason: '8y_retention_policy', archivedAt: now.toISOString() },
    })
  }
  for (const row of archived) {
    await audit({
      action: 'record_soft_delete',
      recordId: row.id,
      userEmail: 'cron@retention',
      details: { reason: '8y_retention_policy', archivedAt: now.toISOString() },
    })
  }

  return NextResponse.json({
    success: true,
    purgedCount: purged.length,
    archivedCount: archived.length,
    paperPurgedCount: paperPurged.length,
    paperArchivedCount: paperArchived.length,
    purgeCutoff: purgeCutoff.toISOString(),
    archiveCutoff: archiveCutoff.toISOString(),
  })
}
