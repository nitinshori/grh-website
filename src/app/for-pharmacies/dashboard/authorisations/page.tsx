import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { pharmacies, users } from '@/lib/db/schema'
import { myAuthorisations, PRACTITIONER_DECLARATION } from '@/lib/authorisations'
import { AuthorisationsClient } from './AuthorisationsClient'

export const metadata = { title: 'PGD sign-off | Get Real Health' }
export const dynamic = 'force-dynamic'

/**
 * The practitioner's own PGD sign-off page: every PGD at the branch they
 * are working at, with its current version, signed / needs re-signing /
 * not signed, and a bulk sign with the declaration.
 */
export default async function AuthorisationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const role = session.user.role
  if (role !== 'pharmacist' && role !== 'pharmacy_admin') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">PGD sign-off</h1>
        <p className="text-sm text-gray-600">Only pharmacists and pharmacy admins sign PGD authorisations.</p>
      </div>
    )
  }
  if (!session.user.pharmacyId) {
    return <div className="p-6 md:p-8 max-w-4xl mx-auto"><p className="text-sm text-gray-600">No pharmacy assigned to your account.</p></div>
  }
  const [me] = await db.select({ firstName: users.firstName, lastName: users.lastName, gphc: users.gphcNumber, username: users.username }).from(users).where(eq(users.id, session.user.id)).limit(1)
  // PPH-style bulk imports keep the GPhC number in username.
  const gphcDefault = me?.gphc ?? (me?.username && /^\d{7}$/.test(me.username) ? me.username : '')
  const [ph] = await db.select({ name: pharmacies.name }).from(pharmacies).where(eq(pharmacies.id, session.user.pharmacyId)).limit(1)
  const rows = await myAuthorisations(session.user.id, session.user.pharmacyId)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">PGD sign-off</h1>
        <p className="text-sm text-gray-600">
          Each PGD is authorised by Get Real Health. Your signature here records that you have read the current version and agree to work under it; your pharmacy&apos;s authorising manager then countersigns. When a PGD is reissued it shows as needing re-signing. Signing is for your pharmacy&apos;s records and does not switch the tools on or off.
        </p>
      </div>
      <AuthorisationsClient
        rows={rows}
        defaultName={`${me?.firstName ?? ''} ${me?.lastName ?? ''}`.trim()}
        defaultGphc={gphcDefault}
        pharmacyName={ph?.name ?? 'your pharmacy'}
        declaration={PRACTITIONER_DECLARATION}
        canManage={role === 'pharmacy_admin'}
      />
    </div>
  )
}
