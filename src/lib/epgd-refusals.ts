import 'server-only'
import { desc, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { epgdRefusals, pharmacies } from '@/lib/db/schema'
import { ALL_PGDS, WITHDRAWN_SLUGS } from '@/lib/pgd-access'

/**
 * ePGD refusals: every tool link the middleware turned away.
 *
 * Until 28 Sep 2026 a refused link showed "That ePGD is not enabled for your
 * pharmacy" and nothing else, to anyone. When HubRx built a catalogue page of
 * links to our tools and one bounced, neither they nor we could tell which
 * link or why without a screenshot and a guess. Now the middleware says why,
 * the banner names the address, and every bounce is stored here for the
 * admin dashboard.
 */

export interface RefusalInput {
  userId: string | null
  userEmail: string | null
  pharmacyId: string | null
  authSource: string | null
  segment: string
  reason: string
  referer: string | null
  host: string | null
}

export async function recordEpgdRefusal(r: RefusalInput): Promise<void> {
  try {
    let pharmacyName: string | null = null
    if (r.pharmacyId) {
      const [p] = await db
        .select({ name: pharmacies.name })
        .from(pharmacies)
        .where(eq(pharmacies.id, r.pharmacyId))
        .limit(1)
      pharmacyName = p?.name ?? null
    }
    await db.insert(epgdRefusals).values({
      userId: r.userId,
      userEmail: r.userEmail,
      pharmacyId: r.pharmacyId,
      pharmacyName,
      authSource: r.authSource,
      segment: r.segment.slice(0, 200),
      reason: r.reason.slice(0, 40),
      referer: r.referer ? r.referer.slice(0, 500) : null,
      host: r.host ? r.host.slice(0, 200) : null,
    })
  } catch (err) {
    console.error('[epgd-refusals] could not record refusal:', err)
  }
}

/** Plain-English sentence for the banner on the ePGD index. */
export function describeEpgdRefusal(segment: string, why: string | undefined): string {
  const known = ALL_PGDS.find((p) => p.slug === segment)
  switch (why) {
    case 'withdrawn':
      return `${known?.title ?? segment} has been withdrawn and cannot be opened.`
    case 'no-document':
      return known
        ? `${known.title} does not have a signed PGD behind it yet, so its ePGD cannot be opened.`
        : `There is no ePGD at that address. ${WITHDRAWN_SLUGS.has(segment) ? 'It has been withdrawn.' : 'Check the spelling of the link, or the ePGD may not exist yet.'}`
    case 'not-assigned':
      return `${known?.title ?? 'That ePGD'} is not enabled for your pharmacy, so it could not be opened.`
    default:
      return 'That ePGD could not be opened.'
  }
}

export interface RefusalRow {
  id: string
  createdAt: Date
  userEmail: string | null
  pharmacyName: string | null
  authSource: string | null
  segment: string
  reason: string
  referer: string | null
  host: string | null
}

export async function recentEpgdRefusals(limit = 50): Promise<RefusalRow[]> {
  return db
    .select({
      id: epgdRefusals.id,
      createdAt: epgdRefusals.createdAt,
      userEmail: epgdRefusals.userEmail,
      pharmacyName: epgdRefusals.pharmacyName,
      authSource: epgdRefusals.authSource,
      segment: epgdRefusals.segment,
      reason: epgdRefusals.reason,
      referer: epgdRefusals.referer,
      host: epgdRefusals.host,
    })
    .from(epgdRefusals)
    .orderBy(desc(epgdRefusals.createdAt))
    .limit(limit)
}

export async function countEpgdRefusalsSince(days: number): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const [row] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(epgdRefusals)
    .where(gte(epgdRefusals.createdAt, since))
  return row?.n ?? 0
}
