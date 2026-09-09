import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCustomPgdBySlug } from '@/lib/custom-pgd/queries'
import { hasPharmacyPgdAccess } from '@/lib/pgd-queries'
import AccessDenied from '../../AccessDenied'
import { PgdPageActions } from '@/components/PgdPageActions'
import CustomPgdClient from './CustomPgdClient'

export const dynamic = 'force-dynamic'

// ── /for-pharmacies/epgd/custom/[slug] ──────────────────────────
// Generic ePGD tool, rendered entirely from the admin-authored
// definition. Same gating as hand-built tools: super_admin sees
// everything (drafts included, with a banner); pharmacies need a
// pharmacy_pgds assignment and the PGD must be live.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pgd = await getCustomPgdBySlug(slug)
  return {
    title: pgd ? `${pgd.title} ePGD | Pharmacy PGD` : 'ePGD | Pharmacy PGD',
    description: pgd?.definition.overview?.slice(0, 160) || 'PGD consultation tool',
  }
}

export default async function CustomPgdPage({
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

  // Drafts are admin-only
  if (pgd.status === 'draft' && !isSuperAdmin) notFound()

  // Pharmacy access check (super_admin bypasses)
  if (!isSuperAdmin) {
    if (!session.user.pharmacyId) return <AccessDenied pgdTitle={pgd.title} />
    const hasAccess = await hasPharmacyPgdAccess(session.user.pharmacyId, slug)
    if (!hasAccess) return <AccessDenied pgdTitle={pgd.title} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PgdPageActions />

        <div className="mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
            <p className="text-xs font-semibold text-[color:var(--tenant-primary)] uppercase tracking-wider mb-2">
              For registered pharmacy professionals only
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{pgd.title} ePGD</h1>
            <p className="text-gray-600 mb-4">
              {pgd.subtitle || 'PGD Consultation for UK Pharmacies'}
            </p>
            {pgd.status === 'draft' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-amber-900">
                  <strong>Draft — pending clinical sign-off.</strong> This tool is
                  provided for review by the named clinician before use.
                </p>
              </div>
            )}
            {pgd.definition.overview && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">{pgd.definition.overview}</p>
              </div>
            )}
          </div>
        </div>

        <CustomPgdClient slug={pgd.slug} title={pgd.title} definition={pgd.definition} />

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            Get Real Health ePGD — {pgd.title} | Confidential Patient Information
          </p>
        </div>
      </div>
    </div>
  )
}
