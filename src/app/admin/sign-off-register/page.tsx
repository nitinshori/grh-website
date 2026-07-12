import { db } from '@/lib/db'
import { clinicalSignoffs, pharmacies } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export const metadata = { title: 'Sign-off Register | GRH Admin' }
export const dynamic = 'force-dynamic'

// ── Admin signing register ──────────────────────────────────────────────
// The full audit trail: exactly who has signed off what, when. Every row in
// clinical_signoffs, newest first, with the pharmacy name for pharmacy-scoped
// sign-offs. Guarded to super_admin by the admin layout.

const TYPE_LABEL: Record<string, string> = {
  pgd_document: 'PGD document',
  epgd_tool: 'ePGD tool',
  training_module: 'Training',
}

export default async function SignOffRegisterPage() {
  const rows = await db
    .select({
      id: clinicalSignoffs.id,
      scope: clinicalSignoffs.scope,
      pharmacyName: pharmacies.name,
      itemType: clinicalSignoffs.itemType,
      itemTitle: clinicalSignoffs.itemTitle,
      itemSlug: clinicalSignoffs.itemSlug,
      itemVersion: clinicalSignoffs.itemVersion,
      signedByName: clinicalSignoffs.signedByName,
      signedByRole: clinicalSignoffs.signedByRole,
      signedAt: clinicalSignoffs.signedAt,
    })
    .from(clinicalSignoffs)
    .leftJoin(pharmacies, eq(clinicalSignoffs.pharmacyId, pharmacies.id))
    .orderBy(desc(clinicalSignoffs.signedAt))

  // Per-signer counts for the summary strip.
  const bySigner = new Map<string, number>()
  for (const r of rows) bySigner.set(r.signedByName, (bySigner.get(r.signedByName) ?? 0) + 1)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sign-off Register</h1>
        <p className="text-sm text-gray-600 mt-1">
          Full audit trail of every clinical sign-off — who signed what, and
          when. {rows.length} sign-off{rows.length === 1 ? '' : 's'} recorded.
        </p>
        {bySigner.size > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[...bySigner.entries()].map(([name, n]) => (
              <span
                key={name}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700"
              >
                {name}: {n}
              </span>
            ))}
          </div>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
          No sign-offs recorded yet. Sign-offs made in the clinical sign-off
          register will appear here.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Signed by</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Scope</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 whitespace-nowrap text-gray-600">
                    {r.signedAt.toISOString().slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-gray-900">{r.signedByName}</span>
                    {r.signedByRole && (
                      <span className="block text-xs text-gray-400">{r.signedByRole}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {TYPE_LABEL[r.itemType] ?? r.itemType}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-gray-900">{r.itemTitle ?? r.itemSlug}</span>
                    {r.itemVersion && (
                      <span className="block text-xs text-gray-400">{r.itemVersion}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.scope === 'grh' ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                        GRH platform
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-violet-50 text-violet-700">
                        {r.pharmacyName ?? 'Pharmacy'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
