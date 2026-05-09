import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { onboardingRequests, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validatePassword, BCRYPT_COST } from '@/lib/password-policy'

export const dynamic = 'force-dynamic'

/**
 * POST /api/setup-account
 * Body: { id, token, password }
 *
 * The customer hits this from the link emailed after admin approval.
 * Validates the single-use bcrypt-hashed token, creates the user record
 * (role=pharmacist, linked to the new pharmacy), and marks the onboarding
 * request as completed.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    id?: string; token?: string; password?: string
  } | null

  if (!body?.id || !body?.token || !body?.password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const v = validatePassword(body.password)
  if (!v.ok) {
    return NextResponse.json({ error: v.errors.join(' · ') }, { status: 400 })
  }

  const [req] = await db
    .select()
    .from(onboardingRequests)
    .where(eq(onboardingRequests.id, body.id))
    .limit(1)
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.status !== 'approved') {
    return NextResponse.json({ error: 'This request is not in an approvable state' }, { status: 400 })
  }
  if (req.setupTokenUsedAt) {
    return NextResponse.json({ error: 'This setup link has already been used' }, { status: 410 })
  }
  if (!req.setupTokenHash || !req.setupTokenExpiresAt) {
    return NextResponse.json({ error: 'Setup link not configured' }, { status: 400 })
  }
  if (req.setupTokenExpiresAt < new Date()) {
    return NextResponse.json({ error: 'Setup link has expired' }, { status: 410 })
  }
  const tokenOk = await bcrypt.compare(body.token, req.setupTokenHash)
  if (!tokenOk) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  }
  if (!req.pharmacyId) {
    return NextResponse.json({ error: 'No pharmacy on record — contact support' }, { status: 500 })
  }

  // Don't create a duplicate if a user already exists for this email
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, req.contactEmail))
    .limit(1)
  if (existing[0]) {
    return NextResponse.json({ error: 'An account already exists for this email' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST)
  await db.insert(users).values({
    email: req.contactEmail,
    passwordHash,
    firstName: req.contactFirstName,
    lastName: req.contactLastName,
    role: 'pharmacist',
    pharmacyId: req.pharmacyId,
    isActive: true,
  })

  await db
    .update(onboardingRequests)
    .set({
      status: 'completed',
      setupTokenUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(onboardingRequests.id, req.id))

  return NextResponse.json({ ok: true })
}
