import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ALL_PGDS } from '@/lib/pgd-access'

const pgdTitleMap = new Map(ALL_PGDS.map((p) => [p.slug, p.title]))

export const metadata = {
  title: 'Consultation Record',
  description: 'View a completed consultation record',
}

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!session.user.pharmacyId) redirect('/for-pharmacies/dashboard')

  const { id } = await params

  const [record] = await db
    .select()
    .from(consultationRecords)
    .where(
      and(
        eq(consultationRecords.id, id),
        eq(consultationRecords.pharmacyId, session.user.pharmacyId)
      )
    )
    .limit(1)

  if (!record) notFound()

  // Parse clinical data
  let clinicalData: Record<string, unknown> = {}
  try {
    clinicalData = JSON.parse(record.clinicalData)
  } catch {
    // invalid JSON
  }

  const pgdTitle = pgdTitleMap.get(record.pgdSlug) || record.pgdSlug

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-6 print:hidden">
        <Link
          href="/for-pharmacies/dashboard/records"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Patient Records
        </Link>
      </div>

      {/* Record Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {record.patientFirstName} {record.patientLastName}
            </h1>
            <p className="text-gray-500 mt-1">
              {pgdTitle} &mdash;{' '}
              {new Date(record.consultationDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              record.outcome === 'completed'
                ? 'bg-emerald-50 text-emerald-700'
                : record.outcome === 'referred'
                ? 'bg-blue-50 text-blue-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {record.outcome === 'completed' ? 'Medicine Supplied' : record.outcome === 'referred' ? 'Referred' : 'Not Supplied'}
            </span>
            <button
              onClick={() => {}}
              className="hidden"
              id="print-btn"
            />
          </div>
        </div>
      </div>

      {/* Patient Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={`${record.patientFirstName} ${record.patientLastName}`} />
          <Field label="Date of Birth" value={record.patientDob} />
          <Field label="NHS Number" value={record.patientNhsNumber || 'Not provided'} />
          <Field label="Phone" value={record.patientPhone || 'Not provided'} />
          <Field label="Email" value={record.patientEmail || 'Not provided'} />
          <Field label="Address" value={record.patientAddress || 'Not provided'} />
          <Field label="GP Name" value={record.patientGpName || 'Not provided'} />
          <Field label="GP Practice" value={record.patientGpPractice || 'Not provided'} />
        </div>
      </div>

      {/* Medicine Details */}
      {record.medicineSupplied && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Medicine Supplied</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Medicine" value={record.medicineSupplied} />
            <Field label="Dose" value={record.medicineDose || '—'} />
            <Field label="Duration" value={record.medicineDuration || '—'} />
            <Field label="Quantity" value={record.medicineQuantity || '—'} />
          </div>
        </div>
      )}

      {/* Pharmacist Sign-Off */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pharmacist Sign-Off</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Pharmacist" value={record.pharmacistName} />
          <Field label="GPhC Number" value={record.pharmacistGphc} />
          <Field label="Consultation Date" value={
            new Date(record.consultationDate).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            })
          } />
          <Field label="Record Saved" value={
            new Date(record.createdAt).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })
          } />
        </div>
      </div>

      {/* Clinical Data (expandable) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Clinical Record</h2>
        <p className="text-xs text-gray-400 mb-4">
          Complete consultation data as recorded during the ePGD assessment.
        </p>
        <ClinicalDataDisplay data={clinicalData} />
      </div>

      {/* Print button */}
      <div className="text-center print:hidden">
        <PrintButton />
      </div>
      <PrintScript />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}

function ClinicalDataDisplay({ data }: { data: Record<string, unknown> }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-sm text-gray-500">No clinical data available.</p>
  }

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([section, sectionData]) => {
        if (sectionData === null || sectionData === undefined) return null

        // Format section name
        const sectionName = section
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (s) => s.toUpperCase())
          .trim()

        if (typeof sectionData === 'object' && !Array.isArray(sectionData)) {
          return (
            <div key={section} className="border-b border-gray-100 pb-4 last:border-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">{sectionName}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(sectionData as Record<string, unknown>).map(([key, value]) => {
                  const fieldName = key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (s) => s.toUpperCase())
                    .trim()
                  const displayValue = typeof value === 'boolean'
                    ? (value ? 'Yes' : 'No')
                    : typeof value === 'object'
                    ? JSON.stringify(value)
                    : String(value || '—')

                  return (
                    <div key={key} className="text-sm">
                      <span className="text-gray-500">{fieldName}:</span>{' '}
                      <span className="text-gray-900">{displayValue}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <div key={section} className="text-sm">
            <span className="text-gray-500">{sectionName}:</span>{' '}
            <span className="text-gray-900">{String(sectionData)}</span>
          </div>
        )
      })}
    </div>
  )
}

function PrintButton() {
  // Using a script-based approach for server component compatibility
  return (
    <button
      type="button"
      data-print="true"
      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-navy-900 hover:bg-navy-950 text-white transition-colors print:hidden"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print Record
    </button>
  )
}

// Client-side print handler
function PrintScript() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      document.addEventListener('click', function(e) {
        if (e.target.closest('[data-print]')) window.print();
      });
    `}} />
  )
}
