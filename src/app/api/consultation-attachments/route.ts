import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import {
  UUID_RE,
  canAccessPharmacyRecords,
  findParent,
  storeAttachment,
  validateAttachment,
} from '@/lib/consultation-attachments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * POST /api/consultation-attachments: attach one scan or photo of a signed
 * paper form to a saved ePGD record or a paper consultation.
 *
 * multipart/form-data: file, and exactly one of consultationRecordId or
 * paperConsultationId. One file per request: the browser compresses photos
 * first so each request stays under Vercel's 4.5 MB body limit.
 *
 * Access: canAccessPharmacyRecords() on the parent's pharmacy (pharmacist or
 * pharmacy_admin at the branch being worked at, or super_admin).
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
  }
  const limited = rateLimit(`attach:${session.user.id}`, 60, 60_000)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many uploads. Please wait a minute.' }, { status: 429 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'That file is too large. Please use a file under 4 MB.' }, { status: 400 })
  }

  const consultationRecordId = String(form.get('consultationRecordId') ?? '').trim() || undefined
  const paperConsultationId = String(form.get('paperConsultationId') ?? '').trim() || undefined
  if (!!consultationRecordId === !!paperConsultationId) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 400 })
  }
  const targetId = (consultationRecordId ?? paperConsultationId)!
  if (!UUID_RE.test(targetId)) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 })
  }

  const parent = await findParent({ consultationRecordId, paperConsultationId })
  if (!parent || !(await canAccessPharmacyRecords(session.user, parent.pharmacyId))) {
    return NextResponse.json({ error: 'Record not found.' }, { status: 404 })
  }

  const checked = await validateAttachment(form.get('file'))
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 })
  }

  let created: { id: string }
  try {
    created = await storeAttachment({
      pharmacyId: parent.pharmacyId,
      userId: session.user.id,
      consultationRecordId,
      paperConsultationId,
      file: checked.file,
    })
  } catch (e) {
    console.error(`[attachments] upload failed for ${targetId}:`, e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 502 })
  }

  await audit({
    pharmacyId: parent.pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email || null,
    action: 'consultation_attachment_added',
    recordId: targetId,
    details: {
      attachmentId: created.id,
      parent: consultationRecordId ? 'consultation_record' : 'paper_consultation',
      contentType: checked.file.kind.contentType,
      sizeBytes: checked.file.bytes.length,
    },
    request,
  })

  return NextResponse.json({
    attachment: {
      id: created.id,
      fileName: checked.file.fileName,
      contentType: checked.file.kind.contentType,
      sizeBytes: checked.file.bytes.length,
    },
  })
}
