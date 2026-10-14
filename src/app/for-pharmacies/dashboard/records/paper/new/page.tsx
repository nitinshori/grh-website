import { redirect } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { isAppointmentsOnlyPharmacy } from '@/lib/access-pharmacies'
import { getPharmacyPgdSlugs } from '@/lib/pgd-queries'
import { ALL_PGDS, EPGD_SEGMENT_ALIASES } from '@/lib/pgd-access'
import { PAPER_CONSULTATION_NOTE } from '@/lib/paper-consultations-shared'
import PaperConsultationForm from './PaperConsultationForm'

export const metadata = {
  title: 'Record a paper consultation',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function NewPaperConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ pgd?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role === 'super_admin') redirect('/admin')
  if (session.user.role === 'prospect') redirect('/for-pharmacies/dashboard')
  if (!session.user.pharmacyId) redirect('/for-pharmacies/dashboard')
  if (await isAppointmentsOnlyPharmacy(session.user.pharmacyId)) {
    redirect('/for-pharmacies/dashboard/appointments')
  }

  const held = new Set(await getPharmacyPgdSlugs(session.user.pharmacyId))
  const pgds = ALL_PGDS.filter((p) => held.has(p.slug))
    .map((p) => ({ slug: p.slug, title: p.title }))
    .sort((a, b) => a.title.localeCompare(b.title))

  // ?pgd= from a patient form page; the form slug may be an alias of the
  // slug the pharmacy holds.
  const { pgd } = await searchParams
  let defaultPgd = ''
  if (pgd) {
    defaultPgd = [pgd, ...(EPGD_SEGMENT_ALIASES[pgd] ?? [])].find((s) => held.has(s)) ?? ''
  }

  const [me] = await db
    .select({ firstName: users.firstName, lastName: users.lastName, gphcNumber: users.gphcNumber })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <Link
        href="/for-pharmacies/dashboard/records"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[color:var(--tenant-primary)] transition-colors mb-4"
      >
        &larr; Back to Patient Records
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Record a paper consultation</h1>
      <p className="text-gray-500 mt-1 mb-4">
        For a consultation done on the printed patient form instead of an ePGD tool.
        Attach a scan or photo of the completed form.
      </p>
      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">{PAPER_CONSULTATION_NOTE}</p>
      </div>
      {pgds.length === 0 ? (
        <p className="text-sm text-gray-600 rounded-xl border border-gray-200 bg-white p-4">
          Your pharmacy does not hold any PGDs, so a paper consultation cannot be recorded.
        </p>
      ) : (
        <PaperConsultationForm
          pgds={pgds}
          defaultPgd={defaultPgd}
          defaultPharmacistName={me ? `${me.firstName} ${me.lastName}`.trim() : session.user.name || ''}
          defaultGphc={me?.gphcNumber || ''}
        />
      )}
    </div>
  )
}
