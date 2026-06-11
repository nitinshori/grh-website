'use client'

import { useState } from 'react'

export function ChangePasswordClient() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 12) {
      setError('New password must be at least 12 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.")
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not change password. Please try again.')
        setLoading(false)
        return
      }
      // Force a fresh session pull so mustChangePassword flag clears.
      // Easiest way: full page reload to the dashboard.
      window.location.href = '/for-pharmacies/dashboard'
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Set your new password
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            For security, you must change the temporary password you were
            given before continuing to the dashboard.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="current"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Current (temporary) password
              </label>
              <input
                id="current"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label
                htmlFor="new"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                New password
              </label>
              <input
                id="new"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 12 characters. Mix of upper/lower case, numbers and
                punctuation strongly recommended.
              </p>
            </div>
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold rounded-lg"
            >
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
