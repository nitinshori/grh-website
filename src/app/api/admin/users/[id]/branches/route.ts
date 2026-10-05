import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { grantBranch, revokeBranch, workablePharmacies } from '@/lib/branch-access'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * Super admin: the branches a user may work at (migration 073).
 *   GET                       list (home flagged)
 *   POST   { pharmacyId }     grant an extra branch in the same group
 *   DELETE { pharmacyId }     revoke it
 * Pharmacy admins use /api/dashboard/staff for their own group.
 */
async function guard() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') return null
  return session
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  return NextResponse.json({ branches: await workablePharmacies(id) })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => null) as { pharmacyId?: string } | null
  if (!body?.pharmacyId) return NextResponse.json({ error: 'pharmacyId required' }, { status: 400 })
  const r = await grantBranch(id, body.pharmacyId, session.user.id)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  await audit({ action: 'branch_access_changed', userId: session.user.id, details: { branchGranted: body.pharmacyId, toUser: id } })
  return NextResponse.json({ ok: true, branches: await workablePharmacies(id) })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => null) as { pharmacyId?: string } | null
  if (!body?.pharmacyId) return NextResponse.json({ error: 'pharmacyId required' }, { status: 400 })
  await revokeBranch(id, body.pharmacyId)
  await audit({ action: 'branch_access_changed', userId: session.user.id, details: { branchRevoked: body.pharmacyId, fromUser: id } })
  return NextResponse.json({ ok: true, branches: await workablePharmacies(id) })
}
