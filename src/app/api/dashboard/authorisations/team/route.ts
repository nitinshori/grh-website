import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { db } from '@/lib/db'
import { pharmacies } from '@/lib/db/schema'
import { managedBranches } from '@/lib/branch-access'
import { countersign, pendingCountersignIds, revokeAuthorisation, teamAuthorisations, UUID_RE } from '@/lib/authorisations'
import { renderAuthorisationRegister } from '@/lib/authorisation-register-pdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Manager side of practitioner authorisation.
 *
 * Scope: a pharmacy_admin manages every branch of the group of the branch
 * they are working at; super_admin passes ?pharmacyId= for any pharmacy.
 *
 * GET  ?pharmacyId=            team matrix (JSON)
 * GET  ?pharmacyId=&format=pdf the register for that one branch
 * POST { action: 'countersign', ids?: string[] }   ids omitted = all pending in scope
 * POST { action: 'revoke', id, reason? }
 */
async function scope(session: { user: { id: string; role: string; pharmacyId: string | null } }, requested: string | null): Promise<{ ids: string[]; branches: Array<{ id: string; name: string }> } | null> {
  if (session.user.role === 'super_admin') {
    if (!requested) return null
    const b = await managedBranches(requested)
    return { ids: b.map((x) => x.id), branches: b }
  }
  if (session.user.role !== 'pharmacy_admin' || !session.user.pharmacyId) return null
  const b = await managedBranches(session.user.pharmacyId)
  return { ids: b.map((x) => x.id), branches: b }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const requested = req.nextUrl.searchParams.get('pharmacyId')
  const sc = await scope(session, requested)
  if (!sc) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (req.nextUrl.searchParams.get('format') === 'pdf') {
    const target = requested && sc.ids.includes(requested) ? requested : session.user.pharmacyId
    if (!target || !sc.ids.includes(target)) return NextResponse.json({ error: 'Choose a branch in your group' }, { status: 400 })
    const [ph] = await db.select({ name: pharmacies.name, address: pharmacies.address }).from(pharmacies).where(eq(pharmacies.id, target)).limit(1)
    const members = await teamAuthorisations([target], { versionsFor: target })
    const pdf = await renderAuthorisationRegister({ pharmacyName: ph?.name ?? 'Pharmacy', pharmacyAddress: ph?.address ?? null, members, generatedBy: session.user.name ?? session.user.email })
    await audit({ action: 'authorisation_register_export', userId: session.user.id, userEmail: session.user.email, pharmacyId: target, recordCount: members.length, request: req })
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="authorisation-register-${(ph?.name ?? 'pharmacy').replace(/[^\w-]+/g, '-').toLowerCase()}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  }

  const members = await teamAuthorisations(sc.ids)
  return NextResponse.json({ branches: sc.branches, members })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as { action?: string; ids?: unknown; id?: unknown; reason?: unknown; pharmacyId?: unknown } | null
  if (!body?.action) return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  const sc = await scope(session, typeof body.pharmacyId === 'string' ? body.pharmacyId : null)
  if (!sc) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const byName = session.user.name ?? session.user.email

  if (body.action === 'countersign') {
    const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string').slice(0, 500) : await pendingCountersignIds(sc.ids)
    const done = await countersign({ ids, pharmacyIds: sc.ids, byUserId: session.user.id, byName })
    if (done.length) await audit({ action: 'practitioner_countersigned', userId: session.user.id, userEmail: session.user.email, pharmacyId: session.user.pharmacyId, recordCount: done.length, request: req, details: { ids: done.slice(0, 200) } })
    return NextResponse.json({ ok: true, countersigned: done.length })
  }
  if (body.action === 'revoke') {
    if (typeof body.id !== 'string' || !UUID_RE.test(body.id)) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim().slice(0, 500) : null
    const ok = await revokeAuthorisation({ id: body.id, pharmacyIds: sc.ids, byUserId: session.user.id, reason })
    if (!ok) return NextResponse.json({ error: 'Not found or already withdrawn' }, { status: 404 })
    await audit({ action: 'practitioner_authorisation_revoked', userId: session.user.id, userEmail: session.user.email, pharmacyId: session.user.pharmacyId, recordId: body.id, request: req, details: { reason } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
