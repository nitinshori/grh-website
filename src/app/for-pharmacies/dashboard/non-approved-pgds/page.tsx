import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPharmacyNonApprovedSlugs } from '@/lib/pgd-queries'
import { ALL_PGDS } from '@/lib/pgd-access'

export const metadata = { title: 'Non approved PGDs | Get Real Health' }
export const dynamic = 'force-dynamic'

/**
 * PGDs assigned to the pharmacy but not (yet) approved by its clinical
 * lead. Built for PPH, where Jane signs off a subset of the catalogue:
 * everything else is parked here — visible so the team knows it exists
 * and can request approval, but with no working tool or document links.
 */
export default async function NonApprovedPgdsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.pharmacyId) redirect('/for-pharmacies/dashboard')

  const slugs = await getPharmacyNonApprovedSlugs(session.user.pharmacyId)
  const bySlug = new Map(ALL_PGDS.map((p) => [p.slug, p]))
  const items = slugs
    .map((s) => bySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Non approved PGDs
        </h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          These PGDs are available on the Get Real Health platform but have
          not been approved for use at your pharmacy by your clinical lead.
          They cannot be used for consultations. Speak to your clinical lead
          or Get Real Health if you&apos;d like any of them switched on.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Nothing here — every PGD assigned to your pharmacy is approved.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {items.map((pgd) => (
            <div key={pgd.slug} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800">{pgd.title}</p>
                <p className="text-xs text-gray-400 truncate">{pgd.subtitle}</p>
              </div>
              <span className="flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                Not approved
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm">
        <Link
          href="/for-pharmacies/dashboard"
          className="text-[color:var(--tenant-primary)] font-medium hover:underline"
        >
          ← Back to dashboard
        </Link>
      </p>
    </div>
  )
}
