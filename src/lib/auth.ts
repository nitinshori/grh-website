import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'
import { audit } from '@/lib/audit'

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        // Anti-brute-force: 5 attempts per 15 min per email. Token bucket
        // is in-memory per Vercel instance — enough for casual abuse;
        // stronger protection requires Redis/Upstash.
        const limited = rateLimit(`login:${email}`, 5, 15 * 60_000)
        if (!limited.ok) {
          await audit({
            action: 'login_failed',
            userEmail: email,
            details: { reason: 'rate_limited' },
          })
          return null
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
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
          userEmail: email,
          pharmacyId: user.pharmacyId,
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          pharmacyId: user.pharmacyId,
          pharmacySlug,
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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.pharmacyId = token.pharmacyId as string | null
        session.user.pharmacySlug = token.pharmacySlug as string | null
      }
      return session
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
