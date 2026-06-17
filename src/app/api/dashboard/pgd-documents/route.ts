import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacyPgdDocuments, users } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { ALL_PGDS } from '@/lib/pgd-access'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_SLUGS = new Set(ALL_PGDS.map((p) => p.slug))

// ─────────────────────────────────────────────────────────────────────────
// Pharmacy-admin facing PGD document upload endpoint.
//
// Built specifically to unblock Jane and Sarah at PPH so they can upload
// new signed PGDs directly without coming through Nitin / GRH admin. The
// parallel super-admin endpoint at /api/admin/pharmacies/[id]/pgd-documents
// lets GRH staff upload on behalf of any pharmacy; this endpoint lets a
// pharmacy_admin upload only for their OWN pharmacy.
//
// Authorisation:
//   - pharmacy_admin role required
//   - pharmacy_id derived from the caller's own session, NOT from the URL
//     or request body. This means a pharmacy admin cannot accidentally
//     (or maliciously) upload to a different pharmacy.
// ─────────────────────────────────────────────────────────────────────────

// ── GET — list all current PGD overrides for caller's pharmacy ──
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'pharmacy_admin' && session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) {
    return NextResponse.json({ error: 'No pharmacy assigned to your account' }, { status: 400 })
  }

  // List all current overrides, joined to uploader's name for display.
  const rows = await db
    .select({
      id: pharmacyPgdDocuments.id,
      pgdSlug: pharmacyPgdDocuments.pgdSlug,
      documentUrl: pharmacyPgdDocuments.documentUrl,
      filename: pharmacyPgdDocuments.filename,
      fileSizeBytes: pharmacyPgdDocuments.fileSizeBytes,
      version: pharmacyPgdDocuments.version,
      signedByNames: pharmacyPgdDocuments.signedByNames,
      notes: pharmacyPgdDocuments.notes,
      uploadedAt: pharmacyPgdDocuments.uploadedAt,
      uploadedByFirstName: users.firstName,
      uploadedByLastName: users.lastName,
    })
    .from(pharmacyPgdDocuments)
    .leftJoin(users, eq(pharmacyPgdDocuments.uploadedBy, users.id))
    .where(
      and(
        eq(pharmacyPgdDocuments.pharmacyId, pharmacyId),
        eq(pharmacyPgdDocuments.isCurrent, true),
      ),
    )
    .orderBy(desc(pharmacyPgdDocuments.uploadedAt))

  return NextResponse.json({
    documents: rows.map((r) => ({
      id: r.id,
      pgdSlug: r.pgdSlug,
      documentUrl: r.documentUrl,
      filename: r.filename,
      fileSizeBytes: r.fileSizeBytes,
      version: r.version,
      signedByNames: r.signedByNames,
      notes: r.notes,
      uploadedAt: r.uploadedAt,
      uploadedBy:
        r.uploadedByFirstName || r.uploadedByLastName
          ? `${r.uploadedByFirstName ?? ''} ${r.uploadedByLastName ?? ''}`.trim()
          : null,
    })),
  })
}

// ── POST — upload a new pre-signed PGD PDF for caller's pharmacy ──
//   multipart/form-data:
//     file:           PDF file (max 25MB)
//     pgdSlug:        catalogue slug
//     signedByNames:  optional "Janey Tipping, Sarah Passmore"
//     notes:          optional free text
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'pharmacy_admin' && session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden — pharmacy admins only' }, { status: 403 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) {
    return NextResponse.json({ error: 'No pharmacy assigned to your account' }, { status: 400 })
  }
  const uploaderId = session.user.id

  let form
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const pgdSlug = String(form.get('pgdSlug') ?? '').trim()
  const signedByNames = String(form.get('signedByNames') ?? '').trim() || null
  const notes = String(form.get('notes') ?? '').trim() || null
  const file = form.get('file')

  if (!pgdSlug || !VALID_SLUGS.has(pgdSlug)) {
    return NextResponse.json(
      { error: 'Invalid PGD selection. Pick one from the dropdown.' },
      { status: 400 },
    )
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }
  if (
    file.type !== 'application/pdf' &&
    !file.name.toLowerCase().endsWith('.pdf')
  ) {
    return NextResponse.json(
      { error: 'File must be a PDF' },
      { status: 400 },
    )
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'PDF too large — 25 MB maximum' },
      { status: 400 },
    )
  }

  // Next version for (pharmacy, slug)
  const [latest] = await db
    .select({ version: pharmacyPgdDocuments.version })
    .from(pharmacyPgdDocuments)
    .where(
      and(
        eq(pharmacyPgdDocuments.pharmacyId, pharmacyId),
        eq(pharmacyPgdDocuments.pgdSlug, pgdSlug),
      ),
    )
    .orderBy(desc(pharmacyPgdDocuments.version))
    .limit(1)
  const nextVersion = (latest?.version ?? 0) + 1

  // Upload to Vercel Blob
  const blobPath = `pgd-overrides/${pharmacyId}/${pgdSlug}/v${nextVersion}-${Date.now()}.pdf`
  let blob
  try {
    blob = await put(blobPath, file, { access: 'public' })
  } catch (e) {
    return NextResponse.json(
      {
        error: 'Upload to file storage failed',
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    )
  }

  // Flip previous current → false, insert new current row
  await db
    .update(pharmacyPgdDocuments)
    .set({ isCurrent: false, updatedAt: new Date() })
    .where(
      and(
        eq(pharmacyPgdDocuments.pharmacyId, pharmacyId),
        eq(pharmacyPgdDocuments.pgdSlug, pgdSlug),
        eq(pharmacyPgdDocuments.isCurrent, true),
      ),
    )

  const [created] = await db
    .insert(pharmacyPgdDocuments)
    .values({
      pharmacyId,
      pgdSlug,
      documentUrl: blob.url,
      filename: file.name,
      fileSizeBytes: file.size,
      version: nextVersion,
      signedByNames,
      notes,
      isCurrent: true,
      uploadedBy: uploaderId,
    })
    .returning({
      id: pharmacyPgdDocuments.id,
      url: pharmacyPgdDocuments.documentUrl,
      version: pharmacyPgdDocuments.version,
    })

  return NextResponse.json({
    ok: true,
    pgdSlug,
    documentId: created.id,
    url: created.url,
    version: created.version,
    filename: file.name,
    fileSizeBytes: file.size,
  })
}

// ── DELETE — remove the current override for a slug ────────────
//   Query param: ?slug=<pgdSlug>
//   Soft-delete (sets is_current = false). The Vercel Blob file stays —
//   we don't proactively garbage collect. Re-upload creates a new version.
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (session.user.role !== 'pharmacy_admin' && session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) {
    return NextResponse.json({ error: 'No pharmacy assigned to your account' }, { status: 400 })
  }

  const url = new URL(req.url)
  const slug = (url.searchParams.get('slug') ?? '').trim()
  if (!slug || !VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: 'Invalid slug query param' }, { status: 400 })
  }

  const result = await db
    .update(pharmacyPgdDocuments)
    .set({ isCurrent: false, updatedAt: new Date() })
    .where(
      and(
        eq(pharmacyPgdDocuments.pharmacyId, pharmacyId),
        eq(pharmacyPgdDocuments.pgdSlug, slug),
        eq(pharmacyPgdDocuments.isCurrent, true),
      ),
    )
    .returning({ id: pharmacyPgdDocuments.id })

  return NextResponse.json({ ok: true, removed: result.length })
}
