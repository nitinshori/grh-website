import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { emailInvoice, getInvoice, markInvoicePaid, reopenInvoice, voidInvoice } from '@/lib/invoices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST { action: 'paid' | 'void' | 'reopen' | 'send', note?, to? }
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await ctx.params
  if (!UUID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = (await req.json().catch(() => null)) as { action?: string; note?: string; to?: string } | null
  if (!body?.action) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  const inv = await getInvoice(id)
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 500) : null

  let result: { ok: true; to?: string } | { ok: false; error: string }
  switch (body.action) {
    case 'paid': result = await markInvoicePaid(id, note); break
    case 'void': result = await voidInvoice(id, note); break
    case 'reopen': result = await reopenInvoice(id); break
    case 'send': result = await emailInvoice(id, typeof body.to === 'string' ? body.to : null); break
    default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  await audit({
    action: 'invoice_updated',
    userId: session.user.id,
    userEmail: session.user.email,
    pharmacyId: inv.pharmacyId,
    request: req,
    details: { invoiceId: id, invoiceNumber: inv.invoiceNumber, action: body.action, note, to: 'to' in result ? result.to : undefined },
  })
  return NextResponse.json({ ok: true, ...('to' in result ? { to: result.to } : {}) })
}
