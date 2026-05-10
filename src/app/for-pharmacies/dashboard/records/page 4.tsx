import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { ALL_PGDS } from '@/lib/pgd-access'
import PatientRecordsClient from './PatientRecordsClient'

const pgdTitleMap = new Map(ALL_PGDS.map((p) => [p.slug, p.title]))

export const metadata = {
  title: 'Patient Records',
  description: 'View and search consultation records for your pharmacy',
}

export default async function PatientRecordsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role === 'super_admin') redirect('/admin')

  // Convert to a plain object for the client component
  const pgdTitles = Object.fromEntries(pgdTitleMap)

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href="/for-pharmacies/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
        <p className="text-gray-500 mt-1">
          Search and view completed consultation records for your pharmacy.
        </p>
      </div>

      <PatientRecordsClient pgdTitles={pgdTitles} />
    </div>
  )
}
