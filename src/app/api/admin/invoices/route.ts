import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { isValidIsoDate, todayLondon } from '@/lib/billing'
import { emailInvoice, FIRST_INVOICE_MONTH, generateMonthlyInvoices, listInvoices, monthPeriod } from '@/lib/invoices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/** GET: every invoice (super_admin). */
export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ invoices: await listInvoices({ limit: 1000 }) })
}

/**
 * POST { action: 'generate', period?: 'YYYY-MM-DD', email?: boolean }
 * Issues the month's invoices for every billable branch without one, and
 * emails them unless email is false. Idempotent.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await req.json().catch(() => null)) as { action?: string; period?: string; email?: boolean; reissueVoid?: boolean } | null
  if (!body || body.action !== 'generate') return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  const current = monthPeriod(todayLondon()).start
  let period = current
  if (body.period != null) {
    if (!isValidIsoDate(body.period)) return NextResponse.json({ error: 'Period must be a real date (YYYY-MM-DD)' }, { status: 400 })
    period = monthPeriod(body.period).start
    if (period > current) return NextResponse.json({ error: 'Invoices are not issued for a future month' }, { status: 400 })
    if (period < FIRST_INVOICE_MONTH) return NextResponse.json({ error: `Nothing before ${FIRST_INVOICE_MONTH} is invoiced here; GoCardless already collected it` }, { status: 400 })
  }
  const gen = await generateMonthlyInvoices(period, { reissueVoid: body.reissueVoid === true })
  const sent: string[] = []
  const unsent: Array<{ invoiceNumber: string; error: string }> = []
  for (const c of gen.created) {
    await audit({ action: 'invoice_issued', userId: session.user.id, userEmail: session.user.email, request: req, details: { invoiceId: c.id, invoiceNumber: c.invoiceNumber, amountPence: c.amountPence, method: c.method, period } })
    if (body.email === false) continue
    const r = await emailInvoice(c.id)
    if (r.ok) sent.push(c.invoiceNumber)
    else unsent.push({ invoiceNumber: c.invoiceNumber, error: r.error })
  }
  return NextResponse.json({ ok: true, period, created: gen.created, skipped: gen.skipped, sent, unsent })
}
