import 'server-only'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import { pharmacies, practitionerAuthorisations, userPharmacyAccess, users } from '@/lib/db/schema'
import { ALL_PGDS, WITHDRAWN_SLUGS } from '@/lib/pgd-access'
import { getPharmacyPgdSlugs } from '@/lib/pgd-queries'
import { currentPgdVersions, type CurrentPgdVersion } from '@/lib/pgd-version'

/**
 * Practitioner authorisation (migration 075).
 *
 * The PGD itself is authorised by GRH (doctor, pharmacist, organisation).
 * Each pharmacist signs, from their own login, that they have read the
 * current version and agree to work under it; the pharmacy's authorising
 * manager (pharmacy_admin) countersigns, in bulk if they like. A
 * signature is tied to the document version the pharmacy sees
 * (src/lib/pgd-version.ts), so a reissue lapses it and the pharmacist is
 * asked again. None of this gates the ePGD tools; it is the register NICE
 * MPG2 expects the organisation to hold.
 */

export const PRACTITIONER_DECLARATION =
  'I confirm that I have read and understood this Patient Group Direction, that I am competent to work under it, and that I agree to supply or administer the medicine only in accordance with it.'

export const MANAGER_DECLARATION =
  'I confirm, on behalf of the pharmacy, that the named practitioner is authorised to work under this Patient Group Direction.'

export type AuthState = 'signed' | 'updated' | 'unsigned'

export interface PgdAuthRow {
  slug: string
  title: string
  category: string
  version: CurrentPgdVersion
  state: AuthState
  authorisationId: string | null
  signedVersion: string | null
  signedAt: string | null
  countersignedAt: string | null
  countersignedName: string | null
}

const TITLE = new Map(ALL_PGDS.map((p) => [p.slug, p]))

/** PGDs a branch's staff can be authorised for: assigned, live, with a document. */
export async function signablePgds(pharmacyId: string): Promise<{ slugs: string[]; versions: Map<string, CurrentPgdVersion> }> {
  const assigned = (await getPharmacyPgdSlugs(pharmacyId)).filter((s) => TITLE.has(s) && !WITHDRAWN_SLUGS.has(s))
  const versions = await currentPgdVersions(pharmacyId, assigned)
  return { slugs: assigned.filter((s) => versions.has(s)), versions }
}

type AuthRowDb = typeof practitionerAuthorisations.$inferSelect

/** Live (unrevoked) signatures per slug for a user, newest first. */
async function liveByUser(userId: string): Promise<Map<string, AuthRowDb[]>> {
  const rows = await db
    .select()
    .from(practitionerAuthorisations)
    .where(and(eq(practitionerAuthorisations.userId, userId), isNull(practitionerAuthorisations.revokedAt)))
    .orderBy(desc(practitionerAuthorisations.signedAt))
  const m = new Map<string, AuthRowDb[]>()
  for (const r of rows) m.set(r.pgdSlug, [...(m.get(r.pgdSlug) ?? []), r])
  return m
}

/**
 * A signature counts for the document the branch currently shows
 * (same document_ref: the master filename, or the branch's own upload).
 * Any other live signature for the slug only tells us they signed an
 * earlier or different document ("updated").
 */
function toRow(slug: string, v: CurrentPgdVersion, live: AuthRowDb[] = []): PgdAuthRow {
  const p = TITLE.get(slug)!
  const latest = live.find((r) => r.documentRef === v.ref) ?? live[0]
  let state: AuthState = 'unsigned'
  if (latest) state = latest.documentRef === v.ref ? 'signed' : 'updated'
  return {
    slug,
    title: p.title,
    category: p.category,
    version: v,
    state,
    authorisationId: latest?.id ?? null,
    signedVersion: latest?.pgdVersion ?? null,
    signedAt: latest?.signedAt.toISOString() ?? null,
    countersignedAt: latest?.countersignedAt?.toISOString() ?? null,
    countersignedName: latest?.countersignedName ?? null,
  }
}

export async function myAuthorisations(userId: string, pharmacyId: string): Promise<PgdAuthRow[]> {
  const { slugs, versions } = await signablePgds(pharmacyId)
  const live = await liveByUser(userId)
  return slugs.map((s) => toRow(s, versions.get(s)!, live.get(s)))
}

export interface SignInput {
  userId: string
  pharmacyId: string
  slugs: string[]
  signedName: string
  gphcNumber: string | null
  ipAddress: string | null
  userAgent: string | null
}

/**
 * Record signatures for the current version of each slug. A slug the
 * branch does not hold, or that has no document, is refused; a slug
 * already signed at this version is skipped (unique live index).
 */
export async function signAuthorisations(input: SignInput): Promise<{ ok: true; signed: Array<{ id: string; slug: string; version: string }>; skipped: string[] } | { ok: false; error: string }> {
  const name = input.signedName.trim()
  if (name.length < 3) return { ok: false, error: 'Type your full name as it appears on the GPhC register' }
  const gphc = input.gphcNumber?.trim() || null
  if (gphc && !/^\d{7}$/.test(gphc)) return { ok: false, error: 'A GPhC registration number is 7 digits' }
  const { slugs: allowed, versions } = await signablePgds(input.pharmacyId)
  const wanted = [...new Set(input.slugs)]
  const bad = wanted.filter((s) => !allowed.includes(s))
  if (bad.length) return { ok: false, error: `Not available to sign at this branch: ${bad.join(', ')}` }
  if (wanted.length === 0) return { ok: false, error: 'Choose at least one PGD' }

  const signed: Array<{ id: string; slug: string; version: string }> = []
  const skipped: string[] = []
  await db.transaction(async (tx) => {
  for (const slug of wanted) {
    const v = versions.get(slug)!
    const [row] = await tx
      .insert(practitionerAuthorisations)
      .values({
        userId: input.userId,
        pharmacyId: input.pharmacyId,
        pgdSlug: slug,
        pgdTitle: TITLE.get(slug)!.title,
        pgdVersion: v.version,
        documentSource: v.source,
        documentRef: v.ref,
        declaration: PRACTITIONER_DECLARATION,
        signedName: name,
        gphcNumber: gphc,
        ipAddress: input.ipAddress?.slice(0, 64) ?? null,
        userAgent: input.userAgent?.slice(0, 500) ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: practitionerAuthorisations.id })
    if (row) signed.push({ id: row.id, slug, version: v.version })
    else skipped.push(slug)
  }
  // The number they typed is the one on their signature; keep the user
  // record in step so the team page and the register agree.
  if (gphc) await tx.update(users).set({ gphcNumber: gphc }).where(eq(users.id, input.userId))
  })
  return { ok: true, signed, skipped }
}

export interface TeamMember {
  userId: string
  name: string
  email: string
  role: string
  gphcNumber: string | null
  homePharmacyId: string
  homePharmacyName: string
  alsoWorksAt: string[]
  counts: { signed: number; updated: number; unsigned: number; awaitingCountersign: number }
  rows: PgdAuthRow[]
}

/**
 * Every practitioner of the given branches (home there, or granted
 * access there) with their status for each PGD their home branch holds.
 */
export async function teamAuthorisations(pharmacyIds: string[], opts: { versionsFor?: string } = {}): Promise<TeamMember[]> {
  if (pharmacyIds.length === 0) return []
  const userIds = await managedUserIds(pharmacyIds)
  if (userIds.length === 0) return []
  const staff = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role, gphcNumber: users.gphcNumber, pharmacyId: users.pharmacyId, pharmacyName: pharmacies.name })
    .from(users)
    .innerJoin(pharmacies, eq(pharmacies.id, users.pharmacyId))
    .where(inArray(users.id, userIds))
    .orderBy(pharmacies.name, users.lastName, users.firstName)
  if (staff.length === 0) return []

  const extras = await db
    .select({ userId: userPharmacyAccess.userId, name: pharmacies.name })
    .from(userPharmacyAccess)
    .innerJoin(pharmacies, eq(pharmacies.id, userPharmacyAccess.pharmacyId))
    .where(inArray(userPharmacyAccess.userId, staff.map((s) => s.id)))
  const extraNames = new Map<string, string[]>()
  for (const e of extras) extraNames.set(e.userId, [...(extraNames.get(e.userId) ?? []), e.name])

  const perBranch = new Map<string, Awaited<ReturnType<typeof signablePgds>>>()
  const latestRows = await db
    .select()
    .from(practitionerAuthorisations)
    .where(and(inArray(practitionerAuthorisations.userId, staff.map((s) => s.id)), isNull(practitionerAuthorisations.revokedAt)))
    .orderBy(desc(practitionerAuthorisations.signedAt))
  const liveByUserSlug = new Map<string, AuthRowDb[]>()
  for (const r of latestRows) {
    const k = `${r.userId}:${r.pgdSlug}`
    liveByUserSlug.set(k, [...(liveByUserSlug.get(k) ?? []), r])
  }

  const out: TeamMember[] = []
  for (const s of staff) {
    // The register for branch X judges everyone against X's documents;
    // the group matrix judges each person against their home branch.
    const branch = opts.versionsFor ?? (s.pharmacyId as string)
    if (!perBranch.has(branch)) perBranch.set(branch, await signablePgds(branch))
    const { slugs, versions } = perBranch.get(branch)!
    const home = s.pharmacyId as string
    const rows = slugs.map((slug) => toRow(slug, versions.get(slug)!, liveByUserSlug.get(`${s.id}:${slug}`)))
    out.push({
      userId: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
      email: s.email,
      role: s.role,
      gphcNumber: s.gphcNumber,
      homePharmacyId: home,
      homePharmacyName: s.pharmacyName,
      alsoWorksAt: extraNames.get(s.id) ?? [],
      counts: {
        signed: rows.filter((r) => r.state === 'signed').length,
        updated: rows.filter((r) => r.state === 'updated').length,
        unsigned: rows.filter((r) => r.state === 'unsigned').length,
        awaitingCountersign: rows.filter((r) => r.state === 'signed' && !r.countersignedAt).length,
      },
      rows,
    })
  }
  return out
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Active practitioners a manager of these branches may act for: home in
 * the branches, or granted one of them (and still in the same group as
 * the grant, so a stale grant after a regrouping does not reach across).
 */
async function managedUserIds(pharmacyIds: string[]): Promise<string[]> {
  if (pharmacyIds.length === 0) return []
  const home = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.isActive, true), inArray(users.role, ['pharmacist', 'pharmacy_admin']), inArray(users.pharmacyId, pharmacyIds)))
  const gp = alias(pharmacies, 'gp')
  const grantedRows = await db
    .select({ id: users.id, homeGroup: pharmacies.groupSlug, grantGroup: gp.groupSlug })
    .from(userPharmacyAccess)
    .innerJoin(users, eq(users.id, userPharmacyAccess.userId))
    .innerJoin(pharmacies, eq(pharmacies.id, users.pharmacyId))
    .innerJoin(gp, eq(gp.id, userPharmacyAccess.pharmacyId))
    .where(and(eq(users.isActive, true), inArray(users.role, ['pharmacist', 'pharmacy_admin']), inArray(userPharmacyAccess.pharmacyId, pharmacyIds)))
  const ids = new Set(home.map((h) => h.id))
  for (const g of grantedRows) if (g.homeGroup && g.homeGroup === g.grantGroup) ids.add(g.id)
  return [...ids]
}

/**
 * Countersign live, uncountersigned signatures for staff of the given
 * branches. A manager may countersign their own signature (a single-admin
 * branch has nobody else); the register then shows "(self)".
 */
export async function countersign(opts: { ids: string[]; pharmacyIds: string[]; byUserId: string; byName: string }): Promise<string[]> {
  const ids = [...new Set(opts.ids.filter((x) => UUID_RE.test(x)))].slice(0, 500)
  if (ids.length === 0) return []
  const userIds = await managedUserIds(opts.pharmacyIds)
  if (userIds.length === 0) return []
  const rows = await db
    .update(practitionerAuthorisations)
    .set({
      countersignedByUserId: opts.byUserId,
      countersignedName: sql`CASE WHEN ${practitionerAuthorisations.userId} = ${opts.byUserId} THEN ${opts.byName + ' (self)'} ELSE ${opts.byName} END`,
      countersignedAt: new Date(),
    })
    .where(and(
      inArray(practitionerAuthorisations.id, ids),
      inArray(practitionerAuthorisations.userId, userIds),
      isNull(practitionerAuthorisations.countersignedAt),
      isNull(practitionerAuthorisations.revokedAt),
    ))
    .returning({ id: practitionerAuthorisations.id })
  return rows.map((r) => r.id)
}

export async function revokeAuthorisation(opts: { id: string; pharmacyIds: string[]; byUserId: string; reason: string | null }): Promise<boolean> {
  if (!UUID_RE.test(opts.id)) return false
  const userIds = await managedUserIds(opts.pharmacyIds)
  if (userIds.length === 0) return false
  const rows = await db
    .update(practitionerAuthorisations)
    .set({ revokedAt: new Date(), revokedByUserId: opts.byUserId, revokeReason: opts.reason })
    .where(and(eq(practitionerAuthorisations.id, opts.id), inArray(practitionerAuthorisations.userId, userIds), isNull(practitionerAuthorisations.revokedAt)))
    .returning({ id: practitionerAuthorisations.id })
  return rows.length > 0
}

export async function pendingCountersignIds(pharmacyIds: string[]): Promise<string[]> {
  const team = await teamAuthorisations(pharmacyIds)
  const ids: string[] = []
  for (const m of team) for (const r of m.rows) if (r.state === 'signed' && !r.countersignedAt && r.authorisationId) ids.push(r.authorisationId)
  return ids
}
