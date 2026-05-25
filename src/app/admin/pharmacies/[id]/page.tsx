import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds, pgdConsultations } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
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

  // Fetch per-PGD usage counts for this pharmacy.
  //   started      = total consultations begun for that PGD
  //   completed    = subset that hit "complete"
  //   lastUsed     = most recent start timestamp
  // Source: pgd_consultations table, grouped by pgd_slug.
  const usageRows = await db
    .select({
      pgdSlug: pgdConsultations.pgdSlug,
      started: sql<number>`COUNT(*)::int`,
      completed: sql<number>`SUM(CASE WHEN ${pgdConsultations.completedAt} IS NOT NULL THEN 1 ELSE 0 END)::int`,
      lastUsed: sql<Date>`MAX(${pgdConsultations.startedAt})`,
    })
    .from(pgdConsultations)
    .where(eq(pgdConsultations.pharmacyId, id))
    .groupBy(pgdConsultations.pgdSlug)

  // Convert to a slug→stats map. Dates → ISO strings so they cross the
  // server/client boundary cleanly (Next won't serialize Date objects).
  const pgdUsage: Record<
    string,
    { started: number; completed: number; lastUsed: string | null }
  > = {}
  for (const row of usageRows) {
    pgdUsage[row.pgdSlug] = {
      started: row.started ?? 0,
      completed: row.completed ?? 0,
      lastUsed: row.lastUsed
        ? new Date(row.lastUsed as unknown as string).toISOString()
        : null,
    }
  }

  // Return only the fields the client component declares — strips out
  // Date objects (createdAt, updatedAt) and any extra columns that don't
  // serialize cleanly when passed from server component to client.
  return {
    id: pharmacy.id,
    name: pharmacy.name,
    address: pharmacy.address,
    phone: pharmacy.phone,
    email: pharmacy.email,
    isActive: pharmacy.isActive,
    users: pharmacyUsers,
    pgdSlugs: assignedPgds.map((p) => p.pgdSlug),
    pgdUsage,
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
