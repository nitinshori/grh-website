import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacyPgdDocuments, pharmacies } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { ALL_PGDS } from '@/lib/pgd-access'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_SLUGS = new Set(ALL_PGDS.map((p) => p.slug))

// ── POST — upload a new override PDF for (pharmacy, slug) ────────
//   multipart/form-data:
//     file:           PDF file
//     pgdSlug:        slug
//     signedByNames:  optional "Janey Tipping, Sarah Passmore"
//     notes:          optional free text
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 })
  }
  const adminUserId = session.user.id

  const { id: pharmacyId } = await params

  // Confirm pharmacy exists
  const [pharm] = await db
    .select({ id: pharmacies.id, name: pharmacies.name })
    .from(pharmacies)
    .where(eq(pharmacies.id, pharmacyId))
    .limit(1)
  if (!pharm) return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })

  const form = await req.formData()
  const pgdSlug = String(form.get('pgdSlug') ?? '').trim()
  const signedByNames = String(form.get('signedByNames') ?? '').trim() || null
  const notes = String(form.get('notes') ?? '').trim() || null
  const file = form.get('file')

  if (!pgdSlug || !VALID_SLUGS.has(pgdSlug)) {
    return NextResponse.json({ error: 'Invalid pgdSlug' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'PDF too large (25MB max)' }, { status: 400 })
  }

  // Compute next version for (pharmacy, slug)
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
    return NextResponse.json({
      error: 'Upload to Vercel Blob failed',
      detail: e instanceof Error ? e.message : String(e),
    }, { status: 502 })
  }

  // Flip previous "current" to false, insert new one as current
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
      uploadedBy: adminUserId,
    })
    .returning({
      id: pharmacyPgdDocuments.id,
      url: pharmacyPgdDocuments.documentUrl,
      version: pharmacyPgdDocuments.version,
    })

  return NextResponse.json({
    ok: true,
    pharmacyName: pharm.name,
    pgdSlug,
    documentId: created.id,
    url: created.url,
    version: created.version,
  })
}

// ── DELETE — remove the current override for (pharmacy, slug) ────
//   Query param: ?slug=<pgdSlug>
//   Soft-deletes by flipping is_current=false. The Vercel Blob file stays —
//   we don't proactively GC it. (Re-upload creates a new version row.)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Forbidden' }, { status: 401 })
  if (session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 })
  }

  const { id: pharmacyId } = await params
  const url = new URL(req.url)
  const slug = (url.searchParams.get('slug') ?? '').trim()
  if (!slug) return NextResponse.json({ error: 'slug query param required' }, { status: 400 })

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
