import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createRedirectFlow } from '@/lib/gocardless'

export const dynamic = 'force-dynamic'

/**
 * POST /api/onboarding/[id]/start-mandate
 * Creates a GoCardless redirect flow for the onboarding request and returns
 * the URL the customer should be redirected to. Stores the redirect-flow id
 * + a generated session_token on the request row so the callback can be
 * verified.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: 'Bad id' }, { status: 400 })

  const [req] = await db
    .select()
    .from(onboardingRequests)
    .where(eq(onboardingRequests.id, id))
    .limit(1)
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.status === 'rejected') {
    return NextResponse.json({ error: 'This sign-up was rejected' }, { status: 400 })
  }

  // session_token is a per-flow nonce we own — anti-CSRF for the GoCardless callback
  const sessionToken = crypto.randomBytes(24).toString('hex')

  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const successUrl = `${appUrl}/onboard/dd-complete?id=${req.id}&token=${sessionToken}`

  let flow
  try {
    flow = await createRedirectFlow({
      description: `Get Real Health subscription — ${req.pharmacyName}`,
      sessionToken,
      successRedirectUrl: successUrl,
      prefilledCustomer: {
        given_name: req.contactFirstName,
        family_name: req.contactLastName,
        email: req.contactEmail,
        company_name: req.pharmacyName,
        ...(req.pharmacyAddress ? { address_line1: req.pharmacyAddress } : {}),
        ...(req.pharmacyPostcode ? { postal_code: req.pharmacyPostcode } : {}),
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'GoCardless flow could not be created', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    )
  }

  // Stash the redirect-flow id and session token (token in mandateStatus
  // until we promote it after completion — we re-use the column as scratch space)
  await db
    .update(onboardingRequests)
    .set({
      gocardlessRedirectFlowId: flow.id,
      // We can't add a column right now without another migration; tuck the
      // session token into the mandate-status column temporarily. Once the
      // redirect is completed, we overwrite this with the real status.
      gocardlessMandateStatus: `session:${sessionToken}`,
      status: 'dd_pending',
      updatedAt: new Date(),
    })
    .where(eq(onboardingRequests.id, req.id))

  return NextResponse.json({ redirectUrl: flow.redirectUrl })
}
