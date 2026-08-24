import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import OnboardingQueueClient from './OnboardingQueueClient'
import { DonutChart } from '../components/Charts'

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

  // Aggregate for the visibility tiles
  let mActive = 0, mPending = 0, mFailed = 0, mNone = 0, mrrPence = 0
  const byStatus = new Map<string, number>()
  for (const r of rows) {
    byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1)
    const m = (r.gocardlessMandateStatus ?? '').toLowerCase()
    if (!m) mNone += 1
    else if (m === 'active') mActive += 1
    else if (['pending_submission', 'pending_customer_approval', 'submitted'].includes(m)) mPending += 1
    else if (['cancelled', 'failed', 'expired'].includes(m)) mFailed += 1
    else mNone += 1
    if (r.status === 'completed' && r.monthlyFeePence) mrrPence += r.monthlyFeePence
  }
  const mrr = '£' + (mrrPence / 100).toLocaleString('en-GB')

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Onboarding queue</h1>
        <p className="text-sm text-gray-500 mb-6">
          Pharmacies that have signed up via /onboard. Approve them to provision a pharmacy + send a set-password email.
        </p>

        {/* Visibility tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Total requests</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{rows.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Active DDs</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{mActive}</p>
            <p className="text-[10px] text-gray-500">Mandate set up</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Pending DDs</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{mPending}</p>
            <p className="text-[10px] text-gray-500">Waiting on customer</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wide">Monthly recurring</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">{mrr}</p>
            <p className="text-[10px] text-gray-500">From completed subs</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Mandate status overview</h2>
          <DonutChart
            segments={[
              { label: 'Active', value: mActive, color: '#10b981' },
              { label: 'Pending', value: mPending, color: '#f59e0b' },
              { label: 'Failed / cancelled', value: mFailed, color: '#ef4444' },
              { label: 'None yet', value: mNone, color: '#9ca3af' },
            ]}
            size={140}
            thickness={16}
          />
        </div>

        <OnboardingQueueClient
          rows={rows.map((r) => ({
            id: r.id,
            status: r.status,
            pharmacyName: r.pharmacyName,
            pharmacyAddress: r.pharmacyAddress || '',
            pharmacyGphc: r.pharmacyGphc || '',
            // Contact fields are nullable from migration 018 (drafts at step 1
            // don't have them yet). Coerce to empty strings for the client UI
            // which still expects strings.
            contactFirstName: r.contactFirstName ?? '',
            contactLastName: r.contactLastName ?? '',
            contactEmail: r.contactEmail ?? '',
            contactGphc: r.contactGphc || '',
            heardAbout: r.heardAbout || '',
            heardAboutDetail: r.heardAboutDetail || '',
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
