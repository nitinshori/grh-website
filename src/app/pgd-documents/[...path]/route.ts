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
  'wegovy-oral-v003.pdf': 'wegovy-oral',
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
}

// A retired filename that is not in the table above is resolved by shape.
// Every published filename is <slug>.pdf, <slug> 2.pdf (the branded copy),
// <slug>-vNNN.pdf, or <slug>-vNNN-superseded.pdf, and this month alone
// retired forty of them. A bookmarked eczema-v003.pdf should land on the
// current eczema, not on a 404, without anyone remembering to add a line
// here. A slug that no longer exists in the manifest still returns 404,
// which is right: the service is gone, not renamed.
//
// Three filename stems are not the slug they serve: the season-stamped flu
// and COVID files, and the B12 document that serves two slugs. Without this
// table every retired b12-folate-vNNN.pdf, covid-2026-27-vNNN.pdf and
// flu-2026-27-vNNN.pdf link was a 404 (found 11 Sep 2026).
const STEM_TO_SLUG: Record<string, string> = {
  'flu-2026-27': 'flu',
  'covid-2026-27': 'covid-booster',
  'b12-folate': 'b12-injection',
}

function slugFromFilename(name: string): string | undefined {
  const m = /^([a-z0-9]+(?:-[a-z0-9]+)*?)(?: 2)?(?:-v\d{3})?(?:-superseded)?\.pdf$/.exec(name)
  if (!m) return undefined
  return STEM_TO_SLUG[m[1]] ?? m[1]
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const requested = decodeURIComponent(path.join('/'))

  const slug = RETIRED_DOCUMENTS[requested] ?? slugFromFilename(requested)
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
