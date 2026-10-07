import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacyPgdDocuments } from '@/lib/db/schema'
import { streamPrivateBlob } from '@/lib/blob-stream'
import { groupPharmacyIds } from '@/lib/invoices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/pgd-documents/[id]/file: an uploaded (pharmacy-signed) PGD PDF,
 * streamed from the private Blob store.
 *
 * Allowed: super_admin; clinical reviewers (role client, who reach these
 * from /clinical-sign-off); any pharmacy user whose group includes the
 * pharmacy the document belongs to. Prospects never.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (session.user.role === 'prospect') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await ctx.params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [doc] = await db
    .select({ pharmacyId: pharmacyPgdDocuments.pharmacyId, url: pharmacyPgdDocuments.documentUrl, filename: pharmacyPgdDocuments.filename, pgdSlug: pharmacyPgdDocuments.pgdSlug, version: pharmacyPgdDocuments.version })
    .from(pharmacyPgdDocuments)
    .where(eq(pharmacyPgdDocuments.id, id))
    .limit(1)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const role = session.user.role
  if (role !== 'super_admin' && role !== 'client') {
    const mine = session.user.pharmacyId ? await groupPharmacyIds(session.user.pharmacyId) : []
    if (!mine.includes(doc.pharmacyId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    return await streamPrivateBlob(doc.url, doc.filename || `${doc.pgdSlug}-v${doc.version}.pdf`)
  } catch (e) {
    console.error(`[pgd-documents] stream failed for ${id}:`, e)
    return NextResponse.json({ error: 'Could not read the document from storage' }, { status: 502 })
  }
}
