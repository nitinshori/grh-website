import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Character set for generated temporary passwords. Matches the bulk-import
// CSV format used during PPH onboarding — 12 chars, mixed case + digits, no
// visually ambiguous characters (no 0/O/1/l/I/o), copy-paste friendly.
const TEMP_PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const TEMP_PASSWORD_LENGTH = 12

function generateTempPassword(): string {
  let out = ''
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    out += TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]
  }
  return out
}

/**
 * POST /api/admin/users/[id]/reset-password
 *
 * One-click password reset. Generates a random temporary password, sets the
 * user's must_change_password flag so they're forced to change it on next
 * login, and returns the plain-text temp password ONCE to the calling admin
 * so they can pass it on to the user out-of-band.
 *
 * Authorisation rules:
 *   - super_admin can reset any user.
 *   - pharmacy_admin can reset users that belong to their own pharmacy.
 *   - Everything else is rejected.
 *
 * The plain-text password is returned in the response body and is never
 * written to logs or persisted anywhere apart from the bcrypt hash on the
 * user record.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Load target user (we need their pharmacyId to authorise pharmacy_admins)
    const target = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        username: users.username,
        pharmacyId: users.pharmacyId,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (target.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const targetUser = target[0]
    const callerRole = session.user.role
    const callerPharmacyId = session.user.pharmacyId

    // Authorisation: super_admin always allowed; pharmacy_admin only allowed
    // to reset users in their own pharmacy.
    const isSuperAdmin = callerRole === 'super_admin'
    const isPharmacyAdmin =
      callerRole === 'pharmacy_admin' &&
      callerPharmacyId !== null &&
      callerPharmacyId === targetUser.pharmacyId

    if (!isSuperAdmin && !isPharmacyAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Belt-and-braces: a pharmacy_admin should not be able to reset a
    // super_admin's password even if pharmacy_ids match (super_admins
    // shouldn't have a pharmacy_id, but guard anyway).
    if (!isSuperAdmin && targetUser.role === 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate temp password + hash. The plain-text password leaves this
    // function in the response body and is never logged.
    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        username: targetUser.username,
      },
      // ONE-TIME visibility. Caller is expected to copy this immediately
      // and pass it to the user via a separate channel (email / Slack / etc.).
      // We do not store it; on next reset a fresh value will be issued.
      tempPassword,
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
