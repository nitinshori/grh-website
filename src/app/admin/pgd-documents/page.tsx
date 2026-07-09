import { db } from '@/lib/db'
import { pharmacyPgdDocuments, pharmacies } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { ALL_PGDS } from '@/lib/pgd-access'
import {
  PGD_MASTER_FILES,
  PGD_HUBRX_FILES,
} from '@/lib/pgd-document-manifest'

export const metadata = { title: 'PGD Documents | GRH Admin' }
export const dynamic = 'force-dynamic'

// ── Admin PGD document library ──────────────────────────────────────────
// One place with every PGD document on the platform:
//   1. the GRH signed masters (served from /pgd-documents/)
//   2. the HubRx-branded signed copies
//   3. every pharmacy-uploaded signed override (Vercel Blob), e.g. the
//      documents Jane/Sarah upload for Pharmacy Plus Health
// Grouped by category, one row per PGD, direct download links.
// The admin layout already guards this route to super_admin.

export default async function AdminPgdDocumentsPage() {
  // All current pharmacy-uploaded overrides, newest first.
  const overrides = await db
    .select({
      id: pharmacyPgdDocuments.id,
      pgdSlug: pharmacyPgdDocuments.pgdSlug,
      documentUrl: pharmacyPgdDocuments.documentUrl,
      filename: pharmacyPgdDocuments.filename,
      version: pharmacyPgdDocuments.version,
      signedByNames: pharmacyPgdDocuments.signedByNames,
      isCurrent: pharmacyPgdDocuments.isCurrent,
      uploadedAt: pharmacyPgdDocuments.uploadedAt,
      pharmacyName: pharmacies.name,
    })
    .from(pharmacyPgdDocuments)
    .leftJoin(pharmacies, eq(pharmacyPgdDocuments.pharmacyId, pharmacies.id))
    .where(eq(pharmacyPgdDocuments.isCurrent, true))
    .orderBy(desc(pharmacyPgdDocuments.uploadedAt))

  const overridesBySlug = new Map<string, typeof overrides>()
  for (const o of overrides) {
    const list = overridesBySlug.get(o.pgdSlug) ?? []
    list.push(o)
    overridesBySlug.set(o.pgdSlug, list)
  }

  // Category → PGDs, preserving catalogue order.
  const categories = new Map<string, typeof ALL_PGDS>()
  for (const p of ALL_PGDS) {
    const list = categories.get(p.category) ?? []
    list.push(p)
    categories.set(p.category, list)
  }

  const totalMasters = Object.keys(PGD_MASTER_FILES).length

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PGD Documents</h1>
        <p className="text-sm text-gray-600 mt-1">
          Every signed PGD on the platform — {totalMasters} GRH masters,{' '}
          {Object.keys(PGD_HUBRX_FILES).length} HubRx-branded copies and{' '}
          {overrides.length} pharmacy-uploaded signed version
          {overrides.length === 1 ? '' : 's'}. Click to download.
        </p>
      </header>

      {[...categories.entries()].map(([category, pgds]) => (
        <section key={category} className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
            {category}
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {pgds.map((p) => {
              const master = PGD_MASTER_FILES[p.slug]
              const hubrx = PGD_HUBRX_FILES[p.slug]
              const ovs = overridesBySlug.get(p.slug) ?? []
              return (
                <div
                  key={p.slug}
                  className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {p.title}
                    </p>
                    <p className="text-xs text-gray-500">{p.subtitle}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {master ? (
                      <a
                        href={`/pgd-documents/${encodeURIComponent(master)}`}
                        download
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
                      >
                        GRH master ↓
                      </a>
                    ) : (
                      <span className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700">
                        No signed master
                      </span>
                    )}
                    {hubrx && (
                      <a
                        href={`/pgd-documents/${encodeURIComponent(hubrx)}`}
                        download
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        HubRx ↓
                      </a>
                    )}
                    {ovs.map((o) => (
                      <a
                        key={o.id}
                        href={o.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100"
                        title={`${o.filename ?? 'signed PDF'} · v${o.version}${o.signedByNames ? ` · signed: ${o.signedByNames}` : ''} · ${o.uploadedAt?.toISOString().slice(0, 10) ?? ''}`}
                      >
                        {o.pharmacyName ?? 'Pharmacy'} v{o.version} ↓
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
