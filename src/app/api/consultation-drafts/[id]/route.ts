import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationDrafts } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/consultation-drafts/[id]
 * Returns the full draft including the draft_state blob, scoped to caller's
 * pharmacy. Used by the PGD client to resume a draft.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { id } = await params

  const [draft] = await db
    .select()
    .from(consultationDrafts)
    .where(
      and(
        eq(consultationDrafts.id, id),
        eq(consultationDrafts.pharmacyId, session.user.pharmacyId),
        gt(consultationDrafts.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!draft) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: draft.id,
    pgdSlug: draft.pgdSlug,
    patientFirstName: draft.patientFirstName,
    patientLastName: draft.patientLastName,
    patientDob: draft.patientDob,
    note: draft.note,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    expiresAt: draft.expiresAt,
    draftState: JSON.parse(draft.draftState) as unknown,
  })
}

/**
 * PATCH /api/consultation-drafts/[id]
 * Update an existing draft (used when handing off mid-consultation).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { id } = await params

  const body = await request.json().catch(() => null) as {
    patientFirstName?: string
    patientLastName?: string
    patientDob?: string
    draftState?: unknown
    note?: string
  } | null
  if (!body) return NextResponse.json({ error: 'Bad body' }, { status: 400 })

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (typeof body.patientFirstName === 'string') updates.patientFirstName = body.patientFirstName.slice(0, 100)
  if (typeof body.patientLastName === 'string') updates.patientLastName = body.patientLastName.slice(0, 100)
  if (typeof body.patientDob === 'string') updates.patientDob = body.patientDob.slice(0, 10)
  if (typeof body.note === 'string') updates.note = body.note.slice(0, 1000)
  if (body.draftState !== undefined) {
    const stateJson = JSON.stringify(body.draftState)
    if (stateJson.length > 256 * 1024) {
      return NextResponse.json({ error: 'Draft state too large' }, { status: 413 })
    }
    updates.draftState = stateJson
  }

  const [updated] = await db
    .update(consultationDrafts)
    .set(updates)
    .where(
      and(
        eq(consultationDrafts.id, id),
        eq(consultationDrafts.pharmacyId, session.user.pharmacyId)
      )
    )
    .returning({ id: consultationDrafts.id })

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: updated.id })
}

/**
 * DELETE /api/consultation-drafts/[id]
 * Hard-delete the draft (e.g. once converted to a final consultation, or
 * manually discarded by the pharmacist).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
  const { id } = await params

  const [deleted] = await db
    .delete(consultationDrafts)
    .where(
      and(
        eq(consultationDrafts.id, id),
        eq(consultationDrafts.pharmacyId, session.user.pharmacyId)
      )
    )
    .returning({ id: consultationDrafts.id })

  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await audit({
    pharmacyId: session.user.pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: 'record_purge',
    recordId: deleted.id,
    details: { kind: 'draft' },
    request,
  })

  return NextResponse.json({ ok: true })
}
