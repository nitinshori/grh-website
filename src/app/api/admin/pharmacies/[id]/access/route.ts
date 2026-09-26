import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies, users } from '@/lib/db/schema'
import {
  getPharmacyPgdSlugs,
  getPharmacyNonApprovedSlugs,
  hasPharmacyPgdAccess,
  isViewOnlyUser,
} from '@/lib/pgd-queries'
import { ALL_PGDS } from '@/lib/pgd-access'

/**
 * GET /api/admin/pharmacies/[id]/access?tool=acne
 *
 * What a user of this pharmacy would see, computed with the same functions
 * the dashboard, the ePGD index and the per-tool gate use. Added 24 Sep
 * 2026 after a HubRx integrator reported an empty ePGD list on a pharmacy
 * that, by every rule on our side, holds the whole catalogue: without this
 * the only ways to check were to borrow the customer's login or read the
 * request log, which on the current Vercel plan is gone within an hour.
 *
 * Read only. Super admin only. Does not create a session for anyone.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const tool = request.nextUrl.searchParams.get('tool') ?? 'acne'

  const [pharmacy] = await db
    .select({ id: pharmacies.id, name: pharmacies.name, authSource: pharmacies.authSource, isActive: pharmacies.isActive })
    .from(pharmacies)
    .where(eq(pharmacies.id, id))
    .limit(1)
  if (!pharmacy) return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })

  const members = await db
    .select({ id: users.id, email: users.email, role: users.role, isActive: users.isActive, authSource: users.authSource, pharmacyId: users.pharmacyId })
    .from(users)
    .where(eq(users.pharmacyId, id))

  const allowed = await getPharmacyPgdSlugs(id)
  const nonApproved = await getPharmacyNonApprovedSlugs(id)
  const toolAllowed = await hasPharmacyPgdAccess(id, tool)
  const catalogueSize = ALL_PGDS.length

  const userViews = await Promise.all(
    members.map(async (u) => ({
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      authSource: u.authSource,
      viewOnly: await isViewOnlyUser(u.id),
      // What the ePGD index and the dashboard would list for this user.
      epgdIndexCount: u.role === 'super_admin' ? catalogueSize : allowed.length,
      dashboardMessage:
        allowed.length === 0 && u.role !== 'super_admin' ? 'No ePGDs assigned yet' : null,
      toolGate: { tool, allowed: u.role === 'super_admin' ? true : toolAllowed },
    })),
  )

  return NextResponse.json({
    pharmacy,
    fullCatalogue: allowed.length === catalogueSize && nonApproved.length === 0,
    allowedCount: allowed.length,
    catalogueSize,
    allowedSample: allowed.slice(0, 8),
    nonApprovedCount: nonApproved.length,
    users: userViews,
  })
}
