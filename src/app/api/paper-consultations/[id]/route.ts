import { NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { paperConsultations } from '@/lib/db/schema'
import { audit } from '@/lib/audit'
import { UUID_RE } from '@/lib/consultation-attachments'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/paper-consultations/[id]: soft-delete a paper consultation.
 * Same rules as DELETE /api/consultation-records/[id]: pharmacy_admin or
 * super_admin, the session's branch only, a reason is required.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !session.user.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  // Allow-list: pharmacist cannot delete; client, prospect and others never.
  if (session.user.role !== 'pharmacy_admin' && session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const reason = (body?.reason || '').toString().trim().slice(0, 255)
  if (!reason) {
    return NextResponse.json({ error: 'A reason is required (e.g. "patient erasure request")' }, { status: 400 })
  }

  const result = await db
    .update(paperConsultations)
    .set({ deletedAt: new Date(), deletedBy: session.user.id, deletedReason: reason })
    .where(
      and(
        eq(paperConsultations.id, id),
        eq(paperConsultations.pharmacyId, session.user.pharmacyId),
        isNull(paperConsultations.deletedAt),
      ),
    )
    .returning({ id: paperConsultations.id })
  if (result.length === 0) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  await audit({
    pharmacyId: session.user.pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email || null,
    action: 'record_soft_delete',
    recordId: id,
    details: { kind: 'paper_consultation', reason },
    request,
  })
  return NextResponse.json({ success: true })
}
