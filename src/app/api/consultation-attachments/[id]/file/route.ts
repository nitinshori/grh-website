import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationAttachments } from '@/lib/db/schema'
import { streamPrivateBlob } from '@/lib/blob-stream'
import { audit } from '@/lib/audit'
import { UUID_RE, canAccessPharmacyRecords, findParent } from '@/lib/consultation-attachments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/consultation-attachments/[id]/file: a scan of a paper patient
 * form, streamed from the private Blob store.
 *
 * Allowed: pharmacist or pharmacy_admin working at the attachment's
 * pharmacy this session, or super_admin. Nothing is served
 * once the parent record is soft-deleted. Every view is audited.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const { id } = await ctx.params
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [a] = await db
    .select()
    .from(consultationAttachments)
    .where(eq(consultationAttachments.id, id))
    .limit(1)
  if (!a || !(await canAccessPharmacyRecords(session.user, a.pharmacyId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const parent = await findParent({
    consultationRecordId: a.consultationRecordId ?? undefined,
    paperConsultationId: a.paperConsultationId ?? undefined,
  })
  if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await audit({
    pharmacyId: a.pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email || null,
    action: 'record_view',
    recordId: a.consultationRecordId ?? a.paperConsultationId,
    details: { attachmentId: a.id },
    request,
  })

  try {
    const isPdf = a.contentType === 'application/pdf'
    return await streamPrivateBlob(a.blobUrl, a.fileName, a.contentType, {
      // Images open sandboxed; PDFs stay viewable inline (sandbox breaks
      // Chrome's PDF viewer). Browsers cannot show HEIC, so it downloads.
      sandbox: !isPdf,
      download: a.contentType === 'image/heic',
    })
  } catch (e) {
    console.error(`[attachments] stream failed for ${id}:`, e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Could not read the file from storage' }, { status: 502 })
  }
}
