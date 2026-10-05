import 'next-auth'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      /** The branch being worked at this session (home unless switched). */
      pharmacyId: string | null
      /** The branch the login belongs to (users.pharmacy_id). */
      homePharmacyId: string | null
      pharmacySlug: string | null
      mustChangePassword?: boolean
      image?: string | null
    } & DefaultSession['user']
  }

  interface User {
    role?: string
    pharmacyId?: string | null
    pharmacySlug?: string | null
    mustChangePassword?: boolean
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string
    pharmacyId?: string | null
    homePharmacyId?: string | null
    /** Epoch ms of the last "may still work here" check while away from home. */
    branchCheckedAt?: number
    pharmacySlug?: string | null
    mustChangePassword?: boolean
  }
}
