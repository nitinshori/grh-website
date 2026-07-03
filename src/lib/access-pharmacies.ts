import { db } from '@/lib/db'
import { pharmacies } from '@/lib/db/schema'
import { eq, isNotNull, and } from 'drizzle-orm'

// ─────────────────────────────────────────────────────────────────────────
// Group access model.
//
// A pharmacy can belong to a "group" via `group_slug` (e.g. Pritchards
// Meliden and Pritchards Victoria Road both have group_slug='pritchards').
// A user attached to any pharmacy in a group can see + book appointments
// at ALL pharmacies in that group. Perfect for multi-branch pharmacies
// where staff move between sites and need a unified diary.
//
// If a pharmacy has no group_slug the "group" is just itself — a single
// row, so nothing changes for existing standalone pharmacies.
//
// Also exposes helpers to figure out if a session is in an
// appointments-only group (e.g. Pritchards, who don't run PGDs) so the
// UI can hide ePGD nav items etc.
// ─────────────────────────────────────────────────────────────────────────

export interface AccessiblePharmacy {
  id: string
  name: string
  slug: string | null
  groupSlug: string | null
  brandColor: string | null
}

/**
 * Returns every pharmacy the given user can see + book at.
 *
 * If their pharmacy has no group_slug: just that one pharmacy.
 * If it does: all pharmacies sharing that group_slug.
 *
 * Ordered by name so the UI list is stable.
 */
export async function getAccessiblePharmacies(
  userPharmacyId: string,
): Promise<AccessiblePharmacy[]> {
  // First look up the user's own pharmacy to get its group_slug
  const [own] = await db
    .select({
      id: pharmacies.id,
      name: pharmacies.name,
      slug: pharmacies.slug,
      groupSlug: pharmacies.groupSlug,
      brandColor: pharmacies.brandColor,
    })
    .from(pharmacies)
    .where(eq(pharmacies.id, userPharmacyId))
    .limit(1)

  if (!own) return []
  if (!own.groupSlug) return [own]

  // Fetch all pharmacies in the same group
  const groupRows = await db
    .select({
      id: pharmacies.id,
      name: pharmacies.name,
      slug: pharmacies.slug,
      groupSlug: pharmacies.groupSlug,
      brandColor: pharmacies.brandColor,
    })
    .from(pharmacies)
    .where(
      and(
        eq(pharmacies.groupSlug, own.groupSlug),
        eq(pharmacies.isActive, true),
      ),
    )
    .orderBy(pharmacies.name)

  return groupRows
}

/**
 * Same result flattened to just the IDs — convenient for `inArray` in
 * appointment queries.
 */
export async function getAccessiblePharmacyIds(
  userPharmacyId: string,
): Promise<string[]> {
  const rows = await getAccessiblePharmacies(userPharmacyId)
  return rows.map((r) => r.id)
}

/**
 * True if the user's pharmacy belongs to a group marked as
 * "appointments only" — no PGD tools shown in the nav for these users.
 *
 * For now this is a hard-coded list of group slugs. Cheap and predictable.
 * Later this can be pulled from a group config table if we add more.
 */
const APPOINTMENTS_ONLY_GROUPS = new Set(['pritchards'])

export async function isAppointmentsOnlyPharmacy(
  userPharmacyId: string,
): Promise<boolean> {
  const [own] = await db
    .select({ groupSlug: pharmacies.groupSlug })
    .from(pharmacies)
    .where(eq(pharmacies.id, userPharmacyId))
    .limit(1)
  if (!own?.groupSlug) return false
  return APPOINTMENTS_ONLY_GROUPS.has(own.groupSlug)
}

/**
 * Convenience: same predicate but taking the group slug directly (no DB
 * lookup). Useful in the middleware / layout when we already have it.
 */
export function isAppointmentsOnlyGroup(
  groupSlug: string | null | undefined,
): boolean {
  if (!groupSlug) return false
  return APPOINTMENTS_ONLY_GROUPS.has(groupSlug)
}

// ── Per-group branding ──────────────────────────────────────────────
// Lightweight customer branding: a small map of group slug → logo file
// and display name, used to show partner logos in the sidebar. Not a
// full white-label tenant (those are 'grh' | 'hubrx' — see lib/tenants).
// Add another line here to onboard the next multi-branch customer.

interface GroupBranding {
  displayName: string
  logoUrl: string | null
  /** Alt text for screen readers */
  logoAlt: string
}

const GROUP_BRANDING: Record<string, GroupBranding> = {
  pritchards: {
    displayName: 'Pritchards Pharmacy',
    logoUrl: '/logos/pritchards.png',
    logoAlt: 'Pritchards Pharmacy',
  },
}

export function getGroupBranding(
  groupSlug: string | null | undefined,
): GroupBranding | null {
  if (!groupSlug) return null
  return GROUP_BRANDING[groupSlug] ?? null
}
