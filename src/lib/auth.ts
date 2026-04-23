import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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

        const email = credentials.email as string
        const password = credentials.password as string

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1)

        if (!user || !user.isActive) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

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
  },
})
