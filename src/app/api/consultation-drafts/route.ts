import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationDrafts } from '@/lib/db/schema'
import { eq, and, desc, gt } from 'drizzle-orm'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const DRAFT_TTL_DAYS = 30

/**
 * GET /api/consultation-drafts
 * Returns the live (non-expired) drafts for the caller's pharmacy.
 * Includes both 'in_progress' drafts and 'phone_booking' records.
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
      bookingType: consultationDrafts.bookingType,
      patientFirstName: consultationDrafts.patientFirstName,
      patientLastName: consultationDrafts.patientLastName,
      patientDob: consultationDrafts.patientDob,
      patientPhone: consultationDrafts.patientPhone,
      expectedVisitDate: consultationDrafts.expectedVisitDate,
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
 * Two modes:
 *   • in_progress (default): body must include draftState (the PGD form blob).
 *   • phone_booking: bookingType='phone_booking'; draftState defaults to '{}'
 *     and the body carries patient details + expected visit date.
 * Returns { id }.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.pharmacyId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as {
    pgdSlug?: string
    bookingType?: 'in_progress' | 'phone_booking'
    patientFirstName?: string
    patientLastName?: string
    patientDob?: string
    patientPhone?: string
    expectedVisitDate?: string
    draftState?: unknown
    note?: string
  } | null

  if (!body || typeof body.pgdSlug !== 'string') {
    return NextResponse.json({ error: 'pgdSlug required' }, { status: 400 })
  }

  const bookingType = body.bookingType === 'phone_booking' ? 'phone_booking' : 'in_progress'

  // For in-progress drafts, draftState must be present. For phone bookings
  // it's optional — store an empty object so the not-null constraint holds.
  let stateJson: string
  if (bookingType === 'phone_booking') {
    stateJson = body.draftState ? JSON.stringify(body.draftState) : '{}'
  } else {
    if (!body.draftState) {
      return NextResponse.json({ error: 'draftState required for in_progress drafts' }, { status: 400 })
    }
    stateJson = JSON.stringify(body.draftState)
  }

  // Cap draft state at 256 KB to prevent abuse.
  if (stateJson.length > 256 * 1024) {
    return NextResponse.json({ error: 'Draft state too large' }, { status: 413 })
  }

  // Validate expectedVisitDate format (YYYY-MM-DD).
  const expectedVisitDate =
    typeof body.expectedVisitDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.expectedVisitDate)
      ? body.expectedVisitDate
      : null

  const expiresAt = new Date(Date.now() + DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000)

  const [created] = await db
    .insert(consultationDrafts)
    .values({
      pharmacyId: session.user.pharmacyId,
      createdByUserId: session.user.id,
      pgdSlug: body.pgdSlug,
      bookingType,
      patientFirstName: body.patientFirstName?.slice(0, 100) ?? null,
      patientLastName: body.patientLastName?.slice(0, 100) ?? null,
      patientDob: body.patientDob?.slice(0, 10) ?? null,
      patientPhone: body.patientPhone?.slice(0, 50) ?? null,
      expectedVisitDate,
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
    details: { kind: bookingType === 'phone_booking' ? 'phone_booking' : 'draft', pgdSlug: body.pgdSlug },
    request,
  })

  return NextResponse.json({ id: created.id })
}
