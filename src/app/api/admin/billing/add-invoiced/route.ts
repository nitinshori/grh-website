import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { startInvoicedBilling } from '@/lib/billing'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/billing/add-invoiced
 * { pharmacyId, monthlyFeePence, billingName?, billingAddress?, billingEmail?, invoiceFrom?, notes? }
 *
 * Puts an existing pharmacy that has no Direct Debit (Smartway, 6 Oct 2026)
 * on monthly invoices paid by bank transfer. The invoice cron then issues
 * and emails one a month from invoice_from; they can move to Direct Debit
 * later via a link we send, at which point the row's method is switched.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const b = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)
  const pharmacyId = str(b.pharmacyId, 64)
  if (!pharmacyId) return NextResponse.json({ error: 'pharmacyId is required' }, { status: 400 })
  const r = await startInvoicedBilling({
    pharmacyId,
    monthlyFeePence: Math.floor(Number(b.monthlyFeePence)),
    billingName: str(b.billingName, 255),
    billingAddress: str(b.billingAddress, 1000),
    billingEmail: str(b.billingEmail, 255),
    invoiceFrom: str(b.invoiceFrom, 10),
    notes: str(b.notes, 1000),
  })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  await audit({ action: 'billing_edited', userId: session.user.id, pharmacyId, request, details: { startedInvoicedBilling: true, rowId: r.rowId, monthlyFeePence: b.monthlyFeePence, invoiceFrom: b.invoiceFrom ?? null } })
  return NextResponse.json({ ok: true, rowId: r.rowId })
}
