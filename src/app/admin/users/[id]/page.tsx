import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserDetailClient from './UserDetailClient'

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

type Pharmacy = {
  id: string
  name: string
  isActive: boolean
}

async function getUser(id: string): Promise<UserWithPharmacy | null> {
  const user = await db
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
    .where(eq(users.id, id))
    .limit(1)

  if (user.length === 0) return null

  return {
    id: user[0].id,
    email: user[0].email,
    firstName: user[0].firstName,
    lastName: user[0].lastName,
    role: user[0].role,
    pharmacyId: user[0].pharmacyId,
    pharmacyName: user[0].pharmacyName,
    isActive: user[0].isActive,
    createdAt: user[0].createdAt,
  }
}

async function getAllPharmacies(): Promise<Pharmacy[]> {
  const allPharmacies = await db.select().from(pharmacies)
  return allPharmacies.map((p) => ({
    id: p.id,
    name: p.name,
    isActive: p.isActive,
  }))
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Check authentication
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    redirect('/login')
  }

  const { id } = await params

  const user = await getUser(id)
  if (!user) {
    redirect('/admin/users')
  }

  const allPharmacies = await getAllPharmacies()

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 inline-flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-gray-600">{user.email}</p>
        </div>

        {/* Content */}
        <UserDetailClient user={user} pharmacies={allPharmacies} />
      </div>
    </div>
  )
}
