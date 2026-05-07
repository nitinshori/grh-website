import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ChangePasswordForm } from './ChangePasswordForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Account Settings',
  description: 'Update your account password and details',
}

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const name = session.user.name || ''
  const email = session.user.email || ''
  const role =
    session.user.role === 'pharmacy_admin'
      ? 'Pharmacy Admin'
      : session.user.role === 'pharmacist'
        ? 'Pharmacist'
        : session.user.role || 'User'

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/for-pharmacies/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Account Settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage your login details. Changes apply only to your account.
      </p>

      {/* Profile summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              Name
            </dt>
            <dd className="mt-0.5 text-gray-900">{name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              Email
            </dt>
            <dd className="mt-0.5 text-gray-900">{email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              Role
            </dt>
            <dd className="mt-0.5 text-gray-900">{role}</dd>
          </div>
        </dl>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Change password
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Pick something memorable but secure. Minimum 8 characters.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
