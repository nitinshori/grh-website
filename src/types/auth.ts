import 'next-auth'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      pharmacyId: string | null
      pharmacySlug: string | null
      image?: string | null
    } & DefaultSession['user']
  }

  interface User {
    role?: string
    pharmacyId?: string | null
    pharmacySlug?: string | null
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string
    pharmacyId?: string | null
    pharmacySlug?: string | null
  }
}
