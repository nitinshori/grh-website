import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

async function getPharmaciesWithCounts(includeInactive: boolean) {
  const allPharmacies = await db
    .select()
    .from(pharmacies)
    .orderBy(pharmacies.name)
    .then((rows) =>
      includeInactive ? rows : rows.filter((p) => p.isActive)
    )

  // For each pharmacy, fetch count of users and PGDs
  const pharmaciesWithCounts = await Promise.all(
    allPharmacies.map(async (pharmacy) => {
      const [usersCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.pharmacyId, pharmacy.id))

      const [pgdsCount] = await db
        .select({ count: count() })
        .from(pharmacyPgds)
        .where(eq(pharmacyPgds.pharmacyId, pharmacy.id))

      return {
        ...pharmacy,
        userCount: usersCount?.count ?? 0,
        pgdCount: pgdsCount?.count ?? 0,
      }
    })
  )

  return pharmaciesWithCounts
}

export default async function PharmaciesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>
}) {
  const { show } = await searchParams
  const includeInactive = show === 'all'
  const pharmaciesData = await getPharmaciesWithCounts(includeInactive)

  // Count inactive pharmacies (for the toggle label) without changing the view.
  const [inactiveCount] = await db
    .select({ count: count() })
    .from(pharmacies)
    .where(eq(pharmacies.isActive, false))
  const hiddenCount = inactiveCount?.count ?? 0

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pharmacies</h1>
            <p className="text-gray-600">
              Manage all registered pharmacies and their settings
              {!includeInactive && hiddenCount > 0 && (
                <>
                  {' · '}
                  <a href="/admin/pharmacies?show=all" className="text-teal-600 hover:underline">
                    show {hiddenCount} inactive
                  </a>
                </>
              )}
              {includeInactive && (
                <>
                  {' · '}
                  <a href="/admin/pharmacies" className="text-teal-600 hover:underline">
                    hide inactive
                  </a>
                </>
              )}
            </p>
          </div>
          <a
            href="/admin/pharmacies/new"
            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors text-white"
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
            New Pharmacy
          </a>
        </div>

        {/* Pharmacies Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {pharmaciesData.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-500 font-medium">No pharmacies yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Create your first pharmacy to get started
              </p>
              <a
                href="/admin/pharmacies/new"
                className="inline-block mt-4 px-4 py-2 rounded-lg font-medium transition-colors text-white"
                style={{ backgroundColor: '#25b4b4' }}
              >
                Create Pharmacy
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      PGDs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pharmaciesData.map((pharmacy) => (
                    <tr key={pharmacy.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`/admin/pharmacies/${pharmacy.id}`}
                          className="font-medium text-gray-900 hover:underline"
                        >
                          {pharmacy.name}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {pharmacy.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {pharmacy.userCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {pharmacy.pgdCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pharmacy.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={`/admin/pharmacies/${pharmacy.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
