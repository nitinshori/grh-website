import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getTenant } from '@/lib/tenant-context'
import { needsConsent, recordConsent, CONSENT_VERSION } from '@/lib/consent'

export const dynamic = 'force-dynamic'

// First-use consent screen for SSO users (HubRx Insights → GRH portal).
// Shown once per consent version; acceptance is recorded with timestamp,
// IP and user agent for the audit trail.

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/for-pharmacies/login')
  const { next } = await searchParams
  const target =
    next && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/for-pharmacies/dashboard'

  if (!(await needsConsent(session.user.id))) redirect(target)

  const tenant = await getTenant()

  async function accept() {
    'use server'
    const s = await auth()
    if (!s?.user?.id) redirect('/for-pharmacies/login')
    const h = await headers()
    await recordConsent(s.user.id, {
      ipAddress: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: h.get('user-agent'),
    })
    redirect(target)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm max-w-xl w-full p-8">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: 'var(--tenant-primary)' }}
        >
          Before you start
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Your agreement with Get Real Health
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          You&apos;re accessing the Get Real Health clinical platform
          {tenant.slug !== 'grh' ? ` through ${tenant.displayName}` : ''}. Get
          Real Health Ltd provides the PGDs, consultation tools and record
          keeping, and processes the consultation data you enter on behalf of
          your pharmacy.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Before your first consultation, please read and accept:
        </p>
        <ul className="space-y-2 mb-6">
          <li>
            <Link href="/legal/terms" target="_blank" className="text-sm font-semibold hover:underline" style={{ color: 'var(--tenant-primary)' }}>
              Terms of Service →
            </Link>
          </li>
          <li>
            <Link href="/legal/privacy" target="_blank" className="text-sm font-semibold hover:underline" style={{ color: 'var(--tenant-primary)' }}>
              Privacy Policy →
            </Link>
          </li>
          <li className="text-sm text-gray-600">
            Data processing arrangements are set out in the agreement between
            Get Real Health and your platform provider; a copy is available
            from your superintendent or from{' '}
            <a href="mailto:info@getrealhealthpgd.co.uk" className="font-semibold hover:underline" style={{ color: 'var(--tenant-primary)' }}>
              info@getrealhealthpgd.co.uk
            </a>
            .
          </li>
        </ul>
        <form action={accept}>
          <button
            type="submit"
            className="w-full py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
          >
            I have read and accept the terms
          </button>
        </form>
        <p className="text-[11px] text-gray-400 mt-3 text-center">
          Your acceptance (version {CONSENT_VERSION}) is recorded with a
          timestamp for audit purposes. You&apos;ll only see this again if the
          documents change.
        </p>
      </div>
    </div>
  )
}
