import { NextResponse } from 'next/server'
import { count, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationAttachments } from '@/lib/db/schema'
import { audit } from '@/lib/audit'
import { UUID_RE, deleteBlobsQuietly, findParent } from '@/lib/consultation-attachments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * DELETE /api/consultation-attachments/[id]: remove one scan of a paper form.
 *
 * pharmacy_admin or super_admin, working at the attachment's pharmacy this
 * session. JSON body { reason } is required. A paper consultation must keep
 * at least one scan, so its last one cannot be removed here: delete the
 * whole record instead. The row goes first, then the file (best effort).
 */
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !session.user.pharmacyId) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
  }
  if (session.user.role !== 'pharmacy_admin' && session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await ctx.params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'File not found.' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const reason = String(body?.reason ?? '').trim().slice(0, 255)
  if (reason.length < 3) {
    return NextResponse.json({ error: 'Please give a reason.' }, { status: 400 })
  }

  const [a] = await db
    .select()
    .from(consultationAttachments)
    .where(eq(consultationAttachments.id, id))
    .limit(1)
  if (!a || a.pharmacyId !== session.user.pharmacyId) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }
  const parent = await findParent({
    consultationRecordId: a.consultationRecordId ?? undefined,
    paperConsultationId: a.paperConsultationId ?? undefined,
  })
  if (!parent) return NextResponse.json({ error: 'File not found.' }, { status: 404 })

  if (a.paperConsultationId) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(consultationAttachments)
      .where(eq(consultationAttachments.paperConsultationId, a.paperConsultationId))
    if (Number(n) <= 1) {
      return NextResponse.json(
        { error: 'A paper record must keep at least one scan. To remove it, delete the whole record instead.' },
        { status: 409 },
      )
    }
  }

  const removed = await db
    .delete(consultationAttachments)
    .where(eq(consultationAttachments.id, id))
    .returning({ id: consultationAttachments.id })
  if (removed.length === 0) {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 })
  }
  await deleteBlobsQuietly([a.blobUrl], `attachment ${a.id}`)

  await audit({
    pharmacyId: a.pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email || null,
    action: 'record_purge',
    recordId: a.consultationRecordId ?? a.paperConsultationId,
    details: {
      kind: 'consultation_attachment',
      attachmentId: a.id,
      consultationRecordId: a.consultationRecordId,
      paperConsultationId: a.paperConsultationId,
      reason,
    },
    request,
  })

  return NextResponse.json({ success: true })
}
