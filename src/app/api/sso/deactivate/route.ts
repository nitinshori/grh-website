/**
 * SSO user-deactivation webhook — per the GRH ↔ HubRx SSO Integration Spec.
 *
 *   POST /api/sso/deactivate
 *   Authorization: Bearer {shared secret}
 *   Content-Type: application/json
 *   { "external_id": "hubrx-user-a1b2c3d4" }
 *
 * Called by HubRx Insights when they remove a user. GRH marks the
 * matching user is_active = false; their session is rejected at the
 * next request once the auth cache expires.
 *
 * Tenancy: the accepted secret is chosen by the HOSTNAME the request
 * arrives on — HUBRX_SSO_SECRET on hubrx.getrealhealthpgd.co.uk,
 * HUBRX_SSO_SECRET_SANDBOX on hubrx-sandbox.getrealhealthpgd.co.uk —
 * and only users provisioned under that same tenant (auth_source) can
 * be deactivated. The sandbox secret therefore cannot touch live users,
 * and vice versa. On the default GRH hostname this route 404s.
 */

import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { tenantFromHost } from '@/lib/tenants'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const tenant = tenantFromHost(req.headers.get('host'))
  if (!tenant.sso.enabled) {
    return new NextResponse('Not found', { status: 404 })
  }

  const secret = process.env[tenant.sso.secretEnvVar]
  if (!secret || secret.length < 32) {
    return NextResponse.json(
      { error: 'SSO not configured for this environment' },
      { status: 503 },
    )
  }

  // Bearer auth, compared in constant time.
  const authz = req.headers.get('authorization') ?? ''
  const match = authz.match(/^Bearer\s+(.+)$/i)
  const provided = match?.[1]?.trim()
  if (!provided || !timingSafeEqualStr(provided, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const externalId =
    body && typeof body === 'object' && 'external_id' in body
      ? String((body as { external_id: unknown }).external_id ?? '').trim()
      : ''
  if (!externalId) {
    return NextResponse.json(
      { error: 'Missing required field: external_id' },
      { status: 400 },
    )
  }

  // Scope strictly to this tenant's users — a sandbox call can never
  // deactivate a live-tenant user.
  const [deactivated] = await db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(users.authSource, tenant.slug),
        eq(users.externalId, externalId),
        eq(users.isActive, true),
      ),
    )
    .returning({ id: users.id, email: users.email, pharmacyId: users.pharmacyId })

  if (!deactivated) {
    // Distinguish "already inactive" from "never existed" so HubRx can
    // treat repeat calls as idempotent successes.
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(eq(users.authSource, tenant.slug), eq(users.externalId, externalId)),
      )
      .limit(1)
    if (existing) {
      return NextResponse.json({ ok: true, alreadyInactive: true })
    }
    return NextResponse.json(
      { error: 'Unknown external_id for this tenant' },
      { status: 404 },
    )
  }

  await audit({
    action: 'sso_user_deactivated',
    userId: deactivated.id,
    userEmail: deactivated.email,
    pharmacyId: deactivated.pharmacyId,
    details: { via: 'sso_deactivate_webhook', tenant: tenant.slug, externalId },
    request: req,
  })

  return NextResponse.json({ ok: true })
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}
