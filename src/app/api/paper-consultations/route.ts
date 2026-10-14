import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { paperConsultations } from '@/lib/db/schema'
import { audit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { getPharmacyPgdSlugs } from '@/lib/pgd-queries'
import { ALL_PGDS } from '@/lib/pgd-access'
import { hasRecordRole, storeAttachment, validateAttachment } from '@/lib/consultation-attachments'
import { PAPER_OUTCOMES, type PaperOutcome } from '@/lib/paper-consultations-shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isRealDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

function text(form: FormData, key: string, max: number): string {
  return String(form.get(key) ?? '').trim().slice(0, max)
}

/**
 * POST /api/paper-consultations: record a consultation done on the printed
 * patient form. Not checked against the PGD by the tool.
 *
 * multipart/form-data with the fields below and `file`, the first scan of
 * the paper form (required). Further scans go to
 * POST /api/consultation-attachments with paperConsultationId, one per
 * request, so each request stays under the 4.5 MB body limit.
 *
 * Access: signed in as pharmacist, pharmacy_admin or super_admin, working at a pharmacy (the record
 * belongs to the session's branch, as tool records do). The PGD must be one
 * the pharmacy holds (super_admin: any).
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.pharmacyId) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
  }
  if (!hasRecordRole(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const pharmacyId = session.user.pharmacyId
  const limited = rateLimit(`paper:${session.user.id}`, 30, 60_000)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'That file is too large. Please use a file under 4 MB.' }, { status: 400 })
  }

  const pgdSlug = text(form, 'pgdSlug', 255)
  const consultationDate = text(form, 'consultationDate', 10)
  const patientName = text(form, 'patientName', 255)
  const patientDob = text(form, 'patientDob', 10)
  const outcome = text(form, 'outcome', 20) as PaperOutcome
  const product = text(form, 'product', 255)
  const dose = text(form, 'dose', 255)
  const batch = text(form, 'batch', 100)
  const batchExpiry = text(form, 'batchExpiry', 10)
  const pharmacistName = text(form, 'pharmacistName', 255)
  const pharmacistGphc = text(form, 'pharmacistGphc', 50)
  const notes = String(form.get('notes') ?? '').trim().slice(0, 5000)

  const held =
    session.user.role === 'super_admin'
      ? new Set(ALL_PGDS.map((p) => p.slug))
      : new Set(await getPharmacyPgdSlugs(pharmacyId))
  if (!pgdSlug || !held.has(pgdSlug)) {
    return NextResponse.json({ error: 'Please choose one of your pharmacy’s PGDs.' }, { status: 400 })
  }
  // Today in the UK, not UTC (around midnight in BST they differ).
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date())
  if (!isRealDate(consultationDate) || consultationDate > today) {
    return NextResponse.json({ error: 'Please enter the date of the consultation (not in the future).' }, { status: 400 })
  }
  if (!patientName) {
    return NextResponse.json({ error: 'Please enter the patient’s name.' }, { status: 400 })
  }
  if (!isRealDate(patientDob) || patientDob > consultationDate) {
    return NextResponse.json({ error: 'Please enter a valid date of birth.' }, { status: 400 })
  }
  if (!PAPER_OUTCOMES.includes(outcome)) {
    return NextResponse.json({ error: 'Please choose the outcome.' }, { status: 400 })
  }
  if ((outcome === 'supplied' || outcome === 'administered') && !product) {
    return NextResponse.json({ error: 'Please enter the product supplied or given.' }, { status: 400 })
  }
  if (batchExpiry && !isRealDate(batchExpiry)) {
    return NextResponse.json({ error: 'Please enter a valid batch expiry date.' }, { status: 400 })
  }
  if (!pharmacistName || !pharmacistGphc) {
    return NextResponse.json({ error: 'Pharmacist name and GPhC number are required.' }, { status: 400 })
  }

  const checked = await validateAttachment(form.get('file'))
  if (!checked.ok) {
    const error = form.get('file') ? checked.error : 'Please attach the scanned paper form.'
    return NextResponse.json({ error }, { status: 400 })
  }

  const [row] = await db
    .insert(paperConsultations)
    .values({
      pharmacyId,
      createdByUserId: session.user.id,
      pgdSlug,
      consultationDate,
      patientName,
      patientDob,
      outcome,
      product: product || null,
      dose: dose || null,
      batch: batch || null,
      batchExpiry: batchExpiry || null,
      pharmacistName,
      pharmacistGphc,
      notes: notes || null,
    })
    .returning({ id: paperConsultations.id })

  // No transactions on neon-http: if the required scan cannot be stored,
  // remove the row we have just written so no paper record exists without
  // its paper form. storeAttachment() removes the uploaded file itself if
  // its row insert fails, so no orphan file is left either.
  let attachment: { id: string }
  try {
    attachment = await storeAttachment({
      pharmacyId,
      userId: session.user.id,
      paperConsultationId: row.id,
      file: checked.file,
    })
  } catch (e) {
    console.error(`[paper-consultations] upload failed for ${row.id}:`, e instanceof Error ? e.message : e)
    await db.delete(paperConsultations).where(eq(paperConsultations.id, row.id)).catch(() => {})
    return NextResponse.json({ error: 'The upload failed, so nothing was saved. Please try again.' }, { status: 502 })
  }

  await audit({
    pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email || null,
    action: 'paper_consultation_recorded',
    recordId: row.id,
    details: { pgdSlug, outcome },
    request,
  })
  await audit({
    pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email || null,
    action: 'consultation_attachment_added',
    recordId: row.id,
    details: {
      attachmentId: attachment.id,
      parent: 'paper_consultation',
      contentType: checked.file.kind.contentType,
      sizeBytes: checked.file.bytes.length,
    },
    request,
  })

  return NextResponse.json({ success: true, id: row.id })
}
