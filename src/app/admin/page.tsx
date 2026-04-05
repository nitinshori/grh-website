import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'

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

  return {
    totalPharmacies: pharmacyCount?.count ?? 0,
    activeUsers: activeUsersCount?.count ?? 0,
    pgdsAvailable: 71,
    pgdAssignments: pgdAssignmentCount?.count ?? 0,
  }
}

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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-col sm:flex-row gap-3">
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
  )
}
