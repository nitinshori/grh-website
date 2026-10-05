/**
 * Update / deactivate a single staff member.
 *
 * PATCH — partial update (role, isActive). Scoped to the caller's pharmacy.
 * POST  — body { action: 'resend_invite' } — generate a fresh setup token
 *         + email a new link. Useful when the original 7-day link expires.
 *
 * Only pharmacy_admin and super_admin. Pharmacy admins cannot demote /
 * deactivate themselves.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { extraBranchesFor, grantBranch, managedBranches, rehomeUser, revokeBranch } from '@/lib/branch-access'
import { audit } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canManageStaff(role?: string | null): boolean {
  return role === 'pharmacy_admin' || role === 'super_admin'
}

/** Roles a pharmacy admin may manage. A super_admin homed in the group is never touchable here. */
const STAFF_ROLES = ['pharmacist', 'pharmacy_admin'] as const

/** True when the user is staff whose home branch is one the admin manages (their group). */
async function assertStaffBelongsToPharmacy(userId: string, adminPharmacyId: string) {
  const managed = await managedBranches(adminPharmacyId)
  if (managed.length === 0) return false
  const [row] = await db.select({ id: users.id }).from(users)
    .where(and(
      eq(users.id, userId),
      inArray(users.pharmacyId, managed.map((m) => m.id)),
      inArray(users.role, [...STAFF_ROLES]),
    )).limit(1)
  return !!row
}

// ── PATCH ──────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !canManageStaff(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 })

  const { id } = await ctx.params
  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot modify your own account here" }, { status: 400 })
  }
  if (!(await assertStaffBelongsToPharmacy(id, pharmacyId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await req.json().catch(() => null)) as {
    role?: 'pharmacist' | 'pharmacy_admin'
    isActive?: boolean
    firstName?: string
    lastName?: string
    /** Home branch (must be in the admin's group). */
    pharmacyId?: string
    /** Full set of extra branches; omitted means unchanged. */
    alsoWorksAt?: string[]
  } | null
  if (!body) return NextResponse.json({ error: 'Bad body' }, { status: 400 })

  const managed = await managedBranches(pharmacyId)
  // Only an active branch can become a home or an extra branch.
  const managedIds = new Set(managed.filter((m) => m.isActive).map((m) => m.id))

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.role === 'pharmacist' || body.role === 'pharmacy_admin') updates.role = body.role
  if (typeof body.isActive === 'boolean') updates.isActive = body.isActive
  if (typeof body.firstName === 'string') updates.firstName = body.firstName.trim()
  if (typeof body.lastName === 'string') updates.lastName = body.lastName.trim()
  let homeMovedTo: string | null = null
  if (typeof body.pharmacyId === 'string') {
    if (!managedIds.has(body.pharmacyId)) return NextResponse.json({ error: 'That branch is not in your group' }, { status: 400 })
    homeMovedTo = body.pharmacyId
  }
  // Validate the extra-branch set before writing anything.
  let wanted: Set<string> | null = null
  if (Array.isArray(body.alsoWorksAt)) {
    const [u] = await db.select({ home: users.pharmacyId }).from(users).where(eq(users.id, id)).limit(1)
    const home = homeMovedTo ?? u?.home
    wanted = new Set(body.alsoWorksAt.filter((x): x is string => typeof x === 'string' && x !== home))
    if ([...wanted].some((x) => !managedIds.has(x))) return NextResponse.json({ error: 'An extra branch is not in your group' }, { status: 400 })
  }

  await db.update(users).set(updates).where(eq(users.id, id))
  // rehomeUser also prunes grants that the move makes invalid.
  if (homeMovedTo) await rehomeUser(id, homeMovedTo)

  const granted: string[] = []
  const revoked: string[] = []
  const failed: string[] = []
  if (wanted) {
    const current = new Set((await extraBranchesFor([id])).get(id)?.map((b) => b.id) ?? [])
    for (const x of wanted) {
      if (current.has(x)) continue
      const r = await grantBranch(id, x, session.user.id)
      if (r.ok) granted.push(x)
      else failed.push(r.error)
    }
    for (const x of current) {
      if (wanted.has(x)) continue
      await revokeBranch(id, x)
      revoked.push(x)
    }
    // A revoked branch may be the one they are working at: the middleware
    // (60s cache) and the JWT re-check (5 min) move them off it.
  }
  if (homeMovedTo || granted.length || revoked.length || failed.length) {
    await audit({
      action: 'branch_access_changed',
      userId: session.user.id,
      userEmail: session.user.email,
      pharmacyId,
      request: req,
      details: { toUser: id, homeMovedTo, granted, revoked, failed, via: 'staff_edit' },
    })
  }
  if (failed.length > 0) {
    return NextResponse.json({ error: failed.join('; '), partial: true }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}

// ── POST — resend invite ──────────────────────────────────────

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || !canManageStaff(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 400 })

  const { id } = await ctx.params
  if (!(await assertStaffBelongsToPharmacy(id, pharmacyId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await req.json().catch(() => null)) as { action?: string } | null
  if (!body || body.action !== 'resend_invite') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!u) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Name the person's own home branch, not the branch the admin is working at.
  const [pharmacy] = u.pharmacyId
    ? await db.select({ name: pharmacies.name }).from(pharmacies).where(eq(pharmacies.id, u.pharmacyId)).limit(1)
    : []
  const pharmacyName = pharmacy?.name ?? 'your pharmacy'

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(rawToken, 10)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.update(users).set({
    setupTokenHash: tokenHash,
    setupTokenExpiresAt: expiresAt,
    setupTokenUsedAt: null,
    updatedAt: new Date(),
  }).where(eq(users.id, id))

  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const setupUrl = `${appUrl}/set-password?uid=${u.id}&token=${rawToken}`
  let emailed = false
  let emailError: string | undefined
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Get Real Health <noreply@getrealhealthpgd.co.uk>',
        to: u.email,
        subject: `New set-password link for ${pharmacyName} (Get Real Health)`,
        text:
          `Hi ${u.firstName},\n\n` +
          `Here's a fresh link to set your password and log in to ${pharmacyName}:\n\n` +
          `${setupUrl}\n\n` +
          `The link expires in 7 days.\n\n` +
          `— Get Real Health team\n`,
      })
      emailed = true
    } catch (e) { emailError = e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json({ ok: true, setupUrl, emailed, emailError })
}
