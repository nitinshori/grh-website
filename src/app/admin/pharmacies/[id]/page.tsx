import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { PharmacyDetailClient } from './PharmacyDetailClient'

async function getPharmacyData(id: string) {
  // Fetch pharmacy
  const [pharmacy] = await db
    .select()
    .from(pharmacies)
    .where(eq(pharmacies.id, id))
    .limit(1)

  if (!pharmacy) {
    return null
  }

  // Fetch pharmacy users
  const pharmacyUsers = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.pharmacyId, id))

  // Fetch assigned PGDs
  const assignedPgds = await db
    .select({ pgdSlug: pharmacyPgds.pgdSlug })
    .from(pharmacyPgds)
    .where(eq(pharmacyPgds.pharmacyId, id))

  return {
    ...pharmacy,
    users: pharmacyUsers,
    pgdSlugs: assignedPgds.map((p) => p.pgdSlug),
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pharmacy = await getPharmacyData(id)

  if (!pharmacy) {
    return {
      title: 'Pharmacy Not Found | Admin',
    }
  }

  return {
    title: `${pharmacy.name} | Admin - Get Real Health`,
    description: `Manage ${pharmacy.name} pharmacy settings and PGD access`,
  }
}

export default async function PharmacyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pharmacy = await getPharmacyData(id)

  if (!pharmacy) {
    notFound()
  }

  return <PharmacyDetailClient pharmacy={pharmacy} />
}
