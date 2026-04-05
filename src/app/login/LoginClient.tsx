'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/for-pharmacies/epgd'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(error ? 'Invalid email or password.' : '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setLoginError('')

    const result = await signIn('credentials', {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      setLoginError('Invalid email or password.')
      setLoading(false)
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#25b4b4] text-white text-2xl mb-4">
            ⚕
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Get Real Health</h1>
          <p className="mt-2 text-gray-500">Access your pharmacy&apos;s PGD consultation tools</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {loginError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#25b4b4] focus:border-transparent outline-none transition-shadow"
                placeholder="you@pharmacy.co.uk"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#25b4b4] focus:border-transparent outline-none transition-shadow"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#25b4b4] text-white font-semibold rounded-lg hover:bg-[#1e9e9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account? Contact your administrator.
        </p>
      </div>
    </div>
  )
}

export default function LoginClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Loading…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
