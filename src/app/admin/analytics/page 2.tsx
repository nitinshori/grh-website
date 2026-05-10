import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords, pharmacies, users } from '@/lib/db/schema'
import { sql, eq, isNull, and, gte, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Usage analytics — Admin' }
export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ pharmacy?: string; days?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'super_admin') {
    return <div className="p-8"><p>Forbidden — admin only.</p></div>
  }

  const params = await searchParams
  const days = Math.min(365, Math.max(1, parseInt(params.days || '30', 10) || 30))
  const since = new Date(Date.now() - days * DAY_MS)
  const focusPharmacy = params.pharmacy || null

  // Top-level: per-pharmacy totals over the window
  const perPharmacy = await db
    .select({
      pharmacyId: consultationRecords.pharmacyId,
      pharmacyName: pharmacies.name,
      total: sql<number>`count(*)::int`,
      distinctIps: sql<number>`count(distinct ${consultationRecords.ipAddress})::int`,
      distinctSubnets: sql<number>`count(distinct split_part(${consultationRecords.ipAddress}, '.', 1) || '.' || split_part(${consultationRecords.ipAddress}, '.', 2) || '.' || split_part(${consultationRecords.ipAddress}, '.', 3))::int`,
      distinctPharmacists: sql<number>`count(distinct ${consultationRecords.userId})::int`,
    })
    .from(consultationRecords)
    .leftJoin(pharmacies, eq(consultationRecords.pharmacyId, pharmacies.id))
    .where(and(
      isNull(consultationRecords.deletedAt),
      gte(consultationRecords.createdAt, since),
    ))
    .groupBy(consultationRecords.pharmacyId, pharmacies.name)
    .orderBy(desc(sql`count(*)`))

  // If a pharmacy is selected, compute drill-down: by-PGD, by-pharmacist, by-day
  let drill: null | {
    pharmacyName: string
    byPgd: { pgd: string; n: number }[]
    byPharmacist: { name: string; gphc: string; n: number }[]
    byDay: { day: string; n: number }[]
    distinctSubnets: { subnet: string; n: number }[]
  } = null

  if (focusPharmacy) {
    const [byPgd, byPharm, byDay, subnets, info] = await Promise.all([
      db.select({
        pgd: consultationRecords.pgdSlug,
        n: sql<number>`count(*)::int`,
      })
        .from(consultationRecords)
        .where(and(
          eq(consultationRecords.pharmacyId, focusPharmacy),
          isNull(consultationRecords.deletedAt),
          gte(consultationRecords.createdAt, since),
        ))
        .groupBy(consultationRecords.pgdSlug)
        .orderBy(desc(sql`count(*)`))
        .limit(30),
      db.select({
        userId: consultationRecords.userId,
        gphc: consultationRecords.pharmacistGphc,
        firstName: users.firstName,
        lastName: users.lastName,
        n: sql<number>`count(*)::int`,
      })
        .from(consultationRecords)
        .leftJoin(users, eq(consultationRecords.userId, users.id))
        .where(and(
          eq(consultationRecords.pharmacyId, focusPharmacy),
          isNull(consultationRecords.deletedAt),
          gte(consultationRecords.createdAt, since),
        ))
        .groupBy(consultationRecords.userId, consultationRecords.pharmacistGphc, users.firstName, users.lastName)
        .orderBy(desc(sql`count(*)`)),
      db.select({
        day: sql<string>`to_char(${consultationRecords.createdAt}, 'YYYY-MM-DD')`,
        n: sql<number>`count(*)::int`,
      })
        .from(consultationRecords)
        .where(and(
          eq(consultationRecords.pharmacyId, focusPharmacy),
          isNull(consultationRecords.deletedAt),
          gte(consultationRecords.createdAt, since),
        ))
        .groupBy(sql`to_char(${consultationRecords.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${consultationRecords.createdAt}, 'YYYY-MM-DD') desc`)
        .limit(30),
      db.select({
        subnet: sql<string>`split_part(${consultationRecords.ipAddress}, '.', 1) || '.' || split_part(${consultationRecords.ipAddress}, '.', 2) || '.' || split_part(${consultationRecords.ipAddress}, '.', 3)`,
        n: sql<number>`count(*)::int`,
      })
        .from(consultationRecords)
        .where(and(
          eq(consultationRecords.pharmacyId, focusPharmacy),
          isNull(consultationRecords.deletedAt),
          gte(consultationRecords.createdAt, since),
          sql`${consultationRecords.ipAddress} IS NOT NULL`,
        ))
        .groupBy(sql`split_part(${consultationRecords.ipAddress}, '.', 1) || '.' || split_part(${consultationRecords.ipAddress}, '.', 2) || '.' || split_part(${consultationRecords.ipAddress}, '.', 3)`)
        .orderBy(desc(sql`count(*)`))
        .limit(20),
      db.select({ name: pharmacies.name }).from(pharmacies).where(eq(pharmacies.id, focusPharmacy)).limit(1),
    ])
    drill = {
      pharmacyName: info[0]?.name || '(unknown pharmacy)',
      byPgd: byPgd.map((r) => ({ pgd: r.pgd, n: r.n })),
      byPharmacist: byPharm.map((r) => ({
        name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || '(deleted user)',
        gphc: r.gphc || '',
        n: r.n,
      })),
      byDay: byDay.map((r) => ({ day: r.day, n: r.n })),
      distinctSubnets: subnets.map((r) => ({ subnet: r.subnet, n: r.n })),
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Usage analytics</h1>
        <p className="text-sm text-gray-500 mb-4">
          Last {days} days. Each row is one location. Subnets &gt; 1 may indicate a pharmacy operating from multiple physical sites under one license.
        </p>
        <div className="flex gap-2 mb-6">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/admin/analytics?days=${d}${focusPharmacy ? `&pharmacy=${focusPharmacy}` : ''}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${days === d ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {d} days
            </Link>
          ))}
          {focusPharmacy && (
            <Link href={`/admin/analytics?days=${days}`} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
              ← All pharmacies
            </Link>
          )}
        </div>

        {!focusPharmacy && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Pharmacy</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-700">Consultations</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-700">Pharmacists</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-700">Distinct subnets</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-gray-700">Fair-use</th>
                </tr>
              </thead>
              <tbody>
                {perPharmacy.map((r) => {
                  const flag = (r.distinctSubnets || 0) > 2
                  return (
                    <tr key={r.pharmacyId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/analytics?pharmacy=${r.pharmacyId}&days=${days}`} className="text-teal-700 hover:underline font-medium">
                          {r.pharmacyName || '(unknown)'}
                        </Link>
                      </td>
                      <td className="text-right px-4 py-2.5 font-mono">{r.total}</td>
                      <td className="text-right px-4 py-2.5 font-mono">{r.distinctPharmacists}</td>
                      <td className="text-right px-4 py-2.5 font-mono">{r.distinctSubnets}</td>
                      <td className="text-right px-4 py-2.5">
                        {flag ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">Review</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">OK</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {perPharmacy.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-500">No consultations in this window.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {drill && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">{drill.pharmacyName}</h2>

            <DrillTable title="By PGD" rows={drill.byPgd.map((r) => ({ key: r.pgd, n: r.n, label: r.pgd }))} />
            <DrillTable title="By pharmacist" rows={drill.byPharmacist.map((r) => ({ key: r.gphc || r.name, n: r.n, label: `${r.name}${r.gphc ? ` · GPhC ${r.gphc}` : ''}` }))} />
            <DrillTable title="By day (last 30 with activity)" rows={drill.byDay.map((r) => ({ key: r.day, n: r.n, label: r.day }))} />
            <div>
              <DrillTable title="Distinct /24 subnets (fair-use)" rows={drill.distinctSubnets.map((r) => ({ key: r.subnet, n: r.n, label: `${r.subnet}.x` }))} />
              {drill.distinctSubnets.length > 2 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                  ⚠️ Consultations originated from {drill.distinctSubnets.length} distinct /24 subnets. May indicate the pharmacy is being used at more than one location — investigate before invoicing.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DrillTable({ title, rows }: { title: string; rows: { key: string; n: number; label: string }[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">{title}</div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-gray-100 last:border-0">
              <td className="px-4 py-2">{r.label}</td>
              <td className="text-right px-4 py-2 font-mono w-24">{r.n}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="px-4 py-4 text-center text-sm text-gray-500">No data.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
