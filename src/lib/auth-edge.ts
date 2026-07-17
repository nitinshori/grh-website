import NextAuth, { type NextAuthConfig } from 'next-auth'

/**
 * Edge-runtime-safe NextAuth instance.
 *
 * The main `src/lib/auth.ts` config registers Credentials providers whose
 * authorize() callbacks pull in bcryptjs + drizzle + node:crypto. Those
 * modules are not bundlable for the Edge Runtime that Next.js Middleware
 * uses. Importing auth.ts from middleware blows up the build.
 *
 * This file defines an Edge-safe NextAuth instance with NO providers —
 * just JWT decoding, session reading, and callbacks. That's all the
 * middleware needs to populate `req.auth` from the session cookie.
 *
 * The full provider list still lives in auth.ts (Node runtime) and is
 * used by the [...nextauth] route handler + the /sso endpoint. The
 * session cookie is signed with the same NEXTAUTH_SECRET on both sides,
 * so cookies issued by auth.ts decode identically here.
 *
 * If you add a new claim to the session JWT in auth.ts, mirror it in the
 * callbacks below or middleware won't see it.
 */
export const authEdgeConfig = {
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any
        token.role = u.role as string
        token.pharmacyId = u.pharmacyId as string | null
        token.pharmacySlug = u.pharmacySlug as string | null
        token.mustChangePassword = !!u.mustChangePassword
        token.authSource = (u.authSource as string | undefined) ?? 'grh'
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
        ;(session.user as { authSource?: string }).authSource =
          (token.authSource as string | undefined) ?? 'grh'
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60,
    updateAge: 30 * 60,
  },
} satisfies NextAuthConfig

export const { auth } = NextAuth(authEdgeConfig)
