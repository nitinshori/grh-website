import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { audit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { validatePassword, BCRYPT_COST } from '@/lib/password-policy'

/**
 * POST /api/me/change-password
 * Body: { currentPassword: string, newPassword: string }
 * Allows the logged-in user to change their own password.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Throttle: max 5 attempts per minute per user
    const limited = rateLimit(`pwchange:${session.user.id}`, 5, 60_000)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { currentPassword, newPassword } = body as {
      currentPassword?: string
      newPassword?: string
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new password are required' },
        { status: 400 }
      )
    }

    const v = validatePassword(newPassword)
    if (!v.ok) {
      return NextResponse.json({ error: v.errors.join(' · ') }, { status: 400 })
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      )
    }

    // Fetch the current password hash
    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash and store new password
    const newHash = await bcrypt.hash(newPassword, BCRYPT_COST)
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    await audit({
      pharmacyId: session.user.pharmacyId || null,
      userId: session.user.id,
      userEmail: session.user.email || null,
      action: 'password_change',
      request,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
