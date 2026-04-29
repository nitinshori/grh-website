import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hasPharmacyPgdAccess } from '@/lib/pgd-access'
import AccessDenied from './AccessDenied'

interface PgdGateProps {
  slug: string
  title?: string
  children: React.ReactNode
}

/**
 * Server component that checks if the current user's pharmacy
 * has access to a specific PGD. Renders children if allowed,
 * or shows an access-denied message.
 *
 * Super admins always have access.
 */
export default async function PgdGate({ slug, title, children }: PgdGateProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Super admins can access everything
  if (session.user.role === 'super_admin') {
    return <>{children}</>
  }

  // Check pharmacy PGD assignment
  if (!session.user.pharmacyId) {
    return <AccessDenied pgdTitle={title} />
  }

  const hasAccess = await hasPharmacyPgdAccess(session.user.pharmacyId, slug)

  if (!hasAccess) {
    return <AccessDenied pgdTitle={title} />
  }

  return <>{children}</>
}
