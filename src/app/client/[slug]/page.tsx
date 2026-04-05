import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies, pharmacyPgds, pgdConsultations } from '@/lib/db/schema'
import { eq, count, and, gte } from 'drizzle-orm'

import { ALL_PGDS } from '@/lib/pgd-access'

export default async function ClientDashboard({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()

  if (!session?.user || session.user.role !== 'client') {
    redirect('/login')
  }

  // Fetch pharmacy/client data
  const pharmacyId = session.user.pharmacyId
  if (!pharmacyId) {
    return (
      <div className="p-8">
        <p className="text-gray-500">No pharmacy linked to your account.</p>
      </div>
    )
  }

  const [pharmacy] = await db
    .select()
    .from(pharmacies)
    .where(eq(pharmacies.id, pharmacyId))
    .limit(1)

  if (!pharmacy || pharmacy.slug !== slug) {
    redirect('/login')
  }

  // Fetch assigned ePGDs
  const assignedPgds = await db
    .select()
    .from(pharmacyPgds)
    .where(eq(pharmacyPgds.pharmacyId, pharmacyId))

  const assignedSlugs = assignedPgds.map((p) => p.pgdSlug)
  const matchedPgds = ALL_PGDS.filter((pgd) => assignedSlugs.includes(pgd.slug))

  // Group by category
  const categories = [...new Set(matchedPgds.map((p) => p.category))]

  // Consultation stats (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [consultationStats] = await db
    .select({ total: count() })
    .from(pgdConsultations)
    .where(
      and(
        eq(pgdConsultations.pharmacyId, pharmacyId),
        gte(pgdConsultations.startedAt, thirtyDaysAgo)
      )
    )

  const totalConsultations = consultationStats?.total || 0

  const firstName = session.user.name?.split(' ')[0] || 'there'

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-gray-500">
          {pharmacy.name} &mdash; Client Portal
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Assigned ePGDs"
          value={assignedPgds.length}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Clinical Categories"
          value={categories.length}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
        <StatCard
          label="Consultations (30d)"
          value={totalConsultations}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <StatCard
          label="Account Status"
          value={pharmacy.isActive ? 'Active' : 'Inactive'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          valueColor={pharmacy.isActive ? 'text-green-600' : 'text-red-600'}
        />
      </div>

      {/* Organisation Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organisation Details</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name</span>
            <p className="font-medium text-gray-900">{pharmacy.name}</p>
          </div>
          {pharmacy.email && (
            <div>
              <span className="text-gray-500">Email</span>
              <p className="font-medium text-gray-900">{pharmacy.email}</p>
            </div>
          )}
          {pharmacy.phone && (
            <div>
              <span className="text-gray-500">Phone</span>
              <p className="font-medium text-gray-900">{pharmacy.phone}</p>
            </div>
          )}
          {pharmacy.address && (
            <div>
              <span className="text-gray-500">Address</span>
              <p className="font-medium text-gray-900">{pharmacy.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Assigned ePGDs by Category */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Assigned ePGDs
        </h2>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No ePGDs have been assigned yet. Please contact Get Real Health to get started.
          </p>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  {cat}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matchedPgds
                    .filter((p) => p.category === cat)
                    .map((pgd) => (
                      <div
                        key={pgd.slug}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: '#25b4b4' }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pgd.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{pgd.slug}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Support Card */}
      <div className="bg-gradient-to-r from-[#0c2340] to-[#163a5c] rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Need Help?</h2>
        <p className="text-sm text-gray-300 mb-4">
          If you need assistance with your ePGD tools, have questions about your subscription, or
          would like to add more services, our team is here to help.
        </p>
        <a
          href="mailto:info@getrealhealthpgd.co.uk"
          className="inline-flex items-center px-4 py-2 bg-[#25b4b4] hover:bg-[#1e9e9e] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Contact Get Real Health
        </a>
      </div>
    </div>
  )
}

// ── Stat Card Component ─────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  valueColor = 'text-gray-900',
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  valueColor?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-gray-400">{icon}</div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}
