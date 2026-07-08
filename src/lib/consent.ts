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

/** True when this user must see the consent screen before using the portal. */
export async function needsConsent(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ authSource: users.authSource })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  // Only SSO-provisioned users (authSource set to a partner tenant) are
  // gated — direct GRH users accepted terms at signup.
  if (!user?.authSource) return false

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
  return !consent
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
