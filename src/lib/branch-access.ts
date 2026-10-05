import 'server-only'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pharmacies, userPharmacyAccess, users } from '@/lib/db/schema'

/**
 * Which branches a user may work at.
 *
 * Home branch (users.pharmacy_id) plus every row in user_pharmacy_access,
 * active pharmacies only. The session's pharmacyId is one of these; the
 * JWT update callback in src/lib/auth.ts refuses anything else, so a
 * forged "working at" request cannot reach another pharmacy's records.
 */

export interface WorkablePharmacy {
  id: string
  name: string
  slug: string | null
  groupSlug: string | null
  isHome: boolean
}

export async function workablePharmacies(userId: string): Promise<WorkablePharmacy[]> {
  const [u] = await db.select({ home: users.pharmacyId }).from(users).where(eq(users.id, userId)).limit(1)
  if (!u) return []
  const extra = await db
    .select({ pharmacyId: userPharmacyAccess.pharmacyId })
    .from(userPharmacyAccess)
    .where(eq(userPharmacyAccess.userId, userId))
  const ids = [...new Set([u.home, ...extra.map((e) => e.pharmacyId)].filter((x): x is string => !!x))]
  if (ids.length === 0) return []
  const rows = await db
    .select({ id: pharmacies.id, name: pharmacies.name, slug: pharmacies.slug, groupSlug: pharmacies.groupSlug })
    .from(pharmacies)
    .where(and(inArray(pharmacies.id, ids), eq(pharmacies.isActive, true)))
    .orderBy(pharmacies.name)
  return rows.map((r) => ({ ...r, isHome: r.id === u.home }))
}

/**
 * May this user work at this branch right now? Home, or a granted branch in
 * the same group as home. The group test is repeated here (not only when the
 * grant is made) so a grant left behind after a home-branch move to another
 * group can never be switched into.
 */
export async function canWorkAt(userId: string, pharmacyId: string): Promise<{ ok: true; slug: string | null } | { ok: false }> {
  const list = await workablePharmacies(userId)
  const hit = list.find((p) => p.id === pharmacyId)
  if (!hit) return { ok: false }
  if (hit.isHome) return { ok: true, slug: hit.slug }
  const [u] = await db
    .select({ homeGroup: pharmacies.groupSlug })
    .from(users)
    .leftJoin(pharmacies, eq(pharmacies.id, users.pharmacyId))
    .where(eq(users.id, userId))
    .limit(1)
  if (!u?.homeGroup || hit.groupSlug !== u.homeGroup) return { ok: false }
  return { ok: true, slug: hit.slug }
}

/**
 * Where a session should land when its current branch is no longer usable
 * (revoked, deactivated, or the home branch itself deactivated): home if it
 * is still active, otherwise the first branch they may still work at, else
 * null (nothing usable; the session keeps its home id and the normal
 * is_active / pharmacy checks apply).
 */
export async function fallbackBranch(userId: string): Promise<{ id: string; slug: string | null } | null> {
  const list = await workablePharmacies(userId)
  const home = list.find((p) => p.isHome)
  if (home) return { id: home.id, slug: home.slug }
  const first = list[0]
  return first ? { id: first.id, slug: first.slug } : null
}

/**
 * Move a user's home branch. Any grant that is now the home itself, or that
 * sits outside the new home's group, is removed in the same step so the
 * "same group as home" invariant survives the move.
 */
export async function rehomeUser(userId: string, newPharmacyId: string): Promise<void> {
  await db.update(users).set({ pharmacyId: newPharmacyId, updatedAt: new Date() }).where(eq(users.id, userId))
  const [target] = await db.select({ groupSlug: pharmacies.groupSlug }).from(pharmacies).where(eq(pharmacies.id, newPharmacyId)).limit(1)
  const grants = await db
    .select({ pharmacyId: userPharmacyAccess.pharmacyId, groupSlug: pharmacies.groupSlug })
    .from(userPharmacyAccess)
    .innerJoin(pharmacies, eq(pharmacies.id, userPharmacyAccess.pharmacyId))
    .where(eq(userPharmacyAccess.userId, userId))
  const stale = grants
    .filter((g) => g.pharmacyId === newPharmacyId || !target?.groupSlug || g.groupSlug !== target.groupSlug)
    .map((g) => g.pharmacyId)
  if (stale.length > 0) {
    await db.delete(userPharmacyAccess).where(and(eq(userPharmacyAccess.userId, userId), inArray(userPharmacyAccess.pharmacyId, stale)))
  }
}

/** Grant a branch. Refuses a branch outside the home branch's group. */
export async function grantBranch(userId: string, pharmacyId: string, grantedBy: string | null): Promise<{ ok: true } | { ok: false; error: string }> {
  const [u] = await db
    .select({ home: users.pharmacyId, homeGroup: pharmacies.groupSlug })
    .from(users)
    .leftJoin(pharmacies, eq(pharmacies.id, users.pharmacyId))
    .where(eq(users.id, userId))
    .limit(1)
  if (!u) return { ok: false, error: 'User not found' }
  if (u.home === pharmacyId) return { ok: false, error: 'That is already their home branch' }
  const [target] = await db.select({ groupSlug: pharmacies.groupSlug, isActive: pharmacies.isActive }).from(pharmacies).where(eq(pharmacies.id, pharmacyId)).limit(1)
  if (!target || !target.isActive) return { ok: false, error: 'Pharmacy not found' }
  if (!u.homeGroup || target.groupSlug !== u.homeGroup) return { ok: false, error: 'A pharmacist can only be given branches in the same group as their home branch' }
  await db.insert(userPharmacyAccess).values({ userId, pharmacyId, grantedBy }).onConflictDoNothing()
  return { ok: true }
}

export async function revokeBranch(userId: string, pharmacyId: string): Promise<void> {
  await db.delete(userPharmacyAccess).where(and(eq(userPharmacyAccess.userId, userId), eq(userPharmacyAccess.pharmacyId, pharmacyId)))
}

/** Extra branches per user, for a staff list. */
export async function extraBranchesFor(userIds: string[]): Promise<Map<string, Array<{ id: string; name: string }>>> {
  const out = new Map<string, Array<{ id: string; name: string }>>()
  if (userIds.length === 0) return out
  const rows = await db
    .select({ userId: userPharmacyAccess.userId, id: pharmacies.id, name: pharmacies.name })
    .from(userPharmacyAccess)
    .innerJoin(pharmacies, eq(pharmacies.id, userPharmacyAccess.pharmacyId))
    .where(inArray(userPharmacyAccess.userId, userIds))
  for (const r of rows) out.set(r.userId, [...(out.get(r.userId) ?? []), { id: r.id, name: r.name }])
  return out
}

/**
 * The branches a pharmacy_admin manages: every active pharmacy sharing the
 * group_slug of the branch they are working at (or just that branch when it
 * has no group).
 */
export async function managedBranches(pharmacyId: string): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
  const [p] = await db.select({ id: pharmacies.id, name: pharmacies.name, groupSlug: pharmacies.groupSlug, isActive: pharmacies.isActive }).from(pharmacies).where(eq(pharmacies.id, pharmacyId)).limit(1)
  if (!p) return []
  if (!p.groupSlug) return [{ id: p.id, name: p.name, isActive: p.isActive }]
  // Inactive branches are included (flagged) so staff homed there can still
  // be seen and moved; grantBranch refuses them as an extra branch.
  return db
    .select({ id: pharmacies.id, name: pharmacies.name, isActive: pharmacies.isActive })
    .from(pharmacies)
    .where(eq(pharmacies.groupSlug, p.groupSlug))
    .orderBy(pharmacies.name)
}
