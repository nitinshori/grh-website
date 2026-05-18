/**
 * Pharmacy-admin staff management.
 *
 * GET — list users assigned to the current user's pharmacy.
 * POST — invite a new staff member. Creates a user with a random
 *        password (locked out), generates a setup token, emails a
 *        /set-password link via Resend (or returns the URL if no
 *        RESEND_API_KEY so the admin can hand-deliver it).
 *
 * Only pharmacy_admin and super_admin can use these endpoints.
 * Pharmacy admins are scoped to their own pharmacy_id.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canManageStaff(role?: string | null): boolean {
  return role === 'pharmacy_admin' || role === 'super_admin'
}

// ── GET — list staff in pharmacy ───────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user || !canManageStaff(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 })

  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      setupTokenUsedAt: users.setupTokenUsedAt,
      setupTokenExpiresAt: users.setupTokenExpiresAt,
    })
    .from(users)
    .where(eq(users.pharmacyId, pharmacyId))
    .orderBy(desc(users.createdAt))

  // Annotate each row with invite status (active / pending / expired)
  const now = Date.now()
  const staff = rows.map((u) => {
    let inviteStatus: 'active' | 'pending' | 'expired' = 'active'
    if (u.setupTokenExpiresAt && !u.setupTokenUsedAt) {
      inviteStatus = u.setupTokenExpiresAt.getTime() > now ? 'pending' : 'expired'
    }
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      inviteStatus,
    }
  })

  return NextResponse.json({ staff })
}

// ── POST — invite a new staff member ───────────────────────────

interface CreateBody {
  firstName?: string
  lastName?: string
  email?: string
  role?: 'pharmacist' | 'pharmacy_admin'
  gphcNumber?: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !canManageStaff(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 })

  const body = (await req.json().catch(() => null)) as CreateBody | null
  if (!body) return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  const firstName = (body.firstName ?? '').trim()
  const lastName = (body.lastName ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const role = body.role === 'pharmacy_admin' ? 'pharmacy_admin' : 'pharmacist'

  if (!firstName) return NextResponse.json({ error: 'First name required' }, { status: 400 })
  if (!lastName) return NextResponse.json({ error: 'Last name required' }, { status: 400 })
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  // Email must not already exist
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  // Lookup pharmacy name for the email
  const [pharmacy] = await db.select({ name: pharmacies.name }).from(pharmacies).where(eq(pharmacies.id, pharmacyId)).limit(1)
  const pharmacyName = pharmacy?.name ?? 'your pharmacy'

  // Create user with a random (uncrackable) password hash — they have to
  // use the setup token to choose their own password.
  const lockedPw = crypto.randomBytes(32).toString('hex')
  const lockedHash = await bcrypt.hash(lockedPw, 10)

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(rawToken, 10)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: lockedHash,
      firstName,
      lastName,
      role,
      pharmacyId,
      isActive: true,
      setupTokenHash: tokenHash,
      setupTokenExpiresAt: expiresAt,
    })
    .returning({ id: users.id, email: users.email, firstName: users.firstName })

  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const setupUrl = `${appUrl}/set-password?uid=${created.id}&token=${rawToken}`
  let emailed = false
  let emailError: string | undefined
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Get Real Health <noreply@getrealhealthpgd.co.uk>',
        to: created.email,
        subject: `You've been invited to ${pharmacyName} on Get Real Health`,
        text:
          `Hi ${created.firstName},\n\n` +
          `You've been added to ${pharmacyName} on the Get Real Health PGD platform. ` +
          `Click the link below to set your password and log in:\n\n` +
          `${setupUrl}\n\n` +
          `The link expires in 7 days. If it expires, ask your pharmacy admin to resend the invite.\n\n` +
          `— Get Real Health team\n`,
      })
      emailed = true
    } catch (e) {
      emailError = e instanceof Error ? e.message : String(e)
    }
  }

  return NextResponse.json({
    ok: true,
    user: created,
    setupUrl,
    emailed,
    emailError,
  })
}
