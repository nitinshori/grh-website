import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { and, eq, isNull } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { paperConsultations } from '@/lib/db/schema'
import { ALL_PGDS } from '@/lib/pgd-access'
import { audit } from '@/lib/audit'
import { UUID_RE, attachmentsForPaper, hasRecordRole } from '@/lib/consultation-attachments'
import { isAppointmentsOnlyPharmacy } from '@/lib/access-pharmacies'
import { PAPER_CONSULTATION_NOTE, paperOutcomeLabel } from '@/lib/paper-consultations-shared'
import { AttachmentList } from '@/components/consultation-attachments/AttachmentList'
import { AttachmentUploader } from '@/components/consultation-attachments/AttachmentUploader'
import DeletePaperConsultationButton from './DeletePaperConsultationButton'

const pgdTitleMap = new Map(ALL_PGDS.map((p) => [p.slug, p.title]))

export const metadata = {
  title: 'Paper consultation record',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

function longDate(iso: string | null): string {
  if (!iso) return 'Not recorded'
  const d = new Date(`${iso}T00:00:00Z`)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default async function PaperConsultationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ failed?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!hasRecordRole(session.user.role)) redirect('/for-pharmacies/dashboard')
  if (!session.user.pharmacyId) redirect('/for-pharmacies/dashboard')
  if (await isAppointmentsOnlyPharmacy(session.user.pharmacyId)) {
    redirect('/for-pharmacies/dashboard/appointments')
  }

  const { id } = await params
  if (!UUID_RE.test(id)) notFound()
  const { failed } = await searchParams
  const failedCount = failed && /^\d{1,3}$/.test(failed) ? parseInt(failed, 10) : 0

  const [record] = await db
    .select()
    .from(paperConsultations)
    .where(
      and(
        eq(paperConsultations.id, id),
        eq(paperConsultations.pharmacyId, session.user.pharmacyId),
        isNull(paperConsultations.deletedAt),
      ),
    )
    .limit(1)
  if (!record) notFound()

  const attachments = await attachmentsForPaper(record.id)
  await audit({
    pharmacyId: session.user.pharmacyId,
    userId: session.user.id,
    userEmail: session.user.email || null,
    action: 'record_view',
    recordId: record.id,
    details: { kind: 'paper_consultation' },
    request: new Request('http://local', { headers: await headers() }),
  })

  const canDelete = session.user.role === 'pharmacy_admin' || session.user.role === 'super_admin'
  const outcomeGood = record.outcome === 'supplied' || record.outcome === 'administered'

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6 print:hidden">
        <Link
          href="/for-pharmacies/dashboard/records"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors"
        >
          &larr; Back to Patient Records
        </Link>
      </div>

      {failedCount > 0 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 print:hidden">
          {failedCount} file(s) could not be uploaded. Please try attaching them again.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Paper consultation</p>
            <h1 className="text-2xl font-bold text-gray-900">{record.patientName}</h1>
            <p className="text-gray-500 mt-1">
              {pgdTitleMap.get(record.pgdSlug) || record.pgdSlug}, {longDate(record.consultationDate)}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            outcomeGood ? 'bg-emerald-50 text-emerald-700' : record.outcome === 'referred' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {paperOutcomeLabel(record.outcome)}
          </span>
        </div>
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          {PAPER_CONSULTATION_NOTE}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Patient name" value={record.patientName} />
          <Field label="Date of birth" value={longDate(record.patientDob)} />
          <Field label="Outcome" value={paperOutcomeLabel(record.outcome)} />
          <Field label="Product" value={record.product || 'Not recorded'} />
          <Field label="Dose given" value={record.dose || 'Not recorded'} />
          <Field label="Batch number" value={record.batch || 'Not recorded'} />
          <Field label="Batch expiry" value={longDate(record.batchExpiry)} />
          <Field label="Pharmacist" value={record.pharmacistName} />
          <Field label="GPhC number" value={record.pharmacistGphc} />
          <Field
            label="Record saved"
            value={new Date(record.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          />
        </div>
        {record.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{record.notes}</p>
          </div>
        )}
      </div>

      <div id="attachments" className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Signed paper forms</h2>
        <AttachmentList attachments={attachments} role={session.user.role} />
        <div className="mt-4">
          <AttachmentUploader paperConsultationId={record.id} label="Attach another page or file" />
        </div>
      </div>

      {canDelete && (
        <div className="text-right print:hidden">
          <DeletePaperConsultationButton id={record.id} />
        </div>
      )}
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
