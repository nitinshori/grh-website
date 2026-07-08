import { db } from '@/lib/db'
import { deviceTokens, users, pharmacies } from '@/lib/db/schema'
import { and, eq, inArray, or } from 'drizzle-orm'
import { google } from 'googleapis'
import { createSign } from 'crypto'
import * as http2 from 'http2'

// ─────────────────────────────────────────────────────────────────────────
// Mobile push notifications.
//
// The GRH app (Capacitor) registers device tokens via /api/push/register.
// iOS devices give us raw APNs tokens; Android devices give us FCM
// registration tokens. We send platform-natively:
//
//   • Android → FCM HTTP v1, authenticated with a Firebase service
//     account (FIREBASE_SERVICE_ACCOUNT_JSON — the JSON key file content,
//     either raw or base64-encoded).
//   • iOS     → APNs HTTP/2 directly with a p8 signing key
//     (APNS_TEAM_ID, APNS_KEY_ID, APNS_PRIVATE_KEY, optional APNS_ENV
//     'production' | 'sandbox'). No Firebase needed on the iOS path.
//
// Sending is strictly best-effort: every public function here swallows
// errors after logging a one-liner. A push failure must never break a
// booking. Tokens the providers report as dead are deleted so the table
// self-cleans.
// ─────────────────────────────────────────────────────────────────────────

const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID || 'uk.co.getrealhealthpgd.app'

export interface PushMessage {
  title: string
  body: string
  /** Relative URL the app opens when the notification is tapped. */
  url?: string
}

// ── FCM (Android) ────────────────────────────────────────────────

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    const json = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8')
    return JSON.parse(json) as ServiceAccount
  } catch {
    console.error('push: FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON/base64')
    return null
  }
}

async function getFcmAccessToken(sa: ServiceAccount): Promise<string | null> {
  try {
    const jwtClient = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    })
    const { access_token } = await jwtClient.authorize()
    return access_token ?? null
  } catch (e) {
    console.error('push: FCM auth failed', e instanceof Error ? e.message : e)
    return null
  }
}

/** Returns false only when the token is permanently dead (unregister it). */
async function sendFcm(
  sa: ServiceAccount,
  accessToken: string,
  token: string,
  msg: PushMessage,
): Promise<boolean> {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: msg.title, body: msg.body },
          data: msg.url ? { url: msg.url } : {},
          android: { priority: 'HIGH' },
        },
      }),
    },
  )
  if (res.ok) return true
  // 404 UNREGISTERED / 400 INVALID_ARGUMENT → token is dead
  if (res.status === 404 || res.status === 400) return false
  console.error(`push: FCM send failed (${res.status})`)
  return true // transient — keep the token
}

// ── APNs (iOS) ───────────────────────────────────────────────────

function getApnsConfig() {
  const teamId = process.env.APNS_TEAM_ID
  const keyId = process.env.APNS_KEY_ID
  let privateKey = process.env.APNS_PRIVATE_KEY
  if (!teamId || !keyId || !privateKey) return null
  // Support base64-encoded or \n-escaped keys (Vercel env var friendly)
  if (!privateKey.includes('BEGIN')) {
    privateKey = Buffer.from(privateKey, 'base64').toString('utf8')
  }
  privateKey = privateKey.replace(/\\n/g, '\n')
  const host =
    (process.env.APNS_ENV || 'production') === 'sandbox'
      ? 'https://api.sandbox.push.apple.com'
      : 'https://api.push.apple.com'
  return { teamId, keyId, privateKey, host }
}

function makeApnsJwt(cfg: NonNullable<ReturnType<typeof getApnsConfig>>): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'ES256', kid: cfg.keyId }),
  ).toString('base64url')
  const claims = Buffer.from(
    JSON.stringify({ iss: cfg.teamId, iat: Math.floor(Date.now() / 1000) }),
  ).toString('base64url')
  const signer = createSign('SHA256')
  signer.update(`${header}.${claims}`)
  const signature = signer.sign(
    { key: cfg.privateKey, dsaEncoding: 'ieee-p1363' },
    'base64url',
  )
  return `${header}.${claims}.${signature}`
}

/** Returns false only when the token is permanently dead. */
function sendApns(
  cfg: NonNullable<ReturnType<typeof getApnsConfig>>,
  jwt: string,
  token: string,
  msg: PushMessage,
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const client = http2.connect(cfg.host)
      client.on('error', () => resolve(true))
      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${token}`,
        authorization: `bearer ${jwt}`,
        'apns-topic': APNS_BUNDLE_ID,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      })
      let status = 0
      req.on('response', (headers) => {
        status = Number(headers[':status'] ?? 0)
      })
      req.setEncoding('utf8')
      let bodyText = ''
      req.on('data', (c: string) => (bodyText += c))
      req.on('end', () => {
        client.close()
        if (status === 200) return resolve(true)
        // 410 Gone / BadDeviceToken → dead token
        if (status === 410 || bodyText.includes('BadDeviceToken')) {
          return resolve(false)
        }
        console.error(`push: APNs send failed (${status}) ${bodyText.slice(0, 120)}`)
        resolve(true)
      })
      req.on('error', () => {
        client.close()
        resolve(true)
      })
      req.end(
        JSON.stringify({
          aps: {
            alert: { title: msg.title, body: msg.body },
            sound: 'default',
          },
          ...(msg.url ? { url: msg.url } : {}),
        }),
      )
    } catch {
      resolve(true)
    }
  })
}

// ── Core send ────────────────────────────────────────────────────

/**
 * Send a push to every registered device of the given users.
 * Best-effort: logs and continues on any failure; prunes dead tokens.
 */
export async function sendPushToUsers(
  userIds: string[],
  msg: PushMessage,
): Promise<void> {
  if (userIds.length === 0) return
  try {
    const tokens = await db
      .select()
      .from(deviceTokens)
      .where(inArray(deviceTokens.userId, userIds))
    if (tokens.length === 0) return

    const deadTokens: string[] = []

    // Android via FCM
    const androidTokens = tokens.filter((t) => t.platform === 'android')
    if (androidTokens.length > 0) {
      const sa = getServiceAccount()
      if (sa) {
        const accessToken = await getFcmAccessToken(sa)
        if (accessToken) {
          for (const t of androidTokens) {
            const alive = await sendFcm(sa, accessToken, t.token, msg)
            if (!alive) deadTokens.push(t.token)
          }
        }
      }
    }

    // iOS via APNs
    const iosTokens = tokens.filter((t) => t.platform === 'ios')
    if (iosTokens.length > 0) {
      const cfg = getApnsConfig()
      if (cfg) {
        const jwt = makeApnsJwt(cfg)
        for (const t of iosTokens) {
          const alive = await sendApns(cfg, jwt, t.token, msg)
          if (!alive) deadTokens.push(t.token)
        }
      }
    }

    if (deadTokens.length > 0) {
      await db.delete(deviceTokens).where(inArray(deviceTokens.token, deadTokens))
    }
  } catch (e) {
    console.error('push: sendPushToUsers failed', e instanceof Error ? e.message : e)
  }
}

// ── Booking notifications ────────────────────────────────────────

/**
 * Notify pharmacy staff about a booking event.
 *
 * Recipients: active pharmacists + admins AT the branch, plus
 * pharmacy_admins anywhere in the branch's group (so Jane at head
 * office hears about every branch, but a pharmacist in branch A isn't
 * pinged about branch B's bookings).
 *
 * Fire-and-forget by design — call without await, or await; either way
 * it never throws.
 */
export async function notifyBookingEvent(params: {
  pharmacyId: string
  title: string
  body: string
}): Promise<void> {
  try {
    const [pharmacy] = await db
      .select({ id: pharmacies.id, groupSlug: pharmacies.groupSlug })
      .from(pharmacies)
      .where(eq(pharmacies.id, params.pharmacyId))
      .limit(1)
    if (!pharmacy) return

    let groupPharmacyIds: string[] = [pharmacy.id]
    if (pharmacy.groupSlug) {
      const group = await db
        .select({ id: pharmacies.id })
        .from(pharmacies)
        .where(eq(pharmacies.groupSlug, pharmacy.groupSlug))
      groupPharmacyIds = group.map((p) => p.id)
    }

    const recipients = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          or(
            // everyone at the branch itself
            eq(users.pharmacyId, pharmacy.id),
            // pharmacy_admins across the whole group
            and(
              inArray(users.pharmacyId, groupPharmacyIds),
              eq(users.role, 'pharmacy_admin'),
            ),
          ),
        ),
      )

    await sendPushToUsers(
      recipients.map((r) => r.id),
      {
        title: params.title,
        body: params.body,
        url: '/for-pharmacies/dashboard/appointments',
      },
    )
  } catch (e) {
    console.error('push: notifyBookingEvent failed', e instanceof Error ? e.message : e)
  }
}
