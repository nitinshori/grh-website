/**
 * SSO token validation + JIT user/pharmacy provisioning.
 *
 * Validates a HubRx-signed JWT (or other partner token), then looks up
 * the corresponding GRH user. If the user doesn't exist yet, creates
 * them and the matching pharmacy on the fly. Used by the
 * `hubrx-sso` Credentials provider in src/lib/auth.ts.
 *
 * Token contract (HS256, signed with HUBRX_SSO_SECRET):
 *
 *   {
 *     "sub": "hubrx-user-1234",              // upstream user id (required)
 *     "email": "jane@somepharmacy.co.uk",    // required, must be unique on GRH side
 *     "name": "Jane Bloggs",                 // required, "First Last" or single string
 *     "pharmacy_id": "hubrx-pharm-987",      // upstream pharmacy id (required)
 *     "pharmacy_name": "Bloggs Pharmacy",    // required at first sign-in
 *     "role": "pharmacist" | "pharmacy_admin", // optional, defaults to pharmacist
 *     "iat": 1717948200,
 *     "exp": 1717948500                      // required, 5-minute lifetime recommended
 *   }
 *
 * Anything else in the claims is ignored.
 */

// Use the subpath import — Turbopack 16 / Next 16 can't resolve `jwtVerify`
// off the package root for jose v6 because of how the exports map is set
// up. The subpath form is explicitly documented in the jose README.
import { jwtVerify } from 'jose/jwt/verify'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { getTenantBySlug, type TenantSlug } from '@/lib/tenants'

export interface ResolveSsoArgs {
  tenantSlug: TenantSlug
  token: string
}

export interface ResolvedSsoUser {
  id: string
  email: string
  name: string
  role: string
  pharmacyId: string | null
  pharmacySlug: string | null
}

export async function resolveSsoUser(
  args: ResolveSsoArgs,
): Promise<ResolvedSsoUser | null> {
  const tenant = getTenantBySlug(args.tenantSlug)
  if (!tenant.sso.enabled) {
    throw new Error(`SSO not enabled for tenant ${tenant.slug}`)
  }
  const secret = process.env[tenant.sso.secretEnvVar]
  if (!secret || secret.length < 32) {
    throw new Error(
      `Missing or short ${tenant.sso.secretEnvVar} — must be ≥32 chars`,
    )
  }

  // 1. Verify the JWT signature + standard time claims
  let claims: Record<string, unknown>
  try {
    const verified = await jwtVerify(
      args.token,
      new TextEncoder().encode(secret),
      {
        algorithms: ['HS256'],
        // We don't enforce iss/aud at this stage — Sam can add them later.
        clockTolerance: 5, // 5s grace for clock skew
      },
    )
    claims = verified.payload as Record<string, unknown>
  } catch (err) {
    throw new Error(
      `Token verification failed: ${err instanceof Error ? err.message : 'unknown'}`,
    )
  }

  // 2. Pull the claim fields we care about
  const sub = pickString(claims, 'sub')
  const email = pickString(claims, 'email')?.toLowerCase().trim()
  const name = pickString(claims, 'name')
  const pharmacyExternalId = pickString(claims, 'pharmacy_id')
  const pharmacyName = pickString(claims, 'pharmacy_name')
  const claimedRole = pickString(claims, 'role')

  if (!sub) throw new Error('Token missing required claim: sub')
  if (!email) throw new Error('Token missing required claim: email')
  if (!name) throw new Error('Token missing required claim: name')
  if (!pharmacyExternalId)
    throw new Error('Token missing required claim: pharmacy_id')

  // GRH only recognises a small set of internal roles. Anything else
  // from HubRx maps down to 'pharmacist'.
  const role: 'pharmacist' | 'pharmacy_admin' =
    claimedRole === 'pharmacy_admin' ? 'pharmacy_admin' : 'pharmacist'

  // 3. Find-or-create the pharmacy
  let [pharmacy] = await db
    .select()
    .from(pharmacies)
    .where(
      and(
        eq(pharmacies.authSource, tenant.slug),
        eq(pharmacies.externalId, pharmacyExternalId),
      ),
    )
    .limit(1)

  if (!pharmacy) {
    if (!pharmacyName) {
      throw new Error(
        'Token missing pharmacy_name — required when provisioning a new pharmacy',
      )
    }
    const [created] = await db
      .insert(pharmacies)
      .values({
        name: pharmacyName,
        authSource: tenant.slug,
        externalId: pharmacyExternalId,
        isActive: true,
      })
      .returning()
    pharmacy = created
  }

  // 4. Find-or-create the user
  let [user] = await db
    .select()
    .from(users)
    .where(
      and(eq(users.authSource, tenant.slug), eq(users.externalId, sub)),
    )
    .limit(1)

  if (!user) {
    // Also check by email — a HubRx-onboarded pharmacist might already
    // exist in GRH from a previous direct relationship. If so we attach
    // them to the HubRx tenant rather than creating a duplicate row.
    const [existingByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingByEmail) {
      // The user already exists on GRH from a prior direct relationship
      // (e.g. Jane Wilkins at PPH). Don't re-tag them as HubRx-sourced
      // — their primary auth_source stays as it was. They can still
      // successfully SSO because we'll find them by email on the next
      // token too. If they need bidirectional linking (rare), we'll
      // add a user_tenant_links join table in a future iteration.
      //
      // We DO assign them to the HubRx pharmacy if they had no pharmacy
      // before, but never overwrite an existing assignment.
      if (!existingByEmail.pharmacyId) {
        const [updated] = await db
          .update(users)
          .set({
            pharmacyId: pharmacy.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByEmail.id))
          .returning()
        user = updated
      } else {
        user = existingByEmail
      }
    } else {
      // Brand-new user. Set passwordHash to a random unguessable value
      // so the email/password path is effectively disabled until they
      // explicitly use the /set-password flow to set a real one.
      const { firstName, lastName } = splitName(name)
      const randomPwHash = await bcrypt.hash(
        crypto.randomBytes(32).toString('hex'),
        12,
      )
      const [created] = await db
        .insert(users)
        .values({
          email,
          firstName,
          lastName,
          role,
          pharmacyId: pharmacy.id,
          passwordHash: randomPwHash,
          authSource: tenant.slug,
          externalId: sub,
          isActive: true,
        })
        .returning()
      user = created
    }
  }

  if (!user.isActive) {
    throw new Error('User is deactivated on GRH side')
  }

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    pharmacyId: user.pharmacyId,
    pharmacySlug: pharmacy.slug ?? null,
  }
}

// ── helpers ──────────────────────────────────────────────────────

function pickString(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = obj[key]
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}
