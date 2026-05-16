import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'
import { getSystemStats } from '@/lib/analytics'
import { ALL_PGDS } from '@/lib/pgd-access'
import { getPharmacySignupsByWeek, getConsultationsByDay, getOnboardingBreakdown } from './lib/admin-stats'
import { LineChart, HBarChart, DonutChart, Sparkline } from './components/Charts'

async function getStats() {
  const [pharmacyCount] = await db
    .select({ count: count() })
    .from(pharmacies)
    .where(eq(pharmacies.isActive, true))

  const [activeUsersCount] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.isActive, true))

  const [pgdAssignmentCount] = await db
    .select({ count: count() })
    .from(pharmacyPgds)

  // Fetch consultation analytics (last 30 days)
  let analytics = {
    totalConsultations: 0,
    completedConsultations: 0,
    topPgds: [] as { pgdSlug: string; total: number; completed: number }[],
    recent: [] as { id: string; pgdSlug: string; startedAt: Date; completedAt: Date | null; userId: string; pharmacyId: string }[],
  }
  try {
    analytics = await getSystemStats(30)
  } catch {
    // Analytics table might not exist yet
  }

  return {
    totalPharmacies: pharmacyCount?.count ?? 0,
    activeUsers: activeUsersCount?.count ?? 0,
    pgdsAvailable: 71,
    pgdAssignments: pgdAssignmentCount?.count ?? 0,
    analytics,
  }
}

// Map slug → friendly title
const pgdTitleMap = new Map(ALL_PGDS.map((p) => [p.slug, p.title]))

export default async function AdminDashboard() {
  const [stats, signupsByWeek, consultsByDay, onboarding] = await Promise.all([
    getStats(),
    getPharmacySignupsByWeek(12),
    getConsultationsByDay(30),
    getOnboardingBreakdown(),
  ])

  const signupSparkline = signupsByWeek.map((b) => b.count)
  const consultSparkline = consultsByDay.map((b) => b.total)
  const totalSignups12w = signupsByWeek.reduce((a, b) => a + b.count, 0)
  const mrr = '£' + (onboarding.monthlyRevenuePence / 100).toLocaleString('en-GB')

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome to the GRH Admin Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pharmacies Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pharmacies</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalPharmacies}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#25b4b4' }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Active pharmacies in system</p>
          </div>

          {/* Active Users Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeUsers}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#25b4b4' }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM15 20H9m6 0h6"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Currently active users</p>
          </div>

          {/* PGDs Available Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PGDs Available</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pgdsAvailable}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#25b4b4' }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Total PGD services in catalogue</p>
          </div>

          {/* PGD Assignments Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PGD Assignments</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pgdAssignments}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#25b4b4' }}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Active PGD assignments</p>
          </div>
        </div>

        {/* GoCardless / Onboarding strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <a href="/admin/onboarding" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Onboarding requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{onboarding.total}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">All time</p>
              </div>
              <span className="text-[10px] text-teal-600 font-semibold group-hover:translate-x-0.5 transition-transform">View →</span>
            </div>
          </a>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Active DD mandates</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{onboarding.mandateActive}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">GoCardless — paying</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Pending mandates</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{onboarding.mandatePending}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Awaiting customer</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Monthly recurring</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">{mrr}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">From completed subs</p>
          </div>
        </div>

        {/* Trend charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pharmacy signups</h2>
                <p className="text-xs text-gray-500">Last 12 weeks &middot; {totalSignups12w} new pharmacies</p>
              </div>
              <Sparkline values={signupSparkline} width={80} height={28} color="#25b4b4" />
            </div>
            <LineChart data={signupsByWeek.map((b) => ({ label: b.weekLabel, value: b.count }))} height={220} color="#25b4b4" />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Consultations</h2>
                <p className="text-xs text-gray-500">Last 30 days &middot; {stats.analytics.totalConsultations} started</p>
              </div>
              <Sparkline values={consultSparkline} width={80} height={28} color="#10b981" />
            </div>
            <LineChart data={consultsByDay.map((b) => ({ label: b.label, value: b.total }))} height={220} color="#10b981" />
          </div>
        </div>

        {/* Top PGDs + Mandate donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top PGDs (30 days)</h2>
            <HBarChart
              data={stats.analytics.topPgds.slice(0, 10).map((p) => ({
                label: pgdTitleMap.get(p.pgdSlug) ?? p.pgdSlug,
                value: p.total,
              }))}
              color="#25b4b4"
            />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Mandate breakdown</h2>
            <DonutChart
              segments={[
                { label: 'Active', value: onboarding.mandateActive, color: '#10b981' },
                { label: 'Pending', value: onboarding.mandatePending, color: '#f59e0b' },
                { label: 'Failed', value: onboarding.mandateFailed, color: '#ef4444' },
                { label: 'None', value: onboarding.noMandate, color: '#9ca3af' },
              ]}
              size={140}
              thickness={16}
            />
            <a href="/admin/onboarding" className="block mt-4 text-xs text-teal-600 hover:text-teal-700 font-semibold text-right">
              Manage onboarding →
            </a>
          </div>
        </div>

        {/* Consultation Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Consultations This Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Consultations (30 days)</h2>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{stats.analytics.totalConsultations}</p>
                <p className="text-sm text-gray-500">Total started</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">{stats.analytics.completedConsultations}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
            {stats.analytics.totalConsultations > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((stats.analytics.completedConsultations / stats.analytics.totalConsultations) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {Math.round((stats.analytics.completedConsultations / stats.analytics.totalConsultations) * 100)}% completion
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Most Used PGDs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Most Used PGDs</h2>
            {stats.analytics.topPgds.length === 0 ? (
              <p className="text-sm text-gray-400">No consultations recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.analytics.topPgds.slice(0, 5).map((pgd, i) => (
                  <div key={pgd.pgdSlug} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pgdTitleMap.get(pgd.pgdSlug) || pgd.pgdSlug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-900">{pgd.total}</span>
                      <span className="text-xs text-gray-400">uses</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity + Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
            {stats.analytics.recent.length === 0 ? (
              <p className="text-sm text-gray-400">No consultations recorded yet. Activity will appear here once pharmacists start using the ePGD tools.</p>
            ) : (
              <div className="space-y-3">
                {stats.analytics.recent.slice(0, 10).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        c.completedAt ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {pgdTitleMap.get(c.pgdSlug) || c.pgdSlug}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(c.startedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        c.completedAt
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.completedAt ? 'Completed' : 'Started'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <a
                href="/admin/pharmacies"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#25b4b4' }}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Pharmacy
              </a>

              <a
                href="/admin/users"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#25b4b4' }}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create User
              </a>

              <a
                href="/for-pharmacies/dashboard/training"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#7c3aed' }}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
                Review Training
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
