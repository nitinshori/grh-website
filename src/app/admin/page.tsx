import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'
import { getSystemStats } from '@/lib/analytics'
import { ALL_PGDS } from '@/lib/pgd-access'

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
  const stats = await getStats()

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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
