import { NextResponse } from 'next/server'
import { PGD_MASTER_FILES } from '@/lib/pgd-document-manifest'

// ─────────────────────────────────────────────────────────────────────────
// Redirects for retired PGD document filenames.
//
// Signed masters are versioned in the filename, so reissuing a PGD changes
// its URL and the old one stops existing. Pharmacists bookmark these, put
// them in SOP folders, and email them to each other, so a 404 means someone
// looking for a PGD finds nothing, with no clue that a newer version exists.
//
// Every retired filename is mapped to its SLUG rather than to a specific
// file, so the redirect resolves through the manifest to whatever the
// current master is. Future reissues need no change here; only the newly
// retired filename gets added.
//
// public/ is served first, so this only ever runs for a file that is no
// longer present.
// ─────────────────────────────────────────────────────────────────────────

const RETIRED_DOCUMENTS: Record<string, string> = {
  // Reissued 30 Jul to 14 Aug 2026
  'meningitis-b.pdf': 'meningitis-b',
  'flu.pdf': 'flu',
  'flu-2026-27.pdf': 'flu',
  'covid-booster.pdf': 'covid-booster',
  'covid-2026-27.pdf': 'covid-booster',
  'tetanus.pdf': 'tetanus',
  'junior-travel.pdf': 'junior-travel',
  'b12-injection.pdf': 'b12-injection',
  'b12-folate-v003.pdf': 'b12-injection',
  'mounjaro.pdf': 'mounjaro',
  'wegovy.pdf': 'wegovy',
  'wegovy-oral.pdf': 'wegovy-oral',
  // Reissued 21 Aug 2026 after the UK SPC published
  'foundayo.pdf': 'foundayo',
  // Split apart 21 Aug 2026. Each of these filenames previously served the
  // same combined Ixiaro / Rabies / MenACWY document, and shingles-treatment
  // served the Shingrix vaccine document. Anyone holding an old link now
  // lands on the correct standalone PGD for what they asked for.
  'meningitis-acwy-travel.pdf': 'meningitis-acwy-travel',
  'meningitis-acwy-travel 2.pdf': 'meningitis-acwy-travel',
  'japanese-encephalitis.pdf': 'japanese-encephalitis',
  'japanese-encephalitis 2.pdf': 'japanese-encephalitis',
  'rabies.pdf': 'rabies',
  'rabies 2.pdf': 'rabies',
  'shingles-treatment.pdf': 'shingles-treatment',
  'shingles-treatment 2.pdf': 'shingles-treatment',
  // v002 21 Aug 2026: upper UTI removed from scope
  'paediatric-uti.pdf': 'paediatric-uti',
  'paediatric-uti 2.pdf': 'paediatric-uti',
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const requested = decodeURIComponent(path.join('/'))

  const slug = RETIRED_DOCUMENTS[requested]
  if (slug) {
    const current = PGD_MASTER_FILES[slug]
    if (current) {
      // 302 rather than 301: the target changes with each reissue, so this
      // must not be cached permanently by browsers.
      return NextResponse.redirect(
        new URL(`/pgd-documents/${encodeURIComponent(current)}`, request.url),
        302,
      )
    }
  }

  return new NextResponse('Document not found', { status: 404 })
}
