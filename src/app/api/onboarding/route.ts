import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyTurnstile } from '@/lib/turnstile'

export const dynamic = 'force-dynamic'

/**
 * POST /api/onboarding
 * Creates a new onboarding request from the public sign-up form.
 * Body: { pharmacyName, pharmacyAddress, ..., contactFirstName, contactEmail, ... }
 * Returns: { id }
 *
 * Self-serve — no auth required. Lightly rate-limited at the IP level.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as (Record<string, string> & { turnstileToken?: string }) | null
  if (!body) return NextResponse.json({ error: 'Bad body' }, { status: 400 })

  // Captcha gate (anti-bot). No-op if TURNSTILE_SECRET_KEY isn't set.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const captcha = await verifyTurnstile(body.turnstileToken, ip)
  if (!captcha.ok) return NextResponse.json({ error: 'Captcha verification failed', detail: captcha.error }, { status: 400 })

  // Required fields
  const required = ['pharmacyName', 'contactFirstName', 'contactLastName', 'contactEmail']
  for (const f of required) {
    if (!body[f] || typeof body[f] !== 'string' || body[f].trim().length < 2) {
      return NextResponse.json({ error: `Missing required field: ${f}` }, { status: 400 })
    }
  }

  // Email shape
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail)) {
    return NextResponse.json({ error: 'Invalid contact email' }, { status: 400 })
  }

  // Reject if a started/awaiting request already exists for this email
  // (keeps the state machine clean — customer can resume their existing one)
  const existing = await db
    .select({ id: onboardingRequests.id, status: onboardingRequests.status })
    .from(onboardingRequests)
    .where(eq(onboardingRequests.contactEmail, body.contactEmail.toLowerCase().trim()))
    .limit(1)

  if (existing[0] && existing[0].status !== 'rejected' && existing[0].status !== 'completed') {
    return NextResponse.json({
      id: existing[0].id,
      status: existing[0].status,
      resumed: true,
    })
  }

  const [created] = await db
    .insert(onboardingRequests)
    .values({
      pharmacyName: body.pharmacyName.trim().slice(0, 255),
      pharmacyAddress: body.pharmacyAddress?.trim().slice(0, 500) || null,
      pharmacyPostcode: body.pharmacyPostcode?.trim().slice(0, 20) || null,
      pharmacyPhone: body.pharmacyPhone?.trim().slice(0, 50) || null,
      pharmacyEmail: body.pharmacyEmail?.trim().toLowerCase().slice(0, 255) || null,
      pharmacyGphc: body.pharmacyGphc?.trim().slice(0, 50) || null,
      pharmacyOdsCode: body.pharmacyOdsCode?.trim().slice(0, 20) || null,
      contactFirstName: body.contactFirstName.trim().slice(0, 100),
      contactLastName: body.contactLastName.trim().slice(0, 100),
      contactEmail: body.contactEmail.trim().toLowerCase().slice(0, 255),
      contactPhone: body.contactPhone?.trim().slice(0, 50) || null,
      contactGphc: body.contactGphc?.trim().slice(0, 50) || null,
      contactRole: body.contactRole?.trim().slice(0, 50) || null,
      status: 'started',
    })
    .returning({ id: onboardingRequests.id })

  return NextResponse.json({ id: created.id, status: 'started' })
}
