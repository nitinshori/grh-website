import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { managedBranches } from '@/lib/branch-access'
import { MANAGER_DECLARATION, teamAuthorisations } from '@/lib/authorisations'
import { TeamClient } from './TeamClient'

export const metadata = { title: 'Team PGD sign-off | Get Real Health' }
export const dynamic = 'force-dynamic'

/**
 * Manager view: every practitioner across the group, their status per PGD,
 * countersign in one go, and the register PDF per branch. super_admin
 * reaches it with ?pharmacyId=.
 */
export default async function TeamAuthorisationsPage({ searchParams }: { searchParams: Promise<{ pharmacyId?: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const sp = await searchParams
  const role = session.user.role
  const anchor = role === 'super_admin' ? (sp.pharmacyId ?? null) : role === 'pharmacy_admin' ? session.user.pharmacyId : null
  if (!anchor) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Team PGD sign-off</h1>
        <p className="text-sm text-gray-600">{role === 'super_admin' ? 'Add ?pharmacyId=<id> to view a pharmacy.' : 'Only pharmacy admins can countersign and download the register.'}</p>
      </div>
    )
  }
  const branches = await managedBranches(anchor)
  const members = await teamAuthorisations(branches.map((b) => b.id))

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Team PGD sign-off</h1>
        <p className="text-sm text-gray-600">
          Each practitioner signs their own PGD authorisations from their login. Here you countersign on behalf of the pharmacy, see who still has PGDs to sign or re-sign after a reissue, and download the register for each branch. Manager declaration: &quot;{MANAGER_DECLARATION}&quot;
        </p>
      </div>
      <TeamClient
        members={members}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        anchorPharmacyId={anchor}
        isSuperAdmin={role === 'super_admin'}
        selfUserId={session.user.id}
      />
    </div>
  )
}
