/**
 * Self-service password reset.
 *
 * POST { email } → if an active account exists for that email, a single-use
 * reset link is emailed to it. The response is the same whether or not the
 * address is known, so the endpoint cannot be used to discover accounts.
 *
 * Reuses the setup-token fields on `users` (setup_token_hash, expiry,
 * used_at) and the existing /set-password page, so a reset and an invite are
 * the same mechanism: a bcrypt-hashed random token, 2 hours for a reset.
 * Issuing a new token clears setup_token_used_at, which is what lets an
 * account that has already been set up once go through /set-password again.
 *
 * Built 18 Sep 2026 after Burrage Pharmacy (a paying direct customer) wrote
 * three times that they could not log in and there was no reset option on
 * the site. Until now the only routes to a password were the invite email
 * at sign-up, a pharmacy admin resending it, or a super admin doing it by
 * hand.
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail, escapeHtml } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RESET_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours

// A fresh response each time: a NextResponse body can only be read once.
const ok = () =>
  NextResponse.json({
    ok: true,
    message: 'If an account exists for that email address, a reset link has been sent to it.',
  })

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null
  const email = (body?.email ?? '').trim().toLowerCase()
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter the email address you log in with.' }, { status: 400 })
  }

  // Per-address and per-caller limits: 3 an hour for one address, 10 an hour
  // for one IP. Over the limit we still answer OK, silently.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit(`forgot:email:${email}`, 3, 60 * 60 * 1000).ok) return ok()
  if (!rateLimit(`forgot:ip:${ip}`, 10, 60 * 60 * 1000).ok) return ok()

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      isActive: users.isActive,
    })
    .from(users)
    .where(sql`LOWER(${users.email}) = ${email}`)
    .limit(1)

  // Unknown or deactivated: same answer, nothing sent. HubRx-tenant users
  // who were given direct logins ahead of the portal (Tina, Jonathan, Mark)
  // log in with a password like everyone else, so they are not excluded.
  if (!user || !user.isActive) return ok()

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(rawToken, 10)
  const expiresAt = new Date(Date.now() + RESET_TTL_MS)

  await db
    .update(users)
    .set({
      setupTokenHash: tokenHash,
      setupTokenExpiresAt: expiresAt,
      setupTokenUsedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const resetUrl = `${appUrl}/set-password?uid=${user.id}&token=${rawToken}&mode=reset`

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your Get Real Health password',
      html:
        `<p>Hi ${escapeHtml(user.firstName)},</p>` +
        `<p>Someone asked to reset the password for your Get Real Health PGD platform account. ` +
        `If that was you, choose a new password here:</p>` +
        `<p><a href="${resetUrl}">${resetUrl}</a></p>` +
        `<p>The link works once and expires in 2 hours. If you did not ask for this, you can ignore ` +
        `this email; your password has not changed.</p>` +
        `<p>Get Real Health<br>info@getrealhealthpgd.co.uk</p>`,
      replyTo: 'info@getrealhealthpgd.co.uk',
    })
  } catch (e) {
    // Do not reveal the failure to the caller (it would confirm the account
    // exists); log it so it shows up in Vercel.
    console.error('[forgot-password] email send failed:', e instanceof Error ? e.message : e)
  }

  return ok()
}
