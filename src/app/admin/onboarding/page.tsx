import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import OnboardingQueueClient from './OnboardingQueueClient'

export const metadata = { title: 'Onboarding queue — Admin' }
export const dynamic = 'force-dynamic'

export default async function OnboardingQueuePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'super_admin') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p>Forbidden — admin only.</p>
      </div>
    )
  }

  const rows = await db
    .select()
    .from(onboardingRequests)
    .orderBy(desc(onboardingRequests.createdAt))
    .limit(200)

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Onboarding queue</h1>
        <p className="text-sm text-gray-500 mb-6">
          Pharmacies that have signed up via /onboard. Approve them to provision a pharmacy + send a set-password email.
        </p>
        <OnboardingQueueClient
          rows={rows.map((r) => ({
            id: r.id,
            status: r.status,
            pharmacyName: r.pharmacyName,
            pharmacyAddress: r.pharmacyAddress || '',
            pharmacyGphc: r.pharmacyGphc || '',
            contactFirstName: r.contactFirstName,
            contactLastName: r.contactLastName,
            contactEmail: r.contactEmail,
            contactGphc: r.contactGphc || '',
            mandateId: r.gocardlessMandateId || '',
            mandateStatus: r.gocardlessMandateStatus || '',
            createdAt: r.createdAt.toISOString(),
            rejectedReason: r.rejectedReason || '',
          }))}
        />
      </div>
    </div>
  )
}
