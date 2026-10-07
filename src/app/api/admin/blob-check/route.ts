import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { del, list, put } from '@vercel/blob'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/admin/blob-check: proves the Vercel Blob store behind
 * BLOB_READ_WRITE_TOKEN can list, write and delete, and returns the exact
 * error if not. Added 7 Oct 2026 when a Delmergate upload of a signed PGD
 * failed with "Upload to file storage failed" and the detail was hidden.
 * Super admin only; writes and removes one 20-byte file under healthcheck/.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const out: Record<string, unknown> = { tokenPresent: !!process.env.BLOB_READ_WRITE_TOKEN }
  try {
    const l = await list({ limit: 3 })
    out.list = { ok: true, count: l.blobs.length, sample: l.blobs.map((b) => ({ path: b.pathname, size: b.size })) }
  } catch (e) {
    out.list = { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  try {
    const b = await put(`healthcheck/${Date.now()}.txt`, 'blob health check', { access: 'public' })
    out.put = { ok: true, url: b.url }
    try {
      await del(b.url)
      out.del = { ok: true }
    } catch (e) {
      out.del = { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  } catch (e) {
    out.put = { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
  return NextResponse.json(out)
}
