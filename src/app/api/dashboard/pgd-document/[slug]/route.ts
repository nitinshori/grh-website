import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolvePgdDocumentUrl } from '@/lib/pgd-document-overrides'
import { WITHDRAWN_SLUGS } from '@/lib/pgd-access'

export const dynamic = 'force-dynamic'

/**
 * GET /api/dashboard/pgd-document/[slug]
 *
 * Server-side resolver for a PGD document download. Looks up the caller's
 * pharmacy override (if any) and redirects to the right URL — pharmacy
 * override if uploaded for that (pharmacy, slug), else the GRH master PDF in
 * /public/pgd-documents/<slug>.pdf.
 *
 * The PgdDocumentLink component points its href at this endpoint so that:
 *   - PPH pharmacists get the Janey+Sarah-signed version
 *   - Everyone else gets the GRH master
 *   - The client component doesn't need to know which is which
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  // Prospects cannot download the signed PGD legal documents
  if (session.user.role === 'prospect') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  // Withdrawn PGDs are refused before the override lookup below. Replacing the
  // master PDF in /public/pgd-documents is not enough on its own: a pharmacy
  // that uploaded its own signed copy has a Vercel Blob override, and
  // resolvePgdDocumentUrl prefers that override over the master. Without this
  // check, every pharmacy holding its own copy of a withdrawn document would
  // still be served the uncorrected original from Blob storage, which is the
  // one case where the withdrawal would silently fail for exactly the
  // pharmacies most actively using the service.
  if (WITHDRAWN_SLUGS.has(slug)) {
    return NextResponse.json(
      {
        error:
          'This PGD has been withdrawn and must not be used. A corrected version will be reissued once it has been reviewed and signed.',
      },
      { status: 410 },
    )
  }

  const pharmacyId = session.user.pharmacyId ?? null
  const resolved = await resolvePgdDocumentUrl(pharmacyId, slug)
  if (!resolved) {
    return NextResponse.json({ error: 'No PGD document available' }, { status: 404 })
  }

  // Absolute URLs (Vercel Blob overrides) — 302 to them
  // Relative URLs (master /pgd-documents/<slug>.pdf) — resolve against host
  const target = resolved.url.startsWith('http')
    ? resolved.url
    : new URL(resolved.url, req.nextUrl.origin).toString()

  return NextResponse.redirect(target, 302)
}
