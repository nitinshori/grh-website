/**
 * PGD Document helpers — which ePGD slugs have a signed written PGD
 * PDF available, and where it lives.
 *
 * Derived from PGD_MASTER_FILES (src/lib/pgd-document-manifest.ts) so
 * there is ONE source of truth. Previously this file kept its own
 * hardcoded slug list, which silently went stale — e.g. oral Wegovy
 * was published as a master but never added here, so pharmacists saw
 * no download (reported by Sarah Passmore, PPH, 13 Jul 2026).
 *
 * The manifest also maps slugs covered by combined documents to the
 * right file (typhoid → travel-core.pdf, testosterone-women → hrt.pdf),
 * which the old `/pgd-documents/{slug}.pdf` convention couldn't express.
 */

import { PGD_MASTER_FILES } from '@/lib/pgd-document-manifest'

/**
 * Slugs whose PDF on disk is known to be the WRONG document — download
 * stays hidden until the correct source PGD is supplied.
 *   - ear-infection: PDF describes Dexamethasone/Neomycin/Acetic acid ear
 *     SPRAY for otitis externa; the catalogue + ePGD tool are for Cetraxal
 *     (ciprofloxacin ear drops).
 *   - shingles-treatment: PDF describes Shingrix VACCINE (prevention), but
 *     this PGD is for VALACICLOVIR acute antiviral treatment.
 */
const EXCLUDED_SLUGS = new Set(['ear-infection', 'shingles-treatment'])

/** Set of slugs that have a written PGD PDF available */
export const PGD_DOCUMENT_SLUGS = new Set(
  Object.keys(PGD_MASTER_FILES).filter((slug) => !EXCLUDED_SLUGS.has(slug)),
)

/** Get the download URL for a PGD document, or null if not available */
export function getPgdDocumentUrl(slug: string): string | null {
  if (!PGD_DOCUMENT_SLUGS.has(slug)) return null
  const filename = PGD_MASTER_FILES[slug]
  return `/pgd-documents/${encodeURIComponent(filename)}`
}

/** Check if a written PGD document is available for a given slug */
export function hasPgdDocument(slug: string): boolean {
  return PGD_DOCUMENT_SLUGS.has(slug)
}
