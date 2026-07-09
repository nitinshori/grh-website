import { db } from '@/lib/db'
import { pharmacies, pharmacyPgds } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { ALL_PGDS } from '@/lib/pgd-access'
import { MatrixClient } from './MatrixClient'

export const metadata = { title: 'PGD Matrix | GRH Admin' }
export const dynamic = 'force-dynamic'

// ── Master PGD assignment matrix ────────────────────────────────────────
// One grid: every PGD (rows) × every pharmacy (columns). Ticking a box
// allows that PGD for that pharmacy — which grants all three of: the
// signed document download, the ePGD tool, and the linked training.
// Saves through the existing PUT /api/admin/pharmacies/[id]/pgds.

export default async function PgdMatrixPage() {
  const allPharmacies = await db
    .select({ id: pharmacies.id, name: pharmacies.name })
    .from(pharmacies)
    .orderBy(asc(pharmacies.name))

  const assignments = await db
    .select({
      pharmacyId: pharmacyPgds.pharmacyId,
      pgdSlug: pharmacyPgds.pgdSlug,
    })
    .from(pharmacyPgds)

  const assignedByPharmacy: Record<string, string[]> = {}
  for (const a of assignments) {
    ;(assignedByPharmacy[a.pharmacyId] ??= []).push(a.pgdSlug)
  }

  return (
    <MatrixClient
      pharmacies={allPharmacies}
      pgds={ALL_PGDS}
      initialAssigned={assignedByPharmacy}
    />
  )
}
