import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyWebhookSignature } from '@/lib/gocardless'

export const dynamic = 'force-dynamic'

/**
 * GoCardless webhook receiver. Listens for mandate state changes so the
 * onboarding row reflects the live mandate status (e.g. flips from
 * pending_submission → submitted → active over a few minutes).
 *
 * The endpoint must be registered in the GoCardless dashboard at:
 *   https://manage.gocardless.com/developers/webhook-endpoints
 *
 * Set the URL to:  https://getrealhealthpgd.co.uk/api/webhooks/gocardless
 * Tick events:     mandates → active, cancelled, failed, expired
 *
 * Take the secret GoCardless gives you and set it as GOCARDLESS_WEBHOOK_SECRET
 * in Vercel env vars.
 */

interface GoCardlessEvent {
  resource_type?: string
  action?: string
  links?: { mandate?: string; customer?: string }
  details?: { cause?: string }
}

interface GoCardlessWebhookBody {
  events?: GoCardlessEvent[]
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const sig = request.headers.get('Webhook-Signature')

  if (!verifyWebhookSignature(rawBody, sig)) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 498 })
  }

  let body: GoCardlessWebhookBody
  try { body = JSON.parse(rawBody) as GoCardlessWebhookBody }
  catch { return NextResponse.json({ error: 'Bad body' }, { status: 400 }) }

  const events = body.events ?? []

  for (const evt of events) {
    if (evt.resource_type !== 'mandates') continue
    const mandateId = evt.links?.mandate
    if (!mandateId) continue
    // Find the onboarding row tied to this mandate
    const [row] = await db
      .select({ id: onboardingRequests.id })
      .from(onboardingRequests)
      .where(eq(onboardingRequests.gocardlessMandateId, mandateId))
      .limit(1)
    if (!row) continue
    await db
      .update(onboardingRequests)
      .set({
        gocardlessMandateStatus: evt.action ?? null,
        updatedAt: new Date(),
      })
      .where(eq(onboardingRequests.id, row.id))
  }

  return NextResponse.json({ ok: true, processed: events.length })
}
