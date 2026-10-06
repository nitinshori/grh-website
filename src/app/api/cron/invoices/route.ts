import { NextResponse } from 'next/server'
import { audit } from '@/lib/audit'
import { todayLondon } from '@/lib/billing'
import { sendEmail, escapeHtml } from '@/lib/email'
import { gbp } from '@/lib/invoice-pdf'
import { emailInvoice, generateMonthlyInvoices, monthPeriod, reconcileDirectDebitInvoices, unsentInvoiceIds, type ReconcileResult } from '@/lib/invoices'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * GET /api/cron/invoices, daily at 07:00 UTC (vercel.json; 08:00 in
 * British Summer Time, dates are taken in Europe/London regardless).
 *
 * 1. Issues this month's invoice for every billable branch that has none
 *    yet (a branch added mid-month is invoiced the next morning; a missed
 *    run on the 1st catches up on the 2nd). A month an admin voided for a
 *    branch is not re-issued here.
 * 2. Emails every invoice for the month not yet emailed, so a send that
 *    failed yesterday is retried, not forgotten.
 * 3. Marks direct-debit invoices paid once GoCardless confirms the exact
 *    amount; reports amount mismatches and stale open invoices instead of
 *    guessing.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { start } = monthPeriod(todayLondon())
  const gen = await generateMonthlyInvoices(start)
  for (const c of gen.created) {
    await audit({ action: 'invoice_issued', details: { invoiceId: c.id, invoiceNumber: c.invoiceNumber, amountPence: c.amountPence, method: c.method, by: 'cron' } })
  }

  const sent: string[] = []
  const unsent: Array<{ id: string; error: string }> = []
  for (const id of await unsentInvoiceIds(start)) {
    try {
      const r = await emailInvoice(id)
      if (r.ok) sent.push(`${id} to ${r.to}`)
      else unsent.push({ id, error: r.error })
    } catch (e) {
      unsent.push({ id, error: e instanceof Error ? e.message : String(e) })
    }
  }

  let reconciled: ReconcileResult = { paid: 0, checked: 0, mismatched: [], stale: [] }
  try {
    reconciled = await reconcileDirectDebitInvoices()
  } catch (e) {
    console.error('[invoices cron] reconcile failed:', e)
  }

  const needsAttention = unsent.length + reconciled.mismatched.length + reconciled.stale.length
  if (gen.created.length || needsAttention) {
    const li = (s: string) => `<li>${escapeHtml(s)}</li>`
    try {
      await sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL || 'info@getrealhealthpgd.co.uk',
        subject: `Invoices: ${gen.created.length} issued, ${sent.length} emailed${needsAttention ? `, ${needsAttention} need attention` : ''}`,
        html:
          (gen.created.length ? `<p>Issued for ${escapeHtml(start)}:</p><ul>${gen.created.map((c) => li(`${c.invoiceNumber} ${c.pharmacyName} ${gbp(c.amountPence)} (${c.method === 'direct_debit' ? 'Direct Debit' : 'bank transfer'})`)).join('')}</ul>` : '') +
          (unsent.length ? `<p><strong>Not emailed (retried tomorrow; or send from Admin, Invoices):</strong></p><ul>${unsent.map((u) => li(`${u.id}: ${u.error}`)).join('')}</ul>` : '') +
          (reconciled.mismatched.length ? `<p><strong>Collected amount differs from invoice (void and reissue):</strong></p><ul>${reconciled.mismatched.map((m) => li(`${m.invoiceNumber} ${m.pharmacyName}: invoiced ${gbp(m.invoiced)}, GoCardless collected ${gbp(m.collected)} (${m.paymentId})`)).join('')}</ul>` : '') +
          (reconciled.stale.length ? `<p><strong>Direct-debit invoices with nothing collected 10 days after month end (check the mandate in GoCardless):</strong></p><ul>${reconciled.stale.map((s) => li(`${s.invoiceNumber} ${s.pharmacyName} ${s.periodStart}`)).join('')}</ul>` : '') +
          (reconciled.paid ? `<p>${reconciled.paid} direct-debit invoice(s) marked paid.</p>` : ''),
      })
    } catch (e) {
      console.error('[invoices cron] summary email failed:', e)
    }
  }

  return NextResponse.json({ ok: true, period: start, created: gen.created.length, skipped: gen.skipped, sent: sent.length, unsent, reconciled })
}
