import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolvePgdDocumentUrl } from '@/lib/pgd-document-overrides'

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
