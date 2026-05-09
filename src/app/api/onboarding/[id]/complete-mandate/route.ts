import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { completeRedirectFlow, getMandate } from '@/lib/gocardless'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

/**
 * POST /api/onboarding/[id]/complete-mandate
 * Body: { token }
 *
 * Called by /onboard/dd-complete after GoCardless sends the customer back.
 * Validates the session token (which we set in start-mandate), exchanges the
 * redirect-flow for a Customer + Mandate, persists the IDs, and notifies the
 * admin that a new request is awaiting approval.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await request.json().catch(() => null) as { token?: string } | null
  const token = body?.token
  if (!id || !token) return NextResponse.json({ error: 'Missing id/token' }, { status: 400 })

  const [req] = await db
    .select()
    .from(onboardingRequests)
    .where(eq(onboardingRequests.id, id))
    .limit(1)
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify token matches what we stashed in start-mandate
  if (req.gocardlessMandateStatus !== `session:${token}`) {
    return NextResponse.json({ error: 'Token mismatch' }, { status: 403 })
  }
  if (!req.gocardlessRedirectFlowId) {
    return NextResponse.json({ error: 'No redirect flow on record' }, { status: 400 })
  }

  let result
  try {
    result = await completeRedirectFlow(req.gocardlessRedirectFlowId, token)
  } catch (err) {
    return NextResponse.json(
      { error: 'GoCardless completion failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    )
  }

  // Look up mandate status (new mandates start as `pending_submission`)
  let mandateStatus = 'pending_submission'
  try {
    const m = await getMandate(result.mandateId)
    mandateStatus = m.status
  } catch {
    // non-fatal — we still know the IDs
  }

  await db
    .update(onboardingRequests)
    .set({
      gocardlessCustomerId: result.customerId,
      gocardlessMandateId: result.mandateId,
      gocardlessMandateStatus: mandateStatus,
      status: 'awaiting_approval',
      updatedAt: new Date(),
    })
    .where(eq(onboardingRequests.id, req.id))

  // Best-effort admin notification (don't fail the customer's flow if email errors)
  if (process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFY_EMAIL) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
      await resend.emails.send({
        from: 'Get Real Health <noreply@getrealhealthpgd.co.uk>',
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: `New pharmacy sign-up awaiting approval: ${req.pharmacyName}`,
        text: `${req.pharmacyName} has completed the sign-up flow and the GoCardless mandate is in place.\n\n` +
          `Contact: ${req.contactFirstName} ${req.contactLastName} <${req.contactEmail}>\n` +
          `Mandate: ${result.mandateId} (${mandateStatus})\n\n` +
          `Review and approve: ${appUrl}/admin/onboarding/${req.id}\n`,
      })
    } catch { /* swallow */ }
  }

  return NextResponse.json({ ok: true })
}
