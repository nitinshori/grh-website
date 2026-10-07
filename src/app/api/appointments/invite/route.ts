import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { db } from '@/lib/db'
import { patientInvites } from '@/lib/db/schema'
import { getAccessiblePharmacyIds } from '@/lib/access-pharmacies'
import { sendPatientInvite } from '@/lib/appointment-emails'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const STAFF = new Set(['pharmacist', 'pharmacy_admin', 'super_admin'])

/** GET: the last 50 invites sent by this pharmacy (or group). */
export async function GET() {
  const session = await auth()
  if (!session?.user || !STAFF.has(session.user.role) || !session.user.pharmacyId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const ids = await getAccessiblePharmacyIds(session.user.pharmacyId)
  const rows = await db
    .select({ id: patientInvites.id, toEmail: patientInvites.toEmail, patientName: patientInvites.patientName, serviceName: patientInvites.serviceName, sentAt: patientInvites.sentAt, error: patientInvites.error })
    .from(patientInvites)
    .where(inArray(patientInvites.pharmacyId, ids))
    .orderBy(desc(patientInvites.sentAt))
    .limit(50)
  return NextResponse.json({ invites: rows })
}

/**
 * POST { toEmail, patientName?, serviceName?, message?, pharmacyId? }
 * Emails the patient the pharmacy's booking link. Up to 20 per call is
 * plenty for a counter; bulk mailing is not what this is for.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !STAFF.has(session.user.role) || !session.user.pharmacyId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { toEmail?: unknown; patientName?: unknown; serviceName?: unknown; message?: unknown; pharmacyId?: unknown } | null
  if (!body || typeof body.toEmail !== 'string') return NextResponse.json({ error: 'Email address required' }, { status: 400 })
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
  const accessible = await getAccessiblePharmacyIds(session.user.pharmacyId)
  const pharmacyId = typeof body.pharmacyId === 'string' && accessible.includes(body.pharmacyId) ? body.pharmacyId : session.user.pharmacyId
  const r = await sendPatientInvite({
    pharmacyId,
    sentByUserId: session.user.id,
    toEmail: body.toEmail,
    patientName: str(body.patientName, 255),
    serviceName: str(body.serviceName, 255),
    message: str(body.message, 1000),
  })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  await audit({ action: 'patient_invite_sent', userId: session.user.id, userEmail: session.user.email, pharmacyId, request: req, details: { service: str(body.serviceName, 255) } })
  return NextResponse.json({ ok: true, to: r.to, bookingUrl: r.bookingUrl })
}
