import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pharmacyPgdDocuments } from '@/lib/db/schema'
import { PGD_MASTER_FILES } from '@/lib/pgd-document-manifest'

/**
 * The version of the PGD document a pharmacy's staff actually see for a
 * slug: the pharmacy's own current upload if it has one (version
 * "upload v2"), otherwise the GRH master, whose version is the vNNN in its
 * filename (acne-v006.pdf is "v006"). REISSUED_PGDS is a notice table that
 * lags the manifest, so it is deliberately not used here: a practitioner
 * signature must lapse when the file changes, not when someone edits a
 * notice.
 */
export interface CurrentPgdVersion {
  version: string
  source: 'master' | 'override'
  /** Master filename, or the override row id. */
  ref: string
}

export function masterVersion(slug: string): CurrentPgdVersion | null {
  const file = PGD_MASTER_FILES[slug]
  if (!file) return null
  const m = /-v(\d{3})\.pdf$/i.exec(file)
  return { version: m ? `v${m[1]}` : file.replace(/\.pdf$/i, ''), source: 'master', ref: file }
}

export async function currentPgdVersions(pharmacyId: string | null, slugs: string[]): Promise<Map<string, CurrentPgdVersion>> {
  const out = new Map<string, CurrentPgdVersion>()
  if (slugs.length === 0) return out
  if (pharmacyId) {
    const rows = await db
      .select({ id: pharmacyPgdDocuments.id, slug: pharmacyPgdDocuments.pgdSlug, version: pharmacyPgdDocuments.version, uploadedAt: pharmacyPgdDocuments.uploadedAt })
      .from(pharmacyPgdDocuments)
      .where(and(eq(pharmacyPgdDocuments.pharmacyId, pharmacyId), eq(pharmacyPgdDocuments.isCurrent, true), inArray(pharmacyPgdDocuments.pgdSlug, slugs)))
      .orderBy(desc(pharmacyPgdDocuments.uploadedAt))
    for (const r of rows) if (!out.has(r.slug)) out.set(r.slug, { version: `upload v${r.version}`, source: 'override', ref: r.id })
  }
  for (const s of slugs) {
    if (out.has(s)) continue
    const m = masterVersion(s)
    if (m) out.set(s, m)
  }
  return out
}

export async function currentPgdVersion(pharmacyId: string | null, slug: string): Promise<CurrentPgdVersion | null> {
  return (await currentPgdVersions(pharmacyId, [slug])).get(slug) ?? null
}
