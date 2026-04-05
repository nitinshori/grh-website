import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import Link from 'next/link'
import { redirect } from 'next/navigation'

type UserWithPharmacy = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  pharmacyId: string | null
  pharmacyName: string | null
  isActive: boolean
  createdAt: Date
}

async function getAllUsers(): Promise<UserWithPharmacy[]> {
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      pharmacyId: users.pharmacyId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      pharmacyName: pharmacies.name,
    })
    .from(users)
    .leftJoin(pharmacies, eq(users.pharmacyId, pharmacies.id))
    .orderBy(asc(users.lastName))

  return allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    pharmacyId: u.pharmacyId,
    pharmacyName: u.pharmacyName,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }))
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800'
    case 'pharmacy_admin':
      return 'bg-blue-100 text-blue-800'
    case 'pharmacist':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatRoleName(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default async function UsersPage() {
  // Check authentication
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/login')
  }

  const allUsers = await getAllUsers()

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
            <p className="text-gray-600">Manage admin users and pharmacist accounts</p>
          </div>
          <Link
            href="/admin/users/new"
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
            New User
          </Link>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {allUsers.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="mt-4 text-gray-600">No users found. Create your first user.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Pharmacy
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {user.firstName} {user.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {formatRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.pharmacyName || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </Link>
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
