import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationDrafts } from '@/lib/db/schema'
import { eq, and, gt, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DraftsClient } from './DraftsClient'
import { pgds } from '@/data/pgds'

export const metadata = { title: 'Drafts & Phone Bookings | Get Real Health' }
export const dynamic = 'force-dynamic'

export default async function DraftsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.pharmacyId) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm text-gray-600">No pharmacy access.</p>
      </div>
    )
  }

  const rows = await db
    .select({
      id: consultationDrafts.id,
      pgdSlug: consultationDrafts.pgdSlug,
      bookingType: consultationDrafts.bookingType,
      patientFirstName: consultationDrafts.patientFirstName,
      patientLastName: consultationDrafts.patientLastName,
      patientDob: consultationDrafts.patientDob,
      patientPhone: consultationDrafts.patientPhone,
      expectedVisitDate: consultationDrafts.expectedVisitDate,
      note: consultationDrafts.note,
      createdAt: consultationDrafts.createdAt,
      updatedAt: consultationDrafts.updatedAt,
      expiresAt: consultationDrafts.expiresAt,
    })
    .from(consultationDrafts)
    .where(
      and(
        eq(consultationDrafts.pharmacyId, session.user.pharmacyId),
        gt(consultationDrafts.expiresAt, new Date())
      )
    )
    .orderBy(desc(consultationDrafts.updatedAt))

  const pgdOptions = pgds
    .filter((p) => !p.comingSoon)
    .map((p) => ({ id: p.id, title: p.title }))
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-4 print:hidden">
          <Link
            href="/for-pharmacies/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-teal-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Drafts &amp; phone bookings</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-2xl">
          Phone bookings captured from the front of shop and in-progress
          consultations waiting for the pharmacist. Records are deleted
          automatically 30 days after they are created.
        </p>

        <DraftsClient
          initialDrafts={rows.map(r => ({
            id: r.id,
            pgdSlug: r.pgdSlug,
            bookingType: (r.bookingType as 'in_progress' | 'phone_booking') ?? 'in_progress',
            patientFirstName: r.patientFirstName,
            patientLastName: r.patientLastName,
            patientDob: r.patientDob,
            patientPhone: r.patientPhone,
            expectedVisitDate: r.expectedVisitDate,
            note: r.note,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
            expiresAt: r.expiresAt.toISOString(),
          }))}
          pgdOptions={pgdOptions}
        />
      </div>
    </div>
  )
}
