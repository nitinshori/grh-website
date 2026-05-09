import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies, consultationRecords } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getPharmacyPgdSlugs, ALL_PGDS, PGD_CATEGORIES, COMING_SOON_SLUGS } from '@/lib/pgd-access'
import { getPharmacyStats } from '@/lib/analytics'
import { hasPgdDocument } from '@/lib/pgd-documents'

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
  let pharmacyGroupSlug = ''

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
      pharmacyGroupSlug = pharmacy.groupSlug || ''
    }
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

  // Fetch recent patient records
  let recentRecords: {
    id: string
    pgdSlug: string
    patientFirstName: string
    patientLastName: string
    patientDob: string
    outcome: string
    medicineSupplied: string | null
    pharmacistName: string
    consultationDate: Date
  }[] = []
  if (session.user.pharmacyId) {
    try {
      recentRecords = await db
        .select({
          id: consultationRecords.id,
          pgdSlug: consultationRecords.pgdSlug,
          patientFirstName: consultationRecords.patientFirstName,
          patientLastName: consultationRecords.patientLastName,
          patientDob: consultationRecords.patientDob,
          outcome: consultationRecords.outcome,
          medicineSupplied: consultationRecords.medicineSupplied,
          pharmacistName: consultationRecords.pharmacistName,
          consultationDate: consultationRecords.consultationDate,
        })
        .from(consultationRecords)
        .where(eq(consultationRecords.pharmacyId, session.user.pharmacyId))
        .orderBy(desc(consultationRecords.consultationDate))
        .limit(10)
    } catch {
      // Table may not exist yet
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
          href="/for-pharmacies/dashboard/appointments"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors bg-navy-900 hover:bg-navy-800"
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Appointment Diary
        </Link>
        <Link
          href="/for-pharmacies/dashboard/records"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Patient Records
        </Link>
        <Link
          href="/for-pharmacies/dashboard/drafts"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4v16l7-3.5L19 20V4a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
          </svg>
          Drafts
        </Link>
        {pharmacyGroupSlug && (
          <a
            href={`/book/${pharmacyGroupSlug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-teal-900 bg-teal-50 border border-teal-300 hover:bg-teal-100 transition-colors"
            title="The page patients use to book appointments online. Share this URL on your website / social media."
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M21 3l-9 9m0 0H9m3 0V9" />
            </svg>
            Patient Booking Page
          </a>
        )}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {consultationStats.recent.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Records */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Patient Records
          </h2>
          <Link
            href="/for-pharmacies/dashboard/records"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            View all &rarr;
          </Link>
        </div>
        {recentRecords.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No consultation records yet. Records are automatically saved when you complete an ePGD consultation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">PGD</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRecords.map((r) => (
                  <tr key={r.id} className="group">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/for-pharmacies/dashboard/records/${r.id}`}
                        className="text-gray-900 font-medium group-hover:text-teal-600 transition-colors"
                      >
                        {r.patientFirstName} {r.patientLastName}
                      </Link>
                      <p className="text-xs text-gray-400">DOB: {r.patientDob}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {pgdTitleMap.get(r.pgdSlug) || r.pgdSlug}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {r.medicineSupplied || '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {new Date(r.consultationDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.outcome === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : r.outcome === 'referred'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {r.outcome === 'completed' ? 'Supplied' : r.outcome === 'referred' ? 'Referred' : 'Not supplied'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                      className={`group bg-white rounded-lg border p-4 transition-all ${
                        COMING_SOON_SLUGS.has(pgd.slug)
                          ? 'border-gray-200 opacity-70 hover:opacity-100 hover:border-amber-300'
                          : 'border-gray-200 hover:border-[#25b4b4] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#25b4b4] transition-colors">
                            {pgd.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {pgd.subtitle}
                          </p>
                          {COMING_SOON_SLUGS.has(pgd.slug) && (
                            <span className="inline-block mt-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              Coming Soon
                            </span>
                          )}
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

      {/* PGD Documents Library */}
      {assignedPgds.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-50">
              <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">PGD Documents</h2>
              <p className="text-xs text-gray-500">Download written PGDs for printing or offline reference</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {PGD_CATEGORIES.filter((cat) => pgdsByCategory[cat]).map((category) => (
                <div key={`doc-${category}`} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: categoryColors[category] || '#6B7280' }}
                    />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {pgdsByCategory[category].map((pgd) => {
                      const hasDoc = hasPgdDocument(pgd.slug)
                      return (
                        <div
                          key={`doc-${pgd.slug}`}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-800 font-medium truncate">{pgd.title}</p>
                            <p className="text-[11px] text-gray-400 truncate">{pgd.subtitle}</p>
                          </div>
                          {hasDoc ? (
                            <a
                              href={`/pgd-documents/${pgd.slug}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 text-teal-700 rounded-md text-xs font-medium hover:bg-teal-100 transition-colors flex-shrink-0"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              PDF
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400 flex-shrink-0">Coming soon</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            These are the official written PGD documents for your assigned services. Print or save for offline use.
          </p>
        </div>
      )}
    </div>
  )
}
