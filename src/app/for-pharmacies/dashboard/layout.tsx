import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SignOutButton } from '@/app/admin/SignOutButton'

export const metadata = {
  title: 'My Dashboard | Get Real Health',
  description: 'Your pharmacy dashboard',
}

export default async function PharmacyDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Super admins (e.g. clinical lead) can navigate into dashboard subpages
  // like /training for content review. The dashboard ROOT page redirects
  // them to /admin instead — see dashboard/page.tsx. This way Janey at
  // PPH can sign off training without needing a pharmacy assignment.

  // Client users have their own portal
  if (session.user.role === 'client') {
    redirect('/login')
  }

  // Fetch pharmacy name. For super_admin (clinical lead) with no pharmacy
  // assignment, show "Clinical Review". For prospects, show "Preview".
  let pharmacyName =
    session.user.role === 'super_admin' ? 'Clinical Review' :
    session.user.role === 'prospect' ? 'Preview' :
    'Your Pharmacy'
  if (session.user.pharmacyId) {
    const [pharmacy] = await db
      .select({ name: pharmacies.name })
      .from(pharmacies)
      .where(eq(pharmacies.id, session.user.pharmacyId))
      .limit(1)
    if (pharmacy) {
      pharmacyName = pharmacy.name
    }
  }

  const userName = session.user.name || session.user.email || 'User'
  const roleLabel =
    session.user.role === 'super_admin' ? 'Clinical Lead' :
    session.user.role === 'pharmacy_admin' ? 'Pharmacy Admin' :
    session.user.role === 'prospect' ? 'Preview' :
    'Pharmacist'

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <title>Dashboard - Get Real Health</title>
      </head>
      <body className="h-full bg-gray-50">
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
            {/* Sidebar Header */}
            <div className="flex flex-col items-start px-4 py-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#25b4b4' }}
                >
                  <span className="text-white font-bold text-sm">⚕</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm leading-tight">
                  {pharmacyName}
                </span>
              </div>
              <div className="w-full">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              <a
                href="/for-pharmacies/dashboard"
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
                    d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-2m-9-2l4 2m0-5L9 7m5 6l4-2m-9-2l4 2"
                  />
                </svg>
                Dashboard
              </a>

              <a
                href="/for-pharmacies/dashboard/appointments"
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Appointments
              </a>

              <a
                href="/for-pharmacies/dashboard/appointments/settings"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </a>

              <a
                href="/for-pharmacies/dashboard/account"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Account
              </a>

              <a
                href="/for-pharmacies/epgd"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                ePGD Tools
              </a>

              <a
                href="/for-pharmacies/dashboard/travel-checker"
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
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Travel checker
              </a>

              <a
                href="/for-pharmacies/dashboard/training"
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
                    d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                  />
                </svg>
                Training
              </a>

              {(session.user.role === "pharmacy_admin" || session.user.role === "super_admin") && (
                <a
                  href="/for-pharmacies/dashboard/staff"
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  Manage Staff
                </a>
              )}

              {(session.user.role === "pharmacy_admin" || session.user.role === "super_admin") && (
                <a
                  href="/for-pharmacies/dashboard/pgd-documents"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Signed PGDs
                </a>
              )}
            </nav>

            {/* Bottom Navigation */}
            <div className="border-t border-gray-200 px-2 py-4 space-y-1">
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

              <SignOutButton className="flex items-center w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 text-gray-700 text-left" />
            </div>
          </aside>

          {/* Mobile Sidebar (collapsed) */}
          <aside className="md:hidden w-16 flex flex-col bg-white border-r border-gray-200">
            <div className="flex items-center justify-center px-2 py-4 border-b border-gray-200">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#25b4b4' }}
              >
                <span className="text-white font-bold text-lg">⚕</span>
              </div>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-2">
              <a
                href="/for-pharmacies/dashboard"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="Dashboard"
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
                    d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-2m-9-2l4 2m0-5L9 7m5 6l4-2m-9-2l4 2"
                  />
                </svg>
              </a>

              <a
                href="/for-pharmacies/dashboard/appointments"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="Appointments"
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </a>

              <a
                href="/for-pharmacies/epgd"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="ePGD Tools"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </a>

              <a
                href="/for-pharmacies/dashboard/travel-checker"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="Travel checker"
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
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </a>

              <a
                href="/for-pharmacies/dashboard/training"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="Training"
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
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                  />
                </svg>
              </a>

              <a
                href="/for-pharmacies/dashboard/account"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="Account"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </a>
            </nav>

            <div className="border-t border-gray-200 px-2 py-4 space-y-2">
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
