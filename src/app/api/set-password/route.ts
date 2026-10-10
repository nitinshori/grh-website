/**
 * Consume a user-level setup token and set the password.
 * Used by the pharmacy_admin staff-invite flow.
 *
 * POST { uid, token, password } → sets user's password, marks token used.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, onboardingRequests } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { validatePassword, passwordErrorMessage, BCRYPT_COST } from '@/lib/password-policy'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LINK_ERROR = "This link has expired or has already been used. Use 'Forgotten your password?' on the login page to get a new one."

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { uid?: string; token?: string; password?: string } | null
  if (!body || !body.uid || !body.token) {
    return NextResponse.json({ error: LINK_ERROR }, { status: 400 })
  }
  if (!body.password) {
    return NextResponse.json({ error: 'Please enter a password.' }, { status: 400 })
  }
  const v = validatePassword(body.password)
  if (!v.ok) {
    return NextResponse.json({ error: passwordErrorMessage(v) }, { status: 400 })
  }

  const [u] = await db.select().from(users).where(eq(users.id, body.uid)).limit(1)
  if (!u || !u.setupTokenHash || !u.setupTokenExpiresAt) {
    return NextResponse.json({ error: LINK_ERROR }, { status: 400 })
  }
  if (u.setupTokenUsedAt) {
    return NextResponse.json({ error: LINK_ERROR }, { status: 400 })
  }
  if (u.setupTokenExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: LINK_ERROR }, { status: 400 })
  }
  const ok = await bcrypt.compare(body.token, u.setupTokenHash)
  if (!ok) return NextResponse.json({ error: LINK_ERROR }, { status: 400 })

  const newHash = await bcrypt.hash(body.password, BCRYPT_COST)
  await db.update(users).set({
    passwordHash: newHash,
    setupTokenUsedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(users.id, u.id))

  // A first login created at approval (Sep 2026 onwards) completes the
  // sign-up record too, so the onboarding queue stops showing it as not set up.
  await db
    .update(onboardingRequests)
    .set({ status: 'completed', setupTokenUsedAt: new Date(), updatedAt: new Date() })
    .where(and(sql`LOWER(${onboardingRequests.contactEmail}) = ${u.email.toLowerCase()}`, eq(onboardingRequests.status, 'approved')))

  return NextResponse.json({ ok: true, email: u.email })
}
