import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getPharmacyPgdSlugs, ALL_PGDS, PGD_CATEGORIES } from '@/lib/pgd-access'
import { getPharmacyStats } from '@/lib/analytics'
import { listVisibleAnnouncements } from '@/lib/announcements'

// Map slug → friendly title
const pgdTitleMap = new Map(ALL_PGDS.map((p) => [p.slug, p.title]))

// Category colour dots for visual grouping
const categoryColors: Record<string, string> = {
  "Men's Health": '#3B82F6',
  "Women's Health": '#EC4899',
  'Sexual Health': '#8B5CF6',
  'Weight Management': '#F59E0B',
  Skin: '#F97316',
  'Acute & Infection': '#EF4444',
  Respiratory: '#06B6D4',
  Cardiovascular: '#DC2626',
  'Mental Health & Wellbeing': '#10B981',
  Vaccines: '#6366F1',
  'Travel Health': '#14B8A6',
  'Occupational Health': '#64748B',
  Paediatrics: '#A855F7',
}

export default async function PharmacyDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role === 'super_admin') {
    redirect('/admin')
  }

  // Fetch pharmacy details
  let pharmacyName = 'Your Pharmacy'
  let pharmacyAddress = ''
  let pharmacyEmail = ''
  let pharmacyPhone = ''
  let pharmacyGroupId: string | null = null

  if (session.user.pharmacyId) {
    const [pharmacy] = await db
      .select()
      .from(pharmacies)
      .where(eq(pharmacies.id, session.user.pharmacyId))
      .limit(1)
    if (pharmacy) {
      pharmacyName = pharmacy.name
      pharmacyAddress = pharmacy.address || ''
      pharmacyEmail = pharmacy.email || ''
      pharmacyPhone = pharmacy.phone || ''
      pharmacyGroupId = pharmacy.groupId
    }
  }

  // Fetch visible announcements (global + group + pharmacy scoped)
  let announcementItems: Array<{
    id: string
    kind: string
    title: string
    body: string
    ctaLabel: string | null
    ctaUrl: string | null
    isPinned: boolean
    publishedAt: Date | null
  }> = []
  try {
    const rows = await listVisibleAnnouncements({
      groupId: pharmacyGroupId,
      pharmacyId: session.user.pharmacyId ?? null,
      limit: 5,
    })
    announcementItems = rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      title: r.title,
      body: r.body,
      ctaLabel: r.ctaLabel,
      ctaUrl: r.ctaUrl,
      isPinned: r.isPinned,
      publishedAt: r.publishedAt,
    }))
  } catch {
    // Announcements table may not exist in older DBs
  }

  // Fetch assigned PGDs
  const assignedSlugs = session.user.pharmacyId
    ? await getPharmacyPgdSlugs(session.user.pharmacyId)
    : []
  const slugSet = new Set(assignedSlugs)

  // Filter and group PGDs by category
  const assignedPgds = ALL_PGDS.filter((pgd) => slugSet.has(pgd.slug))
  const pgdsByCategory: Record<string, typeof assignedPgds> = {}
  for (const pgd of assignedPgds) {
    if (!pgdsByCategory[pgd.category]) {
      pgdsByCategory[pgd.category] = []
    }
    pgdsByCategory[pgd.category].push(pgd)
  }

  // Count distinct categories
  const categoryCount = Object.keys(pgdsByCategory).length
  const firstName = (session.user.name || 'there').split(' ')[0]

  // Fetch consultation analytics
  let consultationStats = {
    totalConsultations: 0,
    completedConsultations: 0,
    byPgd: [] as { pgdSlug: string; total: number; completed: number }[],
    recent: [] as { id: string; pgdSlug: string; startedAt: Date; completedAt: Date | null; userId: string; pharmacyId: string }[],
  }
  if (session.user.pharmacyId) {
    try {
      consultationStats = await getPharmacyStats(session.user.pharmacyId, 30)
    } catch {
      // Analytics table may not exist yet
    }
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your pharmacy and assigned ePGD tools.
        </p>
      </div>

      {/* Pharmacy Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#25b4b4' }}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{pharmacyName}</h2>
            {pharmacyAddress && (
              <p className="text-sm text-gray-500 mt-0.5">{pharmacyAddress}</p>
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
              {pharmacyEmail && (
                <span className="text-sm text-gray-500">{pharmacyEmail}</span>
              )}
              {pharmacyPhone && (
                <span className="text-sm text-gray-500">{pharmacyPhone}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      {announcementItems.length > 0 && (
        <div className="mb-8 space-y-3">
          {announcementItems.map((a) => {
            const kindStyle =
              a.kind === 'regulatory'
                ? 'border-red-200 bg-red-50'
                : a.kind === 'new_pgd'
                  ? 'border-emerald-200 bg-emerald-50'
                  : a.kind === 'platform_update'
                    ? 'border-blue-200 bg-blue-50'
                    : a.isPinned
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-gray-200 bg-white'
            const kindLabel = a.kind.replace('_', ' ')
            return (
              <div
                key={a.id}
                className={`rounded-xl border shadow-sm p-5 ${kindStyle}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    {a.isPinned && (
                      <svg
                        className="w-4 h-4 text-amber-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 2a1 1 0 011 1v5.586l3.293 3.293a1 1 0 01-1.414 1.414L10 10.414l-2.879 2.879a1 1 0 01-1.414-1.414L9 8.586V3a1 1 0 011-1z" />
                      </svg>
                    )}
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {kindLabel}
                    </span>
                  </div>
                  {a.publishedAt && (
                    <span className="text-xs text-gray-500">
                      {new Date(a.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {a.body}
                </p>
                {a.ctaLabel && a.ctaUrl && (
                  <a
                    href={a.ctaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-3 text-sm font-semibold text-teal-700 hover:text-teal-800"
                  >
                    {a.ctaLabel}
                    <svg
                      className="ml-1 w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-50">
              <svg
                className="w-5 h-5"
                style={{ color: '#25b4b4' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{assignedPgds.length}</p>
              <p className="text-sm text-gray-500">ePGDs Assigned</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-50">
              <svg
                className="w-5 h-5"
                style={{ color: '#25b4b4' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{categoryCount}</p>
              <p className="text-sm text-gray-500">Clinical Categories</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{consultationStats.totalConsultations}</p>
              <p className="text-sm text-gray-500">Consultations (30d)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{consultationStats.completedConsultations}</p>
              <p className="text-sm text-gray-500">Completed (30d)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/for-pharmacies/epgd"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: '#25b4b4' }}
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Open ePGD Tools
        </Link>
        <Link
          href="/for-pharmacies/pgd-catalogue"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          View Full PGD Catalogue
        </Link>
      </div>

      {/* Recent Activity */}
      {consultationStats.recent.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <Link
              href="/for-pharmacies/dashboard/consultations"
              className="text-sm font-medium text-teal-700 hover:text-teal-800"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-1">
            {consultationStats.recent.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                href={`/for-pharmacies/dashboard/consultations/${c.id}`}
                className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    c.completedAt ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {pgdTitleMap.get(c.pgdSlug) || c.pgdSlug}
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(c.startedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                    c.completedAt
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {c.completedAt ? 'Completed' : 'Started'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* PGDs by Category */}
      {assignedPgds.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No ePGDs assigned yet
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No ePGDs have been assigned to your pharmacy yet. Please contact your
            administrator to get started.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your ePGD Tools
          </h2>
          <div className="space-y-6">
            {PGD_CATEGORIES.filter((cat) => pgdsByCategory[cat]).map((category) => (
              <div key={category}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: categoryColors[category] || '#6B7280',
                    }}
                  />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {category}
                  </h3>
                  <span className="text-xs text-gray-400">
                    ({pgdsByCategory[category].length})
                  </span>
                </div>

                {/* PGD Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pgdsByCategory[category].map((pgd) => (
                    <Link
                      key={pgd.slug}
                      href={`/for-pharmacies/epgd/${pgd.slug}`}
                      className="group bg-white rounded-lg border border-gray-200 p-4 hover:border-[#25b4b4] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#25b4b4] transition-colors">
                            {pgd.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {pgd.subtitle}
                          </p>
                        </div>
                        <svg
                          className="w-4 h-4 text-gray-400 group-hover:text-[#25b4b4] flex-shrink-0 ml-2 mt-0.5 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
