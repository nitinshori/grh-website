import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { eq, or, sql } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'

// NOTE: resolveSsoUser is loaded LAZILY inside the hubrx-sso authorize()
// callback. It transitively imports `jose`, `node:crypto`, and DB clients
// which are NOT compatible with the Edge Middleware runtime. Since auth.ts
// is imported by src/middleware.ts (Edge), keeping these as a top-level
// import would crash the build. Lazy-loading means they only resolve in
// the Node runtime (the /sso route handler), which is the only place
// authorize('hubrx-sso') is ever actually triggered.

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        // The form input is labelled "Email or GPHC number" in the UI but
        // we keep the credential key as `email` to stay backward-compatible
        // with NextAuth callers that hard-coded it.
        email: { label: 'Email or GPHC number', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // `identifier` is what the user typed. It might be an email
        // (Jane, Moin, anyone signed up directly) or a GPHC number
        // (PPH pharmacists onboarded in bulk via the import script).
        const identifier = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        // Anti-brute-force: 5 attempts per 15 min per identifier.
        const limited = rateLimit(`login:${identifier}`, 5, 15 * 60_000)
        if (!limited.ok) {
          await audit({
            action: 'login_failed',
            userEmail: identifier,
            details: { reason: 'rate_limited' },
          })
          return null
        }

        // Match by email OR username (case-insensitive on both).
        // Username is set only for partner-bulk-imported pharmacists;
        // for direct users it's null and the OR still works.
        const [user] = await db
          .select()
          .from(users)
          .where(
            or(
              eq(users.email, identifier),
              sql`LOWER(${users.username}) = ${identifier}`,
            ),
          )
          .limit(1)

        if (!user || !user.isActive) {
          await audit({
            action: 'login_failed',
            userEmail: email,
            details: { reason: user ? 'inactive' : 'no_user' },
          })
          return null
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
          await audit({
            action: 'login_failed',
            userId: user.id,
            userEmail: email,
            pharmacyId: user.pharmacyId,
            details: { reason: 'bad_password' },
          })
          return null
        }

        // For client users, fetch the pharmacy slug for redirect
        let pharmacySlug: string | null = null
        if (user.role === 'client' && user.pharmacyId) {
          const [pharmacy] = await db
            .select({ slug: pharmacies.slug })
            .from(pharmacies)
            .where(eq(pharmacies.id, user.pharmacyId))
            .limit(1)
          pharmacySlug = pharmacy?.slug || null
        }

        await audit({
          action: 'login',
          userId: user.id,
          userEmail: user.email,
          pharmacyId: user.pharmacyId,
          details: identifier === user.email ? undefined : { via: 'username' },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          pharmacyId: user.pharmacyId,
          pharmacySlug,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
    // ── HubRx SSO ────────────────────────────────────────────────
    // Trusts a JWT signed by HubRx Insights with the HUBRX_SSO_SECRET
    // shared key. Used by /sso/route.ts only — pharmacists never see
    // this provider on the login screen. resolveSsoUser does the
    // signature check, claim validation, and find-or-just-in-time-
    // create. If anything is wrong it returns null and NextAuth rejects.
    Credentials({
      id: 'hubrx-sso',
      name: 'HubRx SSO',
      credentials: {
        token: { label: 'SSO token', type: 'text' },
      },
      async authorize(credentials) {
        const token = credentials?.token as string | undefined
        if (!token) return null
        try {
          // Lazy-loaded — see top-of-file note for why.
          const { resolveSsoUser } = await import(
            '@/lib/sso/resolve-sso-user'
          )
          const resolved = await resolveSsoUser({ tenantSlug: 'hubrx', token })
          if (!resolved) return null
          await audit({
            action: 'login',
            userId: resolved.id,
            userEmail: resolved.email,
            pharmacyId: resolved.pharmacyId,
            details: { via: 'hubrx_sso' },
          })
          return {
            id: resolved.id,
            email: resolved.email,
            name: resolved.name,
            role: resolved.role,
            pharmacyId: resolved.pharmacyId,
            pharmacySlug: resolved.pharmacySlug,
          }
        } catch (err) {
          await audit({
            action: 'login_failed',
            details: {
              via: 'hubrx_sso',
              reason: err instanceof Error ? err.message : 'unknown',
            },
          })
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any
        token.role = u.role as string
        token.pharmacyId = u.pharmacyId as string | null
        token.pharmacySlug = u.pharmacySlug as string | null
        token.mustChangePassword = !!u.mustChangePassword
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.pharmacyId = token.pharmacyId as string | null
        session.user.pharmacySlug = token.pharmacySlug as string | null
        session.user.mustChangePassword = !!token.mustChangePassword
      }
      return session
    },
    // Custom redirect callback. By default NextAuth treats redirects to
    // any host other than NEXTAUTH_URL as cross-origin and rewrites them
    // to baseUrl — which on Vercel is the canonical getrealhealthpgd.co.uk.
    // That's the wrong behaviour for our multi-tenant setup: a user who
    // SSOs in at hubrx.getrealhealthpgd.co.uk must STAY on the hubrx
    // subdomain (their session cookie is scoped there). This callback
    // explicitly allows any subdomain of getrealhealthpgd.co.uk so the
    // /sso endpoint can hand us an absolute URL pointing back at hubrx.*
    // and we'll honour it.
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl)
        const base = new URL(baseUrl)
        // Same origin — always safe.
        if (target.origin === base.origin) return target.toString()
        // Any subdomain of the canonical brand domain.
        const apex = 'getrealhealthpgd.co.uk'
        if (
          target.hostname === apex ||
          target.hostname.endsWith('.' + apex)
        ) {
          return target.toString()
        }
        // Anything else: don't follow.
        return baseUrl
      } catch {
        return baseUrl
      }
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // Hard expiry: 12 hours regardless of activity. After this the user must
    // log in again. Keeps unattended laptops from staying signed in overnight.
    maxAge: 12 * 60 * 60,
    // Sliding window: any request from the user refreshes the cookie, so an
    // active user is never logged out mid-session, but 30 minutes of idle
    // results in a forced re-login.
    updateAge: 30 * 60,
  },
})
