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
import { and, eq, desc, inArray } from 'drizzle-orm'
import { extraBranchesFor, grantBranch, managedBranches } from '@/lib/branch-access'
import { audit } from '@/lib/audit'

/** Roles a pharmacy admin may see and manage. Never super_admin. */
const STAFF_ROLES = ['pharmacist', 'pharmacy_admin'] as const
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

  // A pharmacy admin manages every branch of their group (migration 073),
  // not just the one they are working at.
  const branches = await managedBranches(pharmacyId)
  const branchIds = branches.map((b) => b.id)
  const branchName = new Map(branches.map((b) => [b.id, b.name]))

  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      pharmacyId: users.pharmacyId,
      setupTokenUsedAt: users.setupTokenUsedAt,
      setupTokenExpiresAt: users.setupTokenExpiresAt,
    })
    .from(users)
    .where(and(inArray(users.pharmacyId, branchIds), inArray(users.role, [...STAFF_ROLES])))
    .orderBy(desc(users.createdAt))
  const extras = await extraBranchesFor(rows.map((r) => r.id))

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
      pharmacyId: u.pharmacyId,
      pharmacyName: u.pharmacyId ? branchName.get(u.pharmacyId) ?? null : null,
      alsoWorksAt: extras.get(u.id) ?? [],
    }
  })

  // Pickable branches are the active ones; staff homed at a closed branch
  // still appear above (named) so they can be moved.
  return NextResponse.json({
    staff,
    branches: branches.filter((b) => b.isActive).map((b) => ({ id: b.id, name: b.name })),
  })
}

// ── POST — invite a new staff member ───────────────────────────

interface CreateBody {
  firstName?: string
  lastName?: string
  email?: string
  role?: 'pharmacist' | 'pharmacy_admin'
  gphcNumber?: string
  /** Home branch; must be one the admin manages. Defaults to the admin's current branch. */
  pharmacyId?: string
  /** Further branches in the group the person also works at. */
  alsoWorksAt?: string[]
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !canManageStaff(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const adminPharmacyId = session.user.pharmacyId
  if (!adminPharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 })

  const body = (await req.json().catch(() => null)) as CreateBody | null
  if (!body) return NextResponse.json({ error: 'Bad body' }, { status: 400 })

  const managed = await managedBranches(adminPharmacyId)
  const managedIds = new Set(managed.filter((b) => b.isActive).map((b) => b.id))
  const pharmacyId = body.pharmacyId && typeof body.pharmacyId === 'string' ? body.pharmacyId : adminPharmacyId
  if (!managedIds.has(pharmacyId)) return NextResponse.json({ error: 'That branch is not in your group' }, { status: 400 })
  const alsoWorksAt = Array.isArray(body.alsoWorksAt)
    ? [...new Set(body.alsoWorksAt.filter((x): x is string => typeof x === 'string' && x !== pharmacyId))]
    : []
  if (alsoWorksAt.some((x) => !managedIds.has(x))) return NextResponse.json({ error: 'An extra branch is not in your group' }, { status: 400 })
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

  const granted: string[] = []
  const grantErrors: string[] = []
  for (const extra of alsoWorksAt) {
    const r = await grantBranch(created.id, extra, session.user.id)
    if (r.ok) granted.push(extra)
    else grantErrors.push(r.error)
  }
  if (granted.length > 0 || grantErrors.length > 0) {
    await audit({
      action: 'branch_access_changed',
      userId: session.user.id,
      userEmail: session.user.email,
      pharmacyId,
      request: req,
      details: { toUser: created.id, home: pharmacyId, granted, failed: grantErrors, via: 'staff_invite' },
    })
  }

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
    // The account exists even if an extra branch could not be granted;
    // the UI shows these so the admin can fix the branch list.
    warnings: grantErrors.length > 0 ? grantErrors : undefined,
  })
}
