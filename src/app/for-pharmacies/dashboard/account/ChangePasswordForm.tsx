'use client'

import { useState } from 'react'

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [status, setStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'success' }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' })

  const validate = (): string | null => {
    if (!currentPassword) return 'Please enter your current password.'
    if (!newPassword) return 'Please enter a new password.'
    if (newPassword.length < 8)
      return 'New password must be at least 8 characters.'
    if (newPassword === currentPassword)
      return 'New password must be different from your current one.'
    if (newPassword !== confirmPassword)
      return 'New password and confirmation do not match.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      setStatus({ kind: 'error', message: err })
      return
    }

    setStatus({ kind: 'submitting' })
    try {
      const res = await fetch('/api/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setStatus({ kind: 'success' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        return
      }

      const body = await res.json().catch(() => ({}))
      setStatus({
        kind: 'error',
        message: body.error || 'Could not change password. Please try again.',
      })
    } catch {
      setStatus({
        kind: 'error',
        message: 'Network error. Please try again.',
      })
    }
  }

  const inputType = showPasswords ? 'text' : 'password'
  const baseInputClass =
    'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-primary)] focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1">
          Current password <span className="text-red-400">*</span>
        </label>
        <input
          type={inputType}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          className={baseInputClass}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1">
          New password <span className="text-red-400">*</span>
        </label>
        <input
          type={inputType}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          className={baseInputClass}
          minLength={8}
          required
        />
        <p className="text-xs text-gray-500 mt-1">At least 8 characters.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1">
          Confirm new password <span className="text-red-400">*</span>
        </label>
        <input
          type={inputType}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className={baseInputClass}
          required
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          className="w-3.5 h-3.5"
        />
        Show passwords
      </label>

      {status.kind === 'error' && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{status.message}</p>
        </div>
      )}

      {status.kind === 'success' && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            Password updated. Use the new one next time you log in.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={status.kind === 'submitting'}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            status.kind === 'submitting'
              ? 'bg-gray-300 text-gray-500 cursor-wait'
              : 'bg-[color:var(--tenant-primary)]/100 hover:bg-[color:var(--tenant-primary)]/15 text-white'
          }`}
        >
          {status.kind === 'submitting' ? 'Saving...' : 'Update password'}
        </button>
      </div>
    </form>
  )
}
