import 'server-only'
import { randomUUID } from 'node:crypto'
import { del, put } from '@vercel/blob'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { consultationAttachments, consultationRecords, paperConsultations } from '@/lib/db/schema'

/**
 * Scans and photos of completed paper patient forms, attached to an ePGD
 * consultation record or a paper consultation (migration 077).
 *
 * The Blob store is PRIVATE: files go up with access 'private' and come back
 * only through /api/consultation-attachments/[id]/file after
 * canAccessPharmacyRecords(). Blob paths carry ids only, never patient
 * names.
 */

/** Largest file the browser may pick (before compression). */
export const ATTACHMENT_MAX_PICK_BYTES = 10 * 1024 * 1024
/** Largest body we accept (Vercel functions reject requests above ~4.5 MB). */
export const ATTACHMENT_MAX_UPLOAD_BYTES = 4 * 1024 * 1024 + 256 * 1024

type Kind = { contentType: string; ext: string }

/** Identify the file from its first bytes; the declared type is not trusted. */
export function sniffAttachment(bytes: Uint8Array): Kind | null {
  const b = bytes
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
    return { contentType: 'application/pdf', ext: 'pdf' }
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { contentType: 'image/jpeg', ext: 'jpg' }
  }
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { contentType: 'image/png', ext: 'png' }
  }
  if (b.length >= 12) {
    const box = String.fromCharCode(b[4], b[5], b[6], b[7])
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11])
    if (box === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(brand)) {
      return { contentType: 'image/heic', ext: 'heic' }
    }
  }
  return null
}

/** Roles that may see or add to consultation records at all. */
export const RECORD_ROLES = new Set(['pharmacist', 'pharmacy_admin', 'super_admin'])

export function hasRecordRole(role: string | null | undefined): boolean {
  return !!role && RECORD_ROLES.has(role)
}

/**
 * May this signed-in user see or add to records of this pharmacy?
 * super_admin: any. pharmacist / pharmacy_admin: only the branch they are
 * working at this session. Every other role: never.
 */
export async function canAccessPharmacyRecords(
  user: { role: string; pharmacyId: string | null },
  pharmacyId: string,
): Promise<boolean> {
  if (user.role === 'super_admin') return true
  if (user.role !== 'pharmacist' && user.role !== 'pharmacy_admin') return false
  return !!user.pharmacyId && user.pharmacyId === pharmacyId
}

/** Delete blobs from the private store, best effort. Logs ids only. */
export async function deleteBlobsQuietly(urls: string[], label: string): Promise<void> {
  const list = urls.filter(Boolean)
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100)
    try {
      await del(chunk)
    } catch (e) {
      console.error(`[attachments] blob delete failed (${label}, ${chunk.length} file(s)):`, e instanceof Error ? e.name : 'error')
    }
  }
}

export interface AttachmentListItem {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  createdAt: Date
}

const listColumns = {
  id: consultationAttachments.id,
  fileName: consultationAttachments.fileName,
  contentType: consultationAttachments.contentType,
  sizeBytes: consultationAttachments.sizeBytes,
  createdAt: consultationAttachments.createdAt,
}

export async function attachmentsForRecord(recordId: string): Promise<AttachmentListItem[]> {
  return db
    .select(listColumns)
    .from(consultationAttachments)
    .where(eq(consultationAttachments.consultationRecordId, recordId))
    .orderBy(asc(consultationAttachments.createdAt))
}

export async function attachmentsForPaper(paperId: string): Promise<AttachmentListItem[]> {
  return db
    .select(listColumns)
    .from(consultationAttachments)
    .where(eq(consultationAttachments.paperConsultationId, paperId))
    .orderBy(asc(consultationAttachments.createdAt))
}

/** Number of attachments per tool record, for the records list. */
export async function attachmentCounts(recordIds: string[], paperIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (recordIds.length) {
    const rows = await db
      .select({ id: consultationAttachments.consultationRecordId })
      .from(consultationAttachments)
      .where(inArray(consultationAttachments.consultationRecordId, recordIds))
    for (const r of rows) if (r.id) out.set(r.id, (out.get(r.id) ?? 0) + 1)
  }
  if (paperIds.length) {
    const rows = await db
      .select({ id: consultationAttachments.paperConsultationId })
      .from(consultationAttachments)
      .where(inArray(consultationAttachments.paperConsultationId, paperIds))
    for (const r of rows) if (r.id) out.set(r.id, (out.get(r.id) ?? 0) + 1)
  }
  return out
}

export type ValidatedFile = { bytes: Uint8Array; kind: Kind; fileName: string }

/** Check one uploaded file. Returns a short customer-facing error on failure. */
export async function validateAttachment(file: unknown): Promise<{ ok: true; file: ValidatedFile } | { ok: false; error: string }> {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Please choose a file to upload.' }
  }
  if (file.size > ATTACHMENT_MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'That file is too large. Please use a file under 4 MB.' }
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniffAttachment(bytes)
  if (!kind) {
    return { ok: false, error: 'Please upload a photo (JPG, PNG or HEIC) or a PDF.' }
  }
  const fileName = (file.name || `paper-form.${kind.ext}`).replace(/[\r\n"]/g, '').slice(0, 200)
  return { ok: true, file: { bytes, kind, fileName } }
}

/** Upload to the private store and insert the row. Caller has checked access. */
export async function storeAttachment(opts: {
  pharmacyId: string
  userId: string
  consultationRecordId?: string
  paperConsultationId?: string
  file: ValidatedFile
}): Promise<{ id: string }> {
  const { file } = opts
  const path = `consultation-attachments/${opts.pharmacyId}/${randomUUID()}.${file.kind.ext}`
  const blob = await put(path, Buffer.from(file.bytes), {
    access: 'private',
    contentType: file.kind.contentType,
  })
  let row: { id: string } | undefined
  try {
    const inserted = await db
      .insert(consultationAttachments)
      .values({
        pharmacyId: opts.pharmacyId,
        consultationRecordId: opts.consultationRecordId ?? null,
        paperConsultationId: opts.paperConsultationId ?? null,
        blobUrl: blob.url,
        fileName: file.fileName,
        contentType: file.kind.contentType,
        sizeBytes: file.bytes.length,
        uploadedByUserId: opts.userId,
      })
      .returning({ id: consultationAttachments.id })
    row = inserted[0]
  } catch (e) {
    // The file is in the store but has no row: remove it so no orphan is left.
    await deleteBlobsQuietly([blob.url], 'insert failed')
    throw e
  }
  if (!row) {
    await deleteBlobsQuietly([blob.url], 'insert returned nothing')
    throw new Error('Attachment insert returned no row')
  }
  return row
}

/** The live (not soft-deleted) parent of an attachment target, with its pharmacy. */
export async function findParent(target: { consultationRecordId?: string; paperConsultationId?: string }): Promise<{ pharmacyId: string } | null> {
  if (target.consultationRecordId) {
    const [r] = await db
      .select({ pharmacyId: consultationRecords.pharmacyId })
      .from(consultationRecords)
      .where(and(eq(consultationRecords.id, target.consultationRecordId), isNull(consultationRecords.deletedAt)))
      .limit(1)
    return r ?? null
  }
  if (target.paperConsultationId) {
    const [r] = await db
      .select({ pharmacyId: paperConsultations.pharmacyId })
      .from(paperConsultations)
      .where(and(eq(paperConsultations.id, target.paperConsultationId), isNull(paperConsultations.deletedAt)))
      .limit(1)
    return r ?? null
  }
  return null
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

