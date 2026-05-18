/**
 * Consume a user-level setup token and set the password.
 * Used by the pharmacy_admin staff-invite flow.
 *
 * POST { uid, token, password } → sets user's password, marks token used.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { uid?: string; token?: string; password?: string } | null
  if (!body || !body.uid || !body.token || !body.password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (body.password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const [u] = await db.select().from(users).where(eq(users.id, body.uid)).limit(1)
  if (!u || !u.setupTokenHash || !u.setupTokenExpiresAt) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 })
  }
  if (u.setupTokenUsedAt) {
    return NextResponse.json({ error: 'This link has already been used' }, { status: 400 })
  }
  if (u.setupTokenExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: 'This link has expired. Ask your pharmacy admin to resend.' }, { status: 400 })
  }
  const ok = await bcrypt.compare(body.token, u.setupTokenHash)
  if (!ok) return NextResponse.json({ error: 'Invalid link' }, { status: 400 })

  const newHash = await bcrypt.hash(body.password, 10)
  await db.update(users).set({
    passwordHash: newHash,
    setupTokenUsedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(users.id, u.id))

  return NextResponse.json({ ok: true, email: u.email })
}
