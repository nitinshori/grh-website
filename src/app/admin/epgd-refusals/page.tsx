import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { recentEpgdRefusals } from '@/lib/epgd-refusals'
import { ALL_PGDS, WITHDRAWN_SLUGS } from '@/lib/pgd-access'

export const dynamic = 'force-dynamic'

const REASONS: Record<string, string> = {
  withdrawn: 'Withdrawn PGD',
  'no-document': 'No ePGD at that address',
  'not-assigned': 'Not enabled for the pharmacy',
}

/**
 * Every ePGD link the site has refused, newest first. Built 28 Sep 2026 so a
 * partner's broken catalogue link can be read here rather than asked for.
 */
export default async function EpgdRefusalsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'super_admin') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p>Forbidden: admin only.</p>
      </div>
    )
  }
  const rows = await recentEpgdRefusals(200)
  const titles = new Map(ALL_PGDS.map((p) => [p.slug, p.title]))

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refused ePGD links</h1>
        <p className="text-gray-600 mb-6">
          Each row is a tool address someone was turned away from, with who, why, and where the link came from.
          A partner page linking to an address that is not a live ePGD shows up here as &quot;No ePGD at that address&quot;.
        </p>
        {rows.length === 0 ? (
          <p className="text-gray-500">Nothing refused yet.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Pharmacy</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Link address</th>
                  <th className="px-4 py-3">Why</th>
                  <th className="px-4 py-3">Came from</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {r.createdAt.toLocaleString('en-GB', { timeZone: 'Europe/London' })}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.pharmacyName ?? '(none)'}
                      {r.authSource && r.authSource !== 'direct' && (
                        <span className="ml-2 text-xs text-gray-500">{r.authSource}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.userEmail ?? ''}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">
                      /for-pharmacies/epgd/{r.segment}
                      {titles.has(r.segment) ? (
                        <span className="ml-2 font-sans text-gray-500">{titles.get(r.segment)}</span>
                      ) : WITHDRAWN_SLUGS.has(r.segment) ? (
                        <span className="ml-2 font-sans text-gray-500">withdrawn</span>
                      ) : (
                        <span className="ml-2 font-sans text-red-600">not a live ePGD</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{REASONS[r.reason] ?? r.reason}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 break-all max-w-md">{r.referer ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
