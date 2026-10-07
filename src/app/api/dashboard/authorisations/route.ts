import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { myAuthorisations, signAuthorisations } from '@/lib/authorisations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CAN_SIGN = new Set(['pharmacist', 'pharmacy_admin'])

/** GET: the signed-in practitioner's status for every PGD at the branch they are working at. */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!CAN_SIGN.has(session.user.role) || !session.user.pharmacyId) return NextResponse.json({ rows: [] })
  return NextResponse.json({ rows: await myAuthorisations(session.user.id, session.user.pharmacyId) })
}

/**
 * POST { slugs: string[], signedName: string, gphcNumber?: string }
 * Signs the practitioner declaration for the current version of each PGD.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!CAN_SIGN.has(session.user.role)) return NextResponse.json({ error: 'Only pharmacists and pharmacy admins sign PGD authorisations' }, { status: 403 })
  if (!session.user.pharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 })
  const body = (await req.json().catch(() => null)) as { slugs?: unknown; signedName?: unknown; gphcNumber?: unknown } | null
  if (!body || !Array.isArray(body.slugs)) return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  const slugs = body.slugs.filter((s): s is string => typeof s === 'string').slice(0, 200)
  const r = await signAuthorisations({
    userId: session.user.id,
    pharmacyId: session.user.pharmacyId,
    slugs,
    signedName: typeof body.signedName === 'string' ? body.signedName : '',
    gphcNumber: typeof body.gphcNumber === 'string' ? body.gphcNumber : null,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null,
    userAgent: req.headers.get('user-agent'),
  })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  if (r.signed.length) {
    await audit({
      action: 'practitioner_signed',
      userId: session.user.id,
      userEmail: session.user.email,
      pharmacyId: session.user.pharmacyId,
      recordCount: r.signed.length,
      request: req,
      details: { signed: r.signed, skipped: r.skipped },
    })
  }
  return NextResponse.json({ ok: true, signed: r.signed.length, skipped: r.skipped.length })
}
