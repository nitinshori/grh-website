import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SignOutButton } from '@/app/admin/SignOutButton'

export default async function ClientLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Only clients can access client pages
  if (session.user.role !== 'client') {
    if (session.user.role === 'super_admin') redirect('/admin')
    redirect('/for-pharmacies/dashboard')
  }

  // Fetch pharmacy/client details
  let clientName = 'Client Portal'
  if (session.user.pharmacyId) {
    const [pharmacy] = await db
      .select({ name: pharmacies.name, slug: pharmacies.slug })
      .from(pharmacies)
      .where(eq(pharmacies.id, session.user.pharmacyId))
      .limit(1)

    if (pharmacy) {
      clientName = pharmacy.name
      // Ensure the user is accessing their own client page
      if (pharmacy.slug !== slug) {
        redirect(`/client/${pharmacy.slug}`)
      }
    }
  }

  const userName = session.user.name || session.user.email || 'User'

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <title>{clientName} — Get Real Health</title>
      </head>
      <body className="h-full bg-gray-50">
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
            {/* Sidebar Header */}
            <div className="flex flex-col items-start px-4 py-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#25b4b4' }}
                >
                  <span className="text-white font-bold text-sm">⚕</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm leading-tight">
                  {clientName}
                </span>
              </div>
              <div className="w-full">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500">Client Administrator</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1">
              <a
                href={`/client/${slug}`}
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

          {/* Mobile Header */}
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
                href={`/client/${slug}`}
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
