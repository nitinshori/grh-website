/**
 * Thin wrapper around the GoCardless REST API. We don't pull in the official
 * SDK because it's a heavy dependency for the three calls we actually need:
 *   - createRedirectFlow  → returns a hosted URL the customer is sent to
 *   - completeRedirectFlow → exchanged for a Customer + Mandate after the
 *                            customer has filled in their bank details
 *   - verifyWebhookSignature → for the webhook receiver
 *
 * Set:
 *   GOCARDLESS_ACCESS_TOKEN           sandbox or live access token
 *   GOCARDLESS_ENVIRONMENT            "sandbox" (default) or "live"
 *   GOCARDLESS_WEBHOOK_SECRET         set in GoCardless dashboard webhook settings
 *
 * Test mode: in sandbox you can use the GoCardless test-bank account when
 * filling the redirect-flow form. Mandate goes "active" within seconds.
 */

import crypto from 'crypto'

const GC_API_VERSION = '2015-07-06'

function baseUrl(): string {
  return process.env.GOCARDLESS_ENVIRONMENT === 'live'
    ? 'https://api.gocardless.com'
    : 'https://api-sandbox.gocardless.com'
}

function token(): string {
  const t = process.env.GOCARDLESS_ACCESS_TOKEN
  if (!t) throw new Error('GOCARDLESS_ACCESS_TOKEN env var is not set')
  return t
}

async function gcFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      'GoCardless-Version': GC_API_VERSION,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const text = await res.text()
  let body: unknown
  try { body = text ? JSON.parse(text) : {} } catch { body = { raw: text } }
  if (!res.ok) {
    const err = (body as { error?: { message?: string } }).error
    throw new Error(`GoCardless ${res.status}: ${err?.message ?? text.slice(0, 200)}`)
  }
  return body as T
}

interface CreateRedirectFlowOptions {
  description: string  // shown to customer in the GoCardless flow
  sessionToken: string // unique-per-flow nonce we own (anti-CSRF)
  successRedirectUrl: string  // where GoCardless sends the customer back
  prefilledCustomer?: {
    given_name?: string
    family_name?: string
    email?: string
    company_name?: string
    address_line1?: string
    city?: string
    postal_code?: string
  }
}

export async function createRedirectFlow(opts: CreateRedirectFlowOptions) {
  const body = {
    redirect_flows: {
      description: opts.description,
      session_token: opts.sessionToken,
      success_redirect_url: opts.successRedirectUrl,
      ...(opts.prefilledCustomer
        ? { prefilled_customer: opts.prefilledCustomer }
        : {}),
    },
  }
  const out = await gcFetch<{ redirect_flows: { id: string; redirect_url: string } }>(
    '/redirect_flows',
    { method: 'POST', body: JSON.stringify(body) },
  )
  return { id: out.redirect_flows.id, redirectUrl: out.redirect_flows.redirect_url }
}

export async function completeRedirectFlow(redirectFlowId: string, sessionToken: string) {
  const body = { data: { session_token: sessionToken } }
  const out = await gcFetch<{
    redirect_flows: {
      id: string
      links: { customer: string; mandate: string }
    }
  }>(`/redirect_flows/${redirectFlowId}/actions/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return {
    customerId: out.redirect_flows.links.customer,
    mandateId: out.redirect_flows.links.mandate,
  }
}

export async function getMandate(mandateId: string) {
  const out = await gcFetch<{ mandates: { id: string; status: string; reference: string } }>(
    `/mandates/${mandateId}`,
  )
  return out.mandates
}

/**
 * Verify a GoCardless webhook signature. Compute HMAC-SHA256 of the request
 * body using GOCARDLESS_WEBHOOK_SECRET and compare to the Webhook-Signature
 * header (constant-time).
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false
  const secret = process.env.GOCARDLESS_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
