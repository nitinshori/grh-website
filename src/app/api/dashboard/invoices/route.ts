import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { groupPharmacyIds, listInvoices } from '@/lib/invoices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET: invoices for every branch in the signed-in user's group. */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (session.user.role !== 'pharmacy_admin' && session.user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!session.user.pharmacyId) return NextResponse.json({ invoices: [] })
  const ids = await groupPharmacyIds(session.user.pharmacyId)
  const rows = await listInvoices({ pharmacyIds: ids, limit: 240 })
  return NextResponse.json({
    invoices: rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoiceNumber,
      pharmacyName: r.pharmacyName,
      periodStart: r.periodStart,
      issuedOn: r.issuedOn,
      dueOn: r.dueOn,
      amountPence: r.amountPence,
      paymentMethod: r.paymentMethod,
      status: r.status,
      paidAt: r.paidAt,
    })),
  })
}
