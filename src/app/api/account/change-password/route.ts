/**
 * POST /api/account/change-password
 *
 * Verifies the current password, sets a new bcrypted hash, and clears
 * the must_change_password flag. Used by:
 *   - /change-password (forced first-login)
 *   - eventually by /account password-change UI for self-serve changes
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const currentPassword = (body.currentPassword || '').toString()
  const newPassword = (body.newPassword || '').toString()

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Both passwords are required' },
      { status: 400 },
    )
  }
  if (newPassword.length < 12) {
    return NextResponse.json(
      { error: 'New password must be at least 12 characters' },
      { status: 400 },
    )
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: 'New password must be different from the current password' },
      { status: 400 },
    )
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    await audit({
      action: 'password_change',
      userId: user.id,
      userEmail: user.email,
      details: { outcome: 'failed', reason: 'wrong_current_password' },
    })
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 400 },
    )
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await db
    .update(users)
    .set({
      passwordHash: newHash,
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  await audit({
    action: 'password_change',
    userId: user.id,
    userEmail: user.email,
    pharmacyId: user.pharmacyId,
    details: { outcome: 'success' },
  })

  return NextResponse.json({ ok: true })
}
