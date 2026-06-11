'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { TenantConfig } from '@/lib/tenants'

interface Props {
  tenant: TenantConfig
}

function LoginForm({ tenant }: Props) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || ''
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(
    error === 'blocked'
      ? 'Your account has been deactivated. Contact your administrator.'
      : error
        ? 'Invalid email or password.'
        : '',
  )

  const primary = tenant.theme.primary
  const primaryHover = tenant.theme.primaryHover

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLoginError('')

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    })

    if (result?.error) {
      setLoginError('Invalid email/GPHC number or password.')
      setLoading(false)
    } else if (result?.ok) {
      try {
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()

        // Forced password change overrides everything else — the user
        // is logged in but every other page redirects here until they
        // set a new password.
        if (session?.user?.mustChangePassword) {
          window.location.href = '/change-password'
        } else if (session?.user?.role === 'client' && session?.user?.pharmacySlug) {
          window.location.href = `/client/${session.user.pharmacySlug}`
        } else if (session?.user?.role === 'super_admin') {
          window.location.href = callbackUrl || '/admin'
        } else {
          window.location.href = callbackUrl || '/for-pharmacies/dashboard'
        }
      } catch {
        window.location.href = callbackUrl || '/for-pharmacies/dashboard'
      }
    }
  }

  // On white-label tenants (e.g. HubRx) we hide the public sign-up CTA —
  // pharmacies are only enrolled via the partner. We also surface a
  // helper note explaining the normal route in (via the partner portal).
  const isWhiteLabel = tenant.slug !== 'grh'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          {tenant.logo.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenant.logo.src}
              alt={tenant.logo.alt}
              width={tenant.logo.width}
              height={tenant.logo.height}
              className="mx-auto mb-4 h-12 w-auto"
            />
          ) : (
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-xl text-white text-2xl mb-4"
              style={{ backgroundColor: primary }}
            >
              ⚕
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            Sign in to {tenant.displayName}
          </h1>
          {tenant.strapline && (
            <p className="mt-2 text-gray-500">{tenant.strapline}</p>
          )}
        </div>

        {/* HubRx callout: explain the SSO route */}
        {isWhiteLabel && tenant.sso.enabled && (
          <div
            className="mb-6 rounded-xl border p-4 text-sm"
            style={{
              borderColor: primary,
              backgroundColor: `${primary}10`,
              color: '#1e293b',
            }}
          >
            <p className="font-semibold mb-1" style={{ color: primary }}>
              Signed in to HubRx Insights?
            </p>
            <p>
              The easiest way to access PGDs is to click the PGD link from
              within your HubRx Insights dashboard — you&apos;ll be signed
              in automatically.
            </p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {loginError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email or GPHC number
              </label>
              <input
                id="email"
                type="text"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:border-transparent outline-none transition-shadow"
                style={{
                  // Tenant colour for focus ring via CSS variable
                  ['--tw-ring-color' as never]: primary,
                }}
                placeholder="you@pharmacy.co.uk or 1234567"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:border-transparent outline-none transition-shadow"
                style={{
                  ['--tw-ring-color' as never]: primary,
                }}
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: primary }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = primaryHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = primary)
              }
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Sign-up CTA — only on the default GRH tenant. Partner tenants
            (HubRx, etc) don't self-serve; their users only enter via SSO. */}
        {!isWhiteLabel && (
          <>
            <p className="text-center text-sm text-gray-500 mt-6">
              New pharmacy?{' '}
              <a
                href="/onboard"
                className="font-semibold underline"
                style={{ color: primary }}
              >
                Sign up
              </a>
            </p>
            <p className="text-center text-xs text-gray-400 mt-2">
              Already part of a pharmacy? Contact your account holder to be
              added.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginClient({ tenant }: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Loading…</div>
        </div>
      }
    >
      <LoginForm tenant={tenant} />
    </Suspense>
  )
}
