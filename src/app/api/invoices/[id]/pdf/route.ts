import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getInvoice, groupPharmacyIds, invoicePdf } from '@/lib/invoices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/invoices/[id]/pdf: the invoice as a PDF.
 * super_admin: any. Pharmacy admins: invoices for any branch in their
 * group (the branch they are working at decides the group). Pharmacists
 * do not see billing.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await ctx.params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const inv = await getInvoice(id)
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.user.role !== 'super_admin') {
    if (session.user.role !== 'pharmacy_admin') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const mine = session.user.pharmacyId ? await groupPharmacyIds(session.user.pharmacyId) : []
    if (!mine.includes(inv.pharmacyId)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pdf = await invoicePdf(inv)
  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${inv.invoiceNumber}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
