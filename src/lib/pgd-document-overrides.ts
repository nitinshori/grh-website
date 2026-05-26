import "server-only"
import { db } from "@/lib/db"
import { pharmacyPgdDocuments } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { hasPgdDocument, getPgdDocumentUrl } from "@/lib/pgd-documents"

/**
 * Per-pharmacy PGD document resolver.
 *
 * Returns the URL a pharmacist at `pharmacyId` should see when they download
 * the PGD with slug `pgdSlug`. If the pharmacy has uploaded a current override
 * (e.g. a Janey+Sarah-signed PPH version), that URL is returned. Otherwise we
 * fall back to the GRH master at /pgd-documents/<slug>.pdf.
 *
 * Returns null if there's no GRH master AND no override.
 */
export async function resolvePgdDocumentUrl(
  pharmacyId: string | null | undefined,
  pgdSlug: string,
): Promise<{ url: string; source: 'override' | 'master' } | null> {
  if (pharmacyId) {
    const [override] = await db
      .select({
        url: pharmacyPgdDocuments.documentUrl,
      })
      .from(pharmacyPgdDocuments)
      .where(
        and(
          eq(pharmacyPgdDocuments.pharmacyId, pharmacyId),
          eq(pharmacyPgdDocuments.pgdSlug, pgdSlug),
          eq(pharmacyPgdDocuments.isCurrent, true),
        ),
      )
      .limit(1)
    if (override?.url) return { url: override.url, source: 'override' }
  }

  if (hasPgdDocument(pgdSlug)) {
    const url = getPgdDocumentUrl(pgdSlug)
    if (url) return { url, source: 'master' }
  }

  return null
}

/**
 * Bulk version — returns a Map<slug, { url, source }> for a given pharmacy.
 * Used by the admin pharmacy-detail page to show which PGDs have overrides
 * uploaded next to each row.
 */
export async function listPgdDocumentOverrides(
  pharmacyId: string,
): Promise<
  Map<
    string,
    {
      id: string
      url: string
      filename: string | null
      fileSizeBytes: number | null
      version: number
      signedByNames: string | null
      notes: string | null
      uploadedAt: Date
    }
  >
> {
  const rows = await db
    .select({
      id: pharmacyPgdDocuments.id,
      pgdSlug: pharmacyPgdDocuments.pgdSlug,
      url: pharmacyPgdDocuments.documentUrl,
      filename: pharmacyPgdDocuments.filename,
      fileSizeBytes: pharmacyPgdDocuments.fileSizeBytes,
      version: pharmacyPgdDocuments.version,
      signedByNames: pharmacyPgdDocuments.signedByNames,
      notes: pharmacyPgdDocuments.notes,
      uploadedAt: pharmacyPgdDocuments.uploadedAt,
    })
    .from(pharmacyPgdDocuments)
    .where(
      and(
        eq(pharmacyPgdDocuments.pharmacyId, pharmacyId),
        eq(pharmacyPgdDocuments.isCurrent, true),
      ),
    )

  const map = new Map<string, ReturnType<typeof rowToEntry>>()
  function rowToEntry(r: (typeof rows)[number]) {
    return {
      id: r.id,
      url: r.url,
      filename: r.filename,
      fileSizeBytes: r.fileSizeBytes,
      version: r.version,
      signedByNames: r.signedByNames,
      notes: r.notes,
      uploadedAt: r.uploadedAt,
    }
  }
  for (const r of rows) map.set(r.pgdSlug, rowToEntry(r))
  return map
}
