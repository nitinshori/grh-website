import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationDrafts } from '@/lib/db/schema'
import { eq, and, desc, gt } from 'drizzle-orm'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const DRAFT_TTL_DAYS = 7

/**
 * GET /api/consultation-drafts
 * Returns the live (non-expired) drafts for the caller's pharmacy.
 * Lightweight payload — does NOT include the full draft_state blob.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const now = new Date()
  const rows = await db
    .select({
      id: consultationDrafts.id,
      pgdSlug: consultationDrafts.pgdSlug,
      patientFirstName: consultationDrafts.patientFirstName,
      patientLastName: consultationDrafts.patientLastName,
      patientDob: consultationDrafts.patientDob,
      note: consultationDrafts.note,
      createdAt: consultationDrafts.createdAt,
      updatedAt: consultationDrafts.updatedAt,
      expiresAt: consultationDrafts.expiresAt,
      createdByUserId: consultationDrafts.createdByUserId,
    })
    .from(consultationDrafts)
    .where(
      and(
        eq(consultationDrafts.pharmacyId, session.user.pharmacyId),
        gt(consultationDrafts.expiresAt, now)
      )
    )
    .orderBy(desc(consultationDrafts.updatedAt))

  return NextResponse.json({ drafts: rows })
}

/**
 * POST /api/consultation-drafts
 * Body: { pgdSlug, patientFirstName?, patientLastName?, patientDob?, draftState, note? }
 * Creates a new draft. Returns { id }.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    pgdSlug?: string
    patientFirstName?: string
    patientLastName?: string
    patientDob?: string
    draftState?: unknown
    note?: string
  } | null

  if (!body || typeof body.pgdSlug !== 'string' || !body.draftState) {
    return NextResponse.json({ error: 'pgdSlug and draftState required' }, { status: 400 })
  }

  // Cap draft state at 256 KB to prevent abuse.
  const stateJson = JSON.stringify(body.draftState)
  if (stateJson.length > 256 * 1024) {
    return NextResponse.json({ error: 'Draft state too large' }, { status: 413 })
  }

  const expiresAt = new Date(Date.now() + DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000)

  const [created] = await db
    .insert(consultationDrafts)
    .values({
      pharmacyId: session.user.pharmacyId,
      createdByUserId: session.user.id,
      pgdSlug: body.pgdSlug,
      patientFirstName: body.patientFirstName?.slice(0, 100) ?? null,
      patientLastName: body.patientLastName?.slice(0, 100) ?? null,
      patientDob: body.patientDob?.slice(0, 10) ?? null,
      draftState: stateJson,
      note: body.note?.slice(0, 1000) ?? null,
      expiresAt,
    })
    .returning({ id: consultationDrafts.id })

  await audit({
    pharmacyId: session.user.pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email ?? undefined,
    action: 'record_create',
    recordId: created.id,
    details: { kind: 'draft', pgdSlug: body.pgdSlug },
    request,
  })

  return NextResponse.json({ id: created.id })
}
