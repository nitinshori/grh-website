import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCustomPgdBySlug } from '@/lib/custom-pgd/queries'
import { hasPharmacyPgdAccess } from '@/lib/pgd-queries'

export const dynamic = 'force-dynamic'

// ── /for-pharmacies/epgd/custom/[slug]/document ─────────────────
// The formal, printable PGD document, generated from the same
// definition as the tool. Print to PDF from the browser for the
// signed paper copy; upload the signed version via Signed PGDs.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pgd = await getCustomPgdBySlug(slug)
  return { title: pgd ? `${pgd.title} — PGD Document` : 'PGD Document' }
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function CustomPgdDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const pgd = await getCustomPgdBySlug(slug)
  if (!pgd || pgd.status === 'archived') notFound()

  const isSuperAdmin = session.user.role === 'super_admin'
  if (pgd.status === 'draft' && !isSuperAdmin) notFound()
  if (!isSuperAdmin) {
    if (!session.user.pharmacyId) notFound()
    const ok = await hasPharmacyPgdAccess(session.user.pharmacyId, slug)
    if (!ok) notFound()
  }

  const d = pgd.definition
  // Section numbering shifts by one when the optional cautions section is present
  const medsN = d.cautions.length > 0 ? 5 : 4

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0 px-4 print:px-0">
      {/* Screen-only toolbar */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <a
          href={`/for-pharmacies/epgd/custom/${slug}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to ePGD tool
        </a>
        <p className="text-xs text-gray-500">
          Use your browser&apos;s print dialog to save as PDF
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow print:shadow-none rounded-lg print:rounded-none p-8 sm:p-12 print:p-0 relative">
        {pgd.status === 'draft' && (
          <div className="absolute top-4 right-4 rotate-6 border-4 border-amber-400 text-amber-500 font-black text-xl px-4 py-1 rounded opacity-70 pointer-events-none">
            DRAFT
          </div>
        )}

        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
            Patient Group Direction
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{pgd.title}</h1>
          {pgd.subtitle && <p className="text-sm text-gray-600 mt-1">{pgd.subtitle}</p>}
        </div>

        {/* Version table */}
        <table className="w-full text-sm border border-gray-300 mb-8">
          <tbody>
            <Row label="Organisation" value="Get Real Health Ltd" />
            <Row label="Clinical lead / authorising doctor" value={d.clinicalLeadName || '—'} />
            <Row label="Version" value={d.documentVersion || '—'} />
            <Row label="Effective date" value={fmtDate(d.effectiveDate)} />
            <Row label="Review date" value={fmtDate(d.reviewDate)} />
            <Row label="Status" value={pgd.status === 'live' ? 'Authorised for use' : 'DRAFT — not for clinical use'} />
          </tbody>
        </table>

        <DocSection n={1} title="Clinical condition or situation to which this PGD applies">
          <p>{d.clinicalCondition || '—'}</p>
          {d.overview && <p className="mt-2 text-gray-700">{d.overview}</p>}
        </DocSection>

        <DocSection n={2} title="Inclusion criteria">
          <Bullets items={d.inclusionCriteria} />
        </DocSection>

        <DocSection n={3} title="Exclusion criteria">
          <Bullets items={d.exclusionCriteria} />
        </DocSection>

        {d.cautions.length > 0 && (
          <DocSection n={4} title="Cautions / circumstances requiring further advice">
            <Bullets items={d.cautions} />
          </DocSection>
        )}

        <DocSection n={medsN} title="Medicines authorised under this PGD">
          {d.medicines.map((m) => (
            <div key={m.id} className="border border-gray-300 rounded mb-3 overflow-hidden break-inside-avoid">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
                <p className="font-bold text-gray-900 text-sm">
                  {m.name}
                  {m.brandName && ` (${m.brandName})`}{' '}
                  <span className="font-normal text-gray-500">
                    — {m.form} · {m.route} · {m.legalCategory}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {m.ageMaxYears != null
                    ? `Ages ${m.ageMinYears} to ${m.ageMaxYears}`
                    : `Age ${m.ageMinYears} and over`}
                  {m.isVaccine && ' · Vaccine — record batch number, expiry and site'}
                </p>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-gray-200 text-gray-500">
                    <th className="px-3 py-1.5 font-medium">Dose</th>
                    <th className="px-3 py-1.5 font-medium">Quantity</th>
                    <th className="px-3 py-1.5 font-medium">Directions</th>
                  </tr>
                </thead>
                <tbody>
                  {m.doseOptions.map((o) => (
                    <tr key={o.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-1.5">{o.label}</td>
                      <td className="px-3 py-1.5">{o.quantity || '—'}</td>
                      <td className="px-3 py-1.5">{o.directions || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(m.cautions || m.storageNotes) && (
                <div className="px-3 py-2 border-t border-gray-200 text-xs text-gray-600">
                  {m.cautions && <p><strong>Cautions:</strong> {m.cautions}</p>}
                  {m.storageNotes && <p><strong>Storage:</strong> {m.storageNotes}</p>}
                </div>
              )}
            </div>
          ))}
        </DocSection>

        <DocSection n={medsN + 1} title="Characterisation of staff authorised under this PGD">
          <Bullets items={d.staffCharacterisation} />
        </DocSection>

        <DocSection n={medsN + 2} title="Advice to be given to the patient">
          <Bullets items={d.adviceToPatient} />
        </DocSection>

        <DocSection n={medsN + 3} title="Referral arrangements">
          <Bullets items={d.referralArrangements} />
        </DocSection>

        <DocSection n={medsN + 4} title="Records to be kept">
          <Bullets items={d.recordsRequired} />
        </DocSection>

        {d.references.length > 0 && (
          <DocSection n={medsN + 5} title="References">
            <Bullets items={d.references} />
          </DocSection>
        )}

        {/* Signatures */}
        <div className="mt-10 pt-6 border-t-2 border-gray-900 break-inside-avoid">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
            Authorisation
          </h2>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-8">
                Authorising doctor (clinical lead)
              </p>
              <div className="border-b border-gray-400 mb-1" />
              <p className="text-xs text-gray-600">{d.clinicalLeadName}</p>
              <p className="text-xs text-gray-400 mt-3">Signature · Date</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-8">
                Authorising pharmacist / organisation lead
              </p>
              <div className="border-b border-gray-400 mb-1" />
              <p className="text-xs text-gray-600">Name:</p>
              <p className="text-xs text-gray-400 mt-3">Signature · Date</p>
            </div>
          </div>
          <div className="mt-8 text-xs text-gray-500 border border-gray-300 rounded p-3">
            <p className="font-semibold text-gray-700 mb-1">Pharmacist declaration</p>
            <p>
              I have read and understood this Patient Group Direction, have completed the
              associated training, and agree to supply / administer only in accordance
              with it.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <div className="border-b border-gray-400 mb-1" />
                <p>Name & GPhC number</p>
              </div>
              <div>
                <div className="border-b border-gray-400 mb-1" />
                <p>Signature</p>
              </div>
              <div>
                <div className="border-b border-gray-400 mb-1" />
                <p>Date</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-gray-400">
          Get Real Health Ltd · {pgd.title} PGD v{d.documentVersion || '1.0'} · Generated by the GRH PGD Builder
        </p>
      </div>
    </div>
  )
}

// ── Document helpers ─────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-gray-300 last:border-0">
      <td className="px-3 py-2 bg-gray-50 font-medium text-gray-700 w-64 border-r border-gray-300">
        {label}
      </td>
      <td className="px-3 py-2 text-gray-900">{value}</td>
    </tr>
  )
}

function DocSection({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-6 break-inside-avoid">
      <h2 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-1 mb-2">
        {n}. {title}
      </h2>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-gray-400">—</p>
  return (
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}
