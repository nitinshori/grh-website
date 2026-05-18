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
import { and, eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function canManageStaff(role?: string | null): boolean {
  return role === 'pharmacy_admin' || role === 'super_admin'
}

async function assertStaffBelongsToPharmacy(userId: string, pharmacyId: string) {
  const [row] = await db.select({ id: users.id }).from(users)
    .where(and(eq(users.id, userId), eq(users.pharmacyId, pharmacyId))).limit(1)
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
  } | null
  if (!body) return NextResponse.json({ error: 'Bad body' }, { status: 400 })

  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (body.role === 'pharmacist' || body.role === 'pharmacy_admin') updates.role = body.role
  if (typeof body.isActive === 'boolean') updates.isActive = body.isActive
  if (typeof body.firstName === 'string') updates.firstName = body.firstName.trim()
  if (typeof body.lastName === 'string') updates.lastName = body.lastName.trim()

  await db.update(users).set(updates).where(eq(users.id, id))
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

  const [pharmacy] = await db.select({ name: pharmacies.name }).from(pharmacies).where(eq(pharmacies.id, pharmacyId)).limit(1)
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
