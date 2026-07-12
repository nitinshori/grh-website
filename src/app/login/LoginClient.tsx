'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import type { TenantConfig } from '@/lib/tenants'

interface Props {
  tenant: TenantConfig
}

// ── Native biometric bridge (GRH mobile app only) ────────────────
// Inside the Capacitor app, window.Capacitor.Plugins.NativeBiometric
// (from @capgo/capacitor-native-biometric) stores credentials in the
// iOS Keychain / Android Keystore behind Face ID / fingerprint. In a
// normal browser all of this is absent and the login page is unchanged.

const BIOMETRIC_SERVER = 'getrealhealthpgd.co.uk'
const BIOMETRIC_FLAG = 'grh_biometric_enrolled'

interface NativeBiometricPlugin {
  isAvailable(): Promise<{ isAvailable: boolean; biometryType?: number }>
  verifyIdentity(opts: {
    reason?: string
    title?: string
    subtitle?: string
  }): Promise<void>
  setCredentials(opts: {
    username: string
    password: string
    server: string
  }): Promise<void>
  getCredentials(opts: { server: string }): Promise<{
    username: string
    password: string
  }>
  deleteCredentials(opts: { server: string }): Promise<void>
}

function getNativeBiometric(): NativeBiometricPlugin | null {
  const cap = (
    window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean
        Plugins?: { NativeBiometric?: NativeBiometricPlugin }
      }
    }
  ).Capacitor
  if (!cap?.isNativePlatform?.()) return null
  return cap.Plugins?.NativeBiometric ?? null
}

function LoginForm({ tenant }: Props) {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || ''
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [biometricReady, setBiometricReady] = useState(false)
  const [loginError, setLoginError] = useState(
    error === 'blocked'
      ? 'Your account has been deactivated. Contact your administrator.'
      : error
        ? 'Invalid email or password.'
        : '',
  )

  const primary = tenant.theme.primary
  const primaryHover = tenant.theme.primaryHover

  // Show the Face ID button only inside the app, when biometrics are
  // available AND the user previously enrolled on this device.
  useEffect(() => {
    const bio = getNativeBiometric()
    if (!bio) return
    if (localStorage.getItem(BIOMETRIC_FLAG) !== '1') return
    bio
      .isAvailable()
      .then(({ isAvailable }) => setBiometricReady(isAvailable))
      .catch(() => {})
  }, [])

  async function completeSignIn(
    identifier: string,
    pass: string,
  ): Promise<'ok' | 'invalid'> {
    const result = await signIn('credentials', {
      email: identifier.toLowerCase().trim(),
      password: pass,
      redirect: false,
    })

    if (result?.error) return 'invalid'
    if (!result?.ok) return 'invalid'

    let session: {
      user?: {
        mustChangePassword?: boolean
        role?: string
        pharmacySlug?: string
      }
    } | null = null
    try {
      const sessionRes = await fetch('/api/auth/session')
      session = await sessionRes.json()
    } catch {
      // fall through to default redirect
    }

    // Offer Face ID enrolment inside the app after a successful password
    // sign-in (not when the password is about to be force-changed).
    if (!session?.user?.mustChangePassword) {
      await maybeOfferBiometricEnrolment(identifier, pass)
    }

    // Forced password change overrides everything else — the user
    // is logged in but every other page redirects here until they
    // set a new password.
    if (session?.user?.mustChangePassword) {
      window.location.href = '/change-password'
    } else if (session?.user?.role === 'client' && session?.user?.pharmacySlug) {
      window.location.href = `/client/${session.user.pharmacySlug}`
    } else if (session?.user?.role === 'client' && !session?.user?.pharmacySlug) {
      // Client accounts with no pharmacy are clinical-sign-off reviewers
      // (e.g. Chris). The pharmacy dashboard bounces 'client' back to
      // /login, so send them straight to the sign-off register instead.
      window.location.href = callbackUrl || '/clinical-sign-off'
    } else if (session?.user?.role === 'super_admin') {
      window.location.href = callbackUrl || '/admin'
    } else {
      window.location.href = callbackUrl || '/for-pharmacies/dashboard'
    }
    return 'ok'
  }

  async function maybeOfferBiometricEnrolment(identifier: string, pass: string) {
    try {
      const bio = getNativeBiometric()
      if (!bio) return
      if (localStorage.getItem(BIOMETRIC_FLAG) === '1') {
        // Already enrolled — keep the stored credentials fresh
        await bio.setCredentials({
          username: identifier,
          password: pass,
          server: BIOMETRIC_SERVER,
        })
        return
      }
      const { isAvailable } = await bio.isAvailable()
      if (!isAvailable) return
      const wants = window.confirm(
        'Use Face ID / fingerprint to sign in next time?',
      )
      if (!wants) return
      await bio.setCredentials({
        username: identifier,
        password: pass,
        server: BIOMETRIC_SERVER,
      })
      localStorage.setItem(BIOMETRIC_FLAG, '1')
    } catch {
      // Biometric enrolment is best-effort — never block login
    }
  }

  async function handleBiometricSignIn() {
    const bio = getNativeBiometric()
    if (!bio) return
    setLoading(true)
    setLoginError('')
    try {
      await bio.verifyIdentity({
        reason: 'Sign in to Get Real Health',
        title: 'Sign in',
      })
      const creds = await bio.getCredentials({ server: BIOMETRIC_SERVER })
      const outcome = await completeSignIn(creds.username, creds.password)
      if (outcome === 'invalid') {
        // Stored password no longer valid (changed elsewhere) — clear it
        localStorage.removeItem(BIOMETRIC_FLAG)
        setBiometricReady(false)
        try {
          await bio.deleteCredentials({ server: BIOMETRIC_SERVER })
        } catch {}
        setLoginError(
          'Your saved sign-in has expired. Please enter your password.',
        )
        setLoading(false)
      }
    } catch {
      // User cancelled the biometric prompt, or no credentials stored
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLoginError('')

    const outcome = await completeSignIn(email, password)
    if (outcome === 'invalid') {
      setLoginError('Invalid email/GPHC number or password.')
      setLoading(false)
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

          {/* Face ID / fingerprint — only inside the GRH app, after enrolment */}
          {biometricReady && (
            <button
              type="button"
              onClick={handleBiometricSignIn}
              disabled={loading}
              className="mt-3 w-full py-2.5 px-4 font-semibold rounded-lg border-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              style={{ borderColor: primary, color: primary }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 3H5a2 2 0 00-2 2v2m18 0V5a2 2 0 00-2-2h-2M3 17v2a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-2M9 9.5V9m6 .5V9m-6.5 6a4.98 4.98 0 007 0"
                />
              </svg>
              Sign in with Face ID
            </button>
          )}
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
