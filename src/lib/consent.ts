import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, userConsents } from '@/lib/db/schema'

/**
 * First-use consent for SSO-provisioned users (HubRx etc.).
 *
 * GRH acts as a processor/supplier to partner platforms; users arriving
 * via SSO never went through GRH's own signup, so we capture explicit
 * acceptance of the Terms of Service, Privacy Policy and data processing
 * arrangements on first entry — versioned, timestamped, with network
 * fingerprint, so there's an audit trail per user.
 *
 * Bump CONSENT_VERSION when the documents change materially and every
 * SSO user will be asked to re-accept on next visit.
 */

export const CONSENT_DOCUMENT = 'terms-dpa'
export const CONSENT_VERSION = '2026-07'

/**
 * WITHDRAWN 14 Aug 2026, per Nitin: the consent screen is removed for
 * everyone and no longer blocks entry to the portal.
 *
 * It had blocked three separate people from using their accounts. Jane
 * Wilkins in July, and Mark Pedder on 14 Aug, who reported "no option to
 * get past" the terms screen. The cause was that the accept button was
 * rendered in white text on a background set from the CSS variable
 * --tenant-primary, which is not defined on that route, so the button was
 * invisible: there was genuinely nothing on screen to click.
 *
 * Always returns false, so nobody is redirected to the consent screen.
 * Acceptances already recorded are left in user_consents for the audit
 * trail, and recordConsent below still works if the gate is ever
 * reinstated. If it is, fix the button styling first and test it on a
 * partner tenant, not just on the GRH tenant where the variable happens
 * to be set.
 */
export async function needsConsent(_userId: string): Promise<boolean> {
  return false
}

/** Unused while the gate is withdrawn; kept for a future reinstatement. */
export async function hasRecordedConsent(userId: string): Promise<boolean> {
  const [consent] = await db
    .select({ id: userConsents.id })
    .from(userConsents)
    .where(
      and(
        eq(userConsents.userId, userId),
        eq(userConsents.document, CONSENT_DOCUMENT),
        eq(userConsents.version, CONSENT_VERSION),
      ),
    )
    .limit(1)
  return !!consent
}

export async function recordConsent(
  userId: string,
  meta: { ipAddress?: string | null; userAgent?: string | null },
): Promise<void> {
  await db
    .insert(userConsents)
    .values({
      userId,
      document: CONSENT_DOCUMENT,
      version: CONSENT_VERSION,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    })
    .onConflictDoNothing()
}
