import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SignOutButton } from '@/app/admin/SignOutButton'
import { getTenant } from '@/lib/tenant-context'
import { needsConsent } from '@/lib/consent'
import { isAppointmentsOnlyGroup, getGroupBranding } from '@/lib/access-pharmacies'
import AppBridge from '@/components/AppBridge'

// Metadata is set dynamically from the tenant in generateMetadata below.
export async function generateMetadata() {
  const tenant = await getTenant()
  return {
    title: `My Dashboard | ${tenant.displayName}`,
    description: `Your pharmacy dashboard`,
  }
}

export default async function PharmacyDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Clinical sign-off reviewers (e.g. Chris) hold restricted `client`
  // accounts but must be able to open training modules and ePGD tools
  // to review them before signing off.
  const signoffReviewers = (process.env.SIGNOFF_REVIEWERS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const isSignoffReviewer = signoffReviewers.includes(
    session.user.email?.toLowerCase() ?? '',
  )

  if (session.user.role === 'client' && !isSignoffReviewer) redirect('/login')

  // SSO users must accept terms/data-processing on first use (versioned).
  if (session.user.id && (await needsConsent(session.user.id))) {
    redirect('/for-pharmacies/consent?next=/for-pharmacies/dashboard')
  }

  const tenant = await getTenant()
  const isWhiteLabel = tenant.slug !== 'grh'

  // Pharmacy name for the sidebar header. For super_admin (clinical lead)
  // with no pharmacy assignment, show "Clinical Review".
  let pharmacyName =
    session.user.role === 'super_admin' ? 'Clinical Review' :
    isSignoffReviewer && session.user.role === 'client' ? 'Clinical Review' :
    session.user.role === 'prospect' ? 'Preview' :
    'Your Pharmacy'
  let pharmacyGroupSlug: string | null = null
  if (session.user.pharmacyId) {
    const [pharmacy] = await db
      .select({ name: pharmacies.name, groupSlug: pharmacies.groupSlug })
      .from(pharmacies)
      .where(eq(pharmacies.id, session.user.pharmacyId))
      .limit(1)
    if (pharmacy) {
      pharmacyName = pharmacy.name
      pharmacyGroupSlug = pharmacy.groupSlug
    }
  }

  // Appointments-only groups (e.g. Pritchards) shouldn't see PGD nav items.
  const hidePgds = isAppointmentsOnlyGroup(pharmacyGroupSlug)
  // Partner branding (e.g. Pritchards Pharmacy logo). Shown as a strip
  // at the top of the sidebar under the tenant BrandMark.
  const groupBranding = getGroupBranding(pharmacyGroupSlug)

  const userName = session.user.name || session.user.email || 'User'
  const roleLabel =
    session.user.role === 'super_admin' ? 'Clinical Lead' :
    session.user.role === 'pharmacy_admin' ? 'Pharmacy Admin' :
    session.user.role === 'prospect' ? 'Preview' :
    'Pharmacist'

  const primary = tenant.theme.primary
  const primaryHover = tenant.theme.primaryHover

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <title>Dashboard - {tenant.displayName}</title>
      </head>
      <body
        className="h-full bg-gray-50"
        style={{
          ['--tenant-primary' as never]: primary,
          ['--tenant-primary-hover' as never]: primaryHover,
        }}
      >
        {/* Native app bridge — no-op in normal browsers */}
        <AppBridge />
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
            {/* Sidebar Header — brand + user */}
            <div className="flex flex-col items-start px-4 py-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-6 w-full">
                <BrandMark tenant={tenant} small />
                <span className="font-semibold text-gray-900 text-sm leading-tight truncate">
                  {pharmacyName}
                </span>
              </div>
              {groupBranding?.logoUrl && (
                <div className="w-full mb-4 pb-4 border-b border-gray-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={groupBranding.logoUrl}
                    alt={groupBranding.logoAlt}
                    className="h-10 w-auto max-w-full object-contain"
                  />
                </div>
              )}
              <div className="w-full">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              <NavItem href="/for-pharmacies/dashboard" label="Dashboard" iconPath="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-2m-9-2l4 2m0-5L9 7m5 6l4-2m-9-2l4 2" />
              <NavItem href="/for-pharmacies/dashboard/appointments" label="Appointments" iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              <NavItem href="/for-pharmacies/dashboard/appointments/settings" label="Settings" iconPath="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <NavItem href="/for-pharmacies/dashboard/account" label="Account" iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              {!hidePgds && (
                <NavItem href="/for-pharmacies/epgd" label="ePGD Tools" iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )}
              {!hidePgds && (
                <NavItem href="/for-pharmacies/dashboard/travel-checker" label="Travel checker" iconPath="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
              {!hidePgds && (
                <NavItem href="/for-pharmacies/dashboard/training" label="Training" iconPath="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              )}
              {(session.user.role === 'pharmacy_admin' || session.user.role === 'super_admin') && (
                <NavItem href="/for-pharmacies/dashboard/staff" label="Manage Staff" iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              )}
              {!hidePgds && (session.user.role === 'pharmacy_admin' || session.user.role === 'super_admin') && (
                <NavItem href="/for-pharmacies/dashboard/pgd-documents" label="Signed PGDs" iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )}
              {(session.user.role === 'pharmacy_admin' || session.user.role === 'super_admin') && (
                <NavItem href="/for-pharmacies/dashboard/analytics" label="Analytics" iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              )}
              {(session.user.role === 'pharmacy_admin' || session.user.role === 'super_admin') && (
                <NavItem href="/for-pharmacies/dashboard/group" label="Group Overview" iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              )}
            </nav>

            {/* Bottom Navigation */}
            <div className="border-t border-gray-200 px-2 py-4 space-y-1">
              {!isWhiteLabel && (
                <a
                  href="/"
                  className="flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 text-gray-700"
                >
                  <svg
                    className="w-5 h-5 mr-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Site
                </a>
              )}

              <SignOutButton className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 text-gray-700 text-left" />

              {tenant.showPoweredBy && (
                <p className="px-4 pt-3 text-[10px] text-gray-400 tracking-wide">
                  Powered by Get Real Health
                </p>
              )}
            </div>
          </aside>

          {/* Mobile Sidebar (collapsed icon-only rail) */}
          <aside className="md:hidden w-16 flex flex-col bg-white border-r border-gray-200">
            <div className="flex items-center justify-center px-2 py-4 border-b border-gray-200">
              <BrandMark tenant={tenant} small={false} />
            </div>

            <nav className="flex-1 px-2 py-4 space-y-2">
              <MobileNavItem href="/for-pharmacies/dashboard" title="Dashboard" iconPath="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-2m-9-2l4 2m0-5L9 7m5 6l4-2m-9-2l4 2" />
              <MobileNavItem href="/for-pharmacies/dashboard/appointments" title="Appointments" iconPath="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              {!hidePgds && (
                <MobileNavItem href="/for-pharmacies/epgd" title="ePGD Tools" iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )}
              {!hidePgds && (
                <MobileNavItem href="/for-pharmacies/dashboard/travel-checker" title="Travel checker" iconPath="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
              {!hidePgds && (
                <MobileNavItem href="/for-pharmacies/dashboard/training" title="Training" iconPath="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              )}
              {(session.user.role === 'pharmacy_admin' || session.user.role === 'super_admin') && (
                <MobileNavItem href="/for-pharmacies/dashboard/group" title="Group Overview" iconPath="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              )}
              <MobileNavItem href="/for-pharmacies/dashboard/account" title="Account" iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </nav>

            <div className="border-t border-gray-200 px-2 py-4 space-y-2">
              {!isWhiteLabel && (
                <a
                  href="/"
                  className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                  title="Back to Site"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </a>
              )}
              <SignOutButton className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100 text-gray-700 w-full" />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="h-full">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}

// ── helpers ──────────────────────────────────────────────────────

/**
 * Tenant brand mark — renders the tenant's logo image if one is set,
 * otherwise falls back to a coloured square with a medical cross.
 * `small` controls the size used inside the desktop sidebar header vs
 * the mobile collapsed rail.
 */
function BrandMark({
  tenant,
  small,
}: {
  tenant: Awaited<ReturnType<typeof getTenant>>
  small: boolean
}) {
  if (tenant.logo.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={tenant.logo.src}
        alt={tenant.logo.alt}
        className={small ? 'h-7 w-auto' : 'h-9 w-auto'}
      />
    )
  }
  const size = small ? 'w-8 h-8' : 'w-10 h-10'
  return (
    <div
      className={`${size} rounded-lg flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: tenant.theme.primary }}
    >
      <span
        className={`text-white font-bold ${small ? 'text-sm' : 'text-lg'}`}
      >
        ⚕
      </span>
    </div>
  )
}

function NavItem({
  href,
  label,
  iconPath,
}: {
  href: string
  label: string
  iconPath: string
}) {
  return (
    <a
      href={href}
      className="group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
    >
      <svg
        className="w-5 h-5 mr-3 flex-shrink-0 text-gray-500 group-hover:text-[color:var(--tenant-primary)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={iconPath}
        />
      </svg>
      {label}
    </a>
  )
}

function MobileNavItem({
  href,
  title,
  iconPath,
}: {
  href: string
  title: string
  iconPath: string
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
      title={title}
    >
      <svg
        className="w-6 h-6 text-gray-700"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={iconPath}
        />
      </svg>
    </a>
  )
}
