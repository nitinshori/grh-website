import 'server-only'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { onboardingRequests, users } from '@/lib/db/schema'
import { sendEmail, escapeHtml } from '@/lib/email'

/**
 * The customer's first login, and the email that tells them how to set it.
 *
 * Until 21 September 2026 the login was created only when the customer
 * clicked the setup link, which expired after 7 days. Burrage Pharmacy was
 * approved and billed on that basis, the email never reached them, and there
 * was no account for anything on the site to reset. Now:
 *
 *   - ensureFirstUser() creates the user at approval: locked password, role
 *     pharmacist, attached to the new pharmacy. Idempotent, and it adopts an
 *     existing user with that email rather than failing.
 *   - sendSetupEmail() issues a fresh single-use token on the user (14 days),
 *     emails the /set-password link, and records the outcome on the onboarding
 *     request (sent_at or error, plus an attempt count) so the admin queue can
 *     show it and offer a resend.
 *
 * The legacy /setup-account route still works for links issued before this
 * change; it refuses politely if the user already exists.
 */

const SETUP_TTL_MS = 14 * 24 * 60 * 60 * 1000

export interface OnboardingForSetup {
  id: string
  pharmacyName: string
  pharmacyId: string | null
  contactFirstName: string | null
  contactLastName: string | null
  contactEmail: string | null
}

export async function ensureFirstUser(req: OnboardingForSetup): Promise<{ id: string; email: string; firstName: string } | null> {
  if (!req.contactEmail || !req.pharmacyId) return null
  const email = req.contactEmail.trim().toLowerCase()
  const [existing] = await db
    .select({ id: users.id, email: users.email, firstName: users.firstName, pharmacyId: users.pharmacyId })
    .from(users)
    .where(sql`LOWER(${users.email}) = ${email}`)
    .limit(1)
  if (existing) {
    if (!existing.pharmacyId) {
      await db.update(users).set({ pharmacyId: req.pharmacyId, updatedAt: new Date() }).where(eq(users.id, existing.id))
    }
    return { id: existing.id, email: existing.email, firstName: existing.firstName }
  }
  const lockedHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: lockedHash,
      firstName: req.contactFirstName || 'Pharmacy',
      lastName: req.contactLastName || req.pharmacyName,
      role: 'pharmacist',
      pharmacyId: req.pharmacyId,
      isActive: true,
      authSource: 'direct',
    })
    .returning({ id: users.id, email: users.email, firstName: users.firstName })
  return created
}

export async function sendSetupEmail(
  req: OnboardingForSetup,
  user: { id: string; email: string; firstName: string },
  kind: 'welcome' | 'resend',
): Promise<{ setupUrl: string; emailed: boolean; emailError?: string }> {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(rawToken, 10)
  await db
    .update(users)
    .set({
      setupTokenHash: tokenHash,
      setupTokenExpiresAt: new Date(Date.now() + SETUP_TTL_MS),
      setupTokenUsedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const setupUrl = `${appUrl}/set-password?uid=${user.id}&token=${rawToken}`

  let emailed = false
  let emailError: string | undefined
  try {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured')
    await sendEmail({
      to: user.email,
      subject:
        kind === 'welcome'
          ? 'Welcome to Get Real Health: set up your account'
          : 'Your Get Real Health account: set your password',
      html:
        `<p>Hi ${escapeHtml(user.firstName)},</p>` +
        (kind === 'welcome'
          ? `<p>Your application for ${escapeHtml(req.pharmacyName)} has been approved. `
          : `<p>Here is a new link to finish setting up your Get Real Health account for ${escapeHtml(req.pharmacyName)}. `) +
        `Choose your password here to log in to the Get Real Health PGD platform:</p>` +
        `<p><a href="${setupUrl}">${setupUrl}</a></p>` +
        `<p>The link works once and expires in 14 days. If it expires, use "Forgotten your password?" on the login page ` +
        `with this email address and a new link will be sent, or reply to this email.</p>` +
        `<p>Dr Nitin Shori<br>Get Real Health<br>info@getrealhealthpgd.co.uk</p>`,
      replyTo: 'info@getrealhealthpgd.co.uk',
    })
    emailed = true
  } catch (e) {
    emailError = e instanceof Error ? e.message : String(e)
  }

  if (!emailed) {
    // Tell the admin, on a channel that does not depend on the same failure
    // where possible: the Vercel log always, and an email to the admin
    // address, which will itself fail if Resend is the problem but succeeds
    // when the fault is the customer's address.
    console.error(`[onboarding-setup] setup email to ${user.email} for ${req.pharmacyName} failed: ${emailError}`)
    try {
      await sendEmail({
        to: process.env.ADMIN_NOTIFY_EMAIL || 'info@getrealhealthpgd.co.uk',
        subject: `Setup email FAILED: ${req.pharmacyName}`,
        html:
          `<p>The account setup email for <strong>${escapeHtml(req.pharmacyName)}</strong> (${escapeHtml(user.email)}) could not be sent.</p>` +
          `<p>Error: ${escapeHtml(emailError ?? 'unknown')}</p>` +
          `<p>The pharmacy is approved and billed but cannot log in until they receive a link. Open ` +
          `<a href="${appUrl}/admin/onboarding">${appUrl}/admin/onboarding</a>, fix the cause, and press Resend setup link; ` +
          `the link is also shown on screen there so it can be sent by hand.</p>`,
      })
    } catch (notifyErr) {
      console.error('[onboarding-setup] admin failure notice could not be sent either:', notifyErr)
    }
  }

  await db
    .update(onboardingRequests)
    .set({
      setupEmailSentAt: emailed ? new Date() : undefined,
      setupEmailError: emailed ? null : emailError ?? 'unknown error',
      setupEmailAttempts: sql`${onboardingRequests.setupEmailAttempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(onboardingRequests.id, req.id))

  return { setupUrl, emailed, emailError }
}

/** True when the customer has chosen a password (the setup token was used) or never needed one. */
export async function hasCompletedSetup(email: string | null): Promise<boolean> {
  if (!email) return false
  const [u] = await db
    .select({ used: users.setupTokenUsedAt, hash: users.setupTokenHash })
    .from(users)
    .where(and(sql`LOWER(${users.email}) = ${email.trim().toLowerCase()}`, eq(users.isActive, true)))
    .limit(1)
  if (!u) return false
  // A user with no outstanding setup token set their password some other way
  // (legacy /setup-account, admin reset); one with a used token set it via the link.
  return !u.hash || !!u.used
}
