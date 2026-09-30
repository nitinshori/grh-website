import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { sendEmail, escapeHtml } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/onboarding/[id]/send-dd-link   { cc?: string[] }
 * Emails the contact of an admin-created sign-up the link that shows the
 * summary and starts their Direct Debit. Exists because the link carries a
 * secret key that should travel by email from the platform, not be copied
 * by hand (Delmergate, 30 Sep 2026: the hand-copied links never arrived).
 * Refuses once a mandate exists. Super admin only.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json().catch(() => ({})) as { cc?: unknown }
  const cc = Array.isArray(body.cc)
    ? body.cc.filter((x): x is string => typeof x === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)).slice(0, 5)
    : []

  const [req] = await db.select().from(onboardingRequests).where(eq(onboardingRequests.id, id)).limit(1)
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!req.resumeKey) return NextResponse.json({ error: 'This sign-up was not created by us; the customer set up their own Direct Debit' }, { status: 400 })
  if (req.gocardlessMandateId) return NextResponse.json({ error: 'The Direct Debit for this sign-up is already set up' }, { status: 400 })
  if (req.status === 'rejected') return NextResponse.json({ error: 'This sign-up was rejected' }, { status: 400 })
  if (!req.contactEmail) return NextResponse.json({ error: 'No contact email on this sign-up' }, { status: 400 })

  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const link = `${appUrl}/onboard/dd?id=${req.id}&key=${req.resumeKey}`
  const company = req.groupName || req.pharmacyName
  const names = [req.pharmacyName, ...req.branches.map((b) => b.name)]
  const n = names.length
  const gbp = (p: number) => '£' + (p / 100).toLocaleString('en-GB')
  const feeLine = req.monthlyFeePence != null
    ? `${gbp(req.monthlyFeePence)} per pharmacy per month ex VAT (${gbp(req.monthlyFeePence * n)} per month for ${n} ${n === 1 ? 'pharmacy' : 'pharmacies'})` +
      (req.feeChangePence != null && req.feeChangeOn ? `, moving to ${gbp(req.feeChangePence)} per pharmacy from ${new Date(req.feeChangeOn + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}` : '')
    : null

  try {
    await sendEmail({
      to: req.contactEmail,
      ...(cc.length ? { cc } : {}),
      subject: `${company}: set up your Get Real Health Direct Debit`,
      html:
        `<p>Hi ${escapeHtml(req.contactFirstName || '')},</p>` +
        `<p>We have set up the Get Real Health subscription for <strong>${escapeHtml(company)}</strong>, covering ${n === 1 ? 'this pharmacy' : `these ${n} pharmacies`}:</p>` +
        `<ul>${names.map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul>` +
        (feeLine ? `<p>Agreed fee: ${escapeHtml(feeLine)}. Every PGD, ePGD tool and training module is included; no per-consultation charges.</p>` : '') +
        `<p>The last step is the Direct Debit for ${escapeHtml(company)}. Open this link, check the details and press the button to enter the company bank details on the secure GoCardless page. Nothing is collected until the account is approved.</p>` +
        `<p><a href="${link}">${link}</a></p>` +
        `<p>Once the Direct Debit is in place we approve the account the same working day and email your login.</p>` +
        `<p>Dr Nitin Shori<br>Get Real Health<br>info@getrealhealthpgd.co.uk</p>`,
      replyTo: 'info@getrealhealthpgd.co.uk',
    })
  } catch (e) {
    return NextResponse.json({ error: `Email could not be sent: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 })
  }
  await db.update(onboardingRequests).set({ updatedAt: new Date() }).where(eq(onboardingRequests.id, req.id))
  return NextResponse.json({ ok: true, to: req.contactEmail, cc })
}
