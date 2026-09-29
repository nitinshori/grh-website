import { NextResponse } from 'next/server'
import { applyScheduledFeeChange, dueFeeChanges } from '@/lib/billing'
import { audit } from '@/lib/audit'
import { sendEmail, escapeHtml } from '@/lib/email'

/**
 * GET /api/cron/fee-changes: applies every scheduled fee change that is due.
 *
 * A first-year group rate that moves to the standard rate on a date (set at
 * approval or on /admin/billing) is pushed to GoCardless here on the day.
 * Runs daily from vercel.json. Idempotent: an applied change is marked and
 * never re-applied; a GoCardless failure is reported and retried tomorrow,
 * and stays visible on /admin/billing with an "Apply now" button.
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>`, as for /api/cron/retention.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const due = await dueFeeChanges()
  const applied: Array<{ name: string; from: number; to: number }> = []
  const failed: Array<{ name: string; error: string }> = []
  for (const d of due) {
    const r = await applyScheduledFeeChange(d.id)
    if (r.ok) {
      applied.push({ name: d.name, from: r.from, to: r.to })
      await audit({ action: 'billing_fee_change_applied', pharmacyId: d.pharmacyId, details: { subscriptionRowId: d.id, from: r.from, to: r.to, by: 'cron' } })
    } else {
      failed.push({ name: d.name, error: r.error })
      console.error(`[fee-changes] ${d.name}: ${r.error}`)
    }
  }

  if (applied.length || failed.length) {
    const gbp = (p: number) => '£' + (p / 100).toLocaleString('en-GB')
    try {
      await sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL || 'info@getrealhealthpgd.co.uk',
        subject: `Fee changes applied today: ${applied.length} done${failed.length ? `, ${failed.length} FAILED` : ''}`,
        html:
          (applied.length ? `<p>Applied:</p><ul>${applied.map((a) => `<li>${escapeHtml(a.name)}: ${gbp(a.from)} to ${gbp(a.to)} per month</li>`).join('')}</ul>` : '') +
          (failed.length ? `<p><strong>Failed (will retry tomorrow; or apply from Admin, Billing):</strong></p><ul>${failed.map((f) => `<li>${escapeHtml(f.name)}: ${escapeHtml(f.error)}</li>`).join('')}</ul>` : ''),
      })
    } catch (e) {
      console.error('[fee-changes] summary email failed:', e)
    }
  }

  return NextResponse.json({ ok: true, due: due.length, applied, failed })
}
