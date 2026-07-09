import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SignOutButton } from './SignOutButton'

export const metadata = {
  title: 'Admin Dashboard | Get Real Health',
  description: 'Admin panel for Get Real Health',
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login')
  }

  // Redirect to home if not super_admin
  if (session.user.role !== 'super_admin') {
    redirect('/')
  }

  const userName = session.user.name || session.user.email || 'User'

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <title>Admin - Get Real Health</title>
      </head>
      <body className="h-full bg-gray-50">
        <div className="flex h-full">
          {/* Sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
            {/* Sidebar Header */}
            <div className="flex flex-col items-start px-4 py-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#25b4b4' }}>
                  <span className="text-white font-bold text-sm">⚕</span>
                </div>
                <span className="font-semibold text-gray-900">GRH Admin</span>
              </div>
              <div className="w-full">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              <a
                href="/admin"
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
                href="/admin/pharmacies"
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
                    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                  />
                </svg>
                Pharmacies
              </a>

              <a
                href="/admin/pgd-documents"
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
                PGD Documents
              </a>

              <a
                href="/admin/pgd-matrix"
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
                    d="M4 6h16M4 10h16M4 14h16M4 18h16M8 4v16M16 4v16"
                  />
                </svg>
                PGD Matrix
              </a>

              <a
                href="/admin/users"
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
                    d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM15 20H9m6 0h6"
                  />
                </svg>
                Users
              </a>

              <a
                href="/admin/voice-calls"
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Voice Calls
              </a>

              <a
                href="/admin/demo-activity"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Demo Activity
              </a>

              <a
                href="/admin/availability"
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Booking Availability
              </a>

              <a
                href="/admin/onboarding"
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Onboarding &amp; DDs
              </a>

              <a
                href="/admin/payments"
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Payments
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
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
                Training
              </a>
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
            {/* Mobile Header */}
            <div className="flex items-center justify-center px-2 py-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#25b4b4' }}>
                <span className="text-white font-bold text-lg">⚕</span>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-2">
              <a
                href="/admin"
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
                href="/admin/pharmacies"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="Pharmacies"
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
                    d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                  />
                </svg>
              </a>

              <a
                href="/admin/users"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="Users"
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
                    d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM15 20H9m6 0h6"
                  />
                </svg>
              </a>

              <a
                href="/admin/voice-calls"
                className="flex items-center justify-center p-3 rounded-lg transition-colors hover:bg-gray-100"
                title="Voice Calls"
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </a>
            </nav>

            {/* Mobile Bottom */}
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
