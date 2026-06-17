'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserWithPharmacy = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  pharmacyId: string | null
  pharmacyName: string | null
  isActive: boolean
  createdAt: Date
}

type Pharmacy = {
  id: string
  name: string
  isActive: boolean
}

interface UserDetailClientProps {
  user: UserWithPharmacy
  pharmacies: Pharmacy[]
}

export default function UserDetailClient({ user, pharmacies }: UserDetailClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isResettingToTemp, setIsResettingToTemp] = useState(false)
  // The plain-text temporary password returned by the server when an admin
  // clicks "Reset to temporary password". Shown ONCE in a banner so the admin
  // can copy it; cleared when the user navigates away or triggers a new
  // reset. Never persisted client-side.
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [tempPasswordCopied, setTempPasswordCopied] = useState(false)

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    pharmacyId: user.pharmacyId || '',
    isActive: user.isActive,
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')

  const handleDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateDetailsForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    if (['pharmacy_admin', 'pharmacist'].includes(formData.role)) {
      if (!formData.pharmacyId) {
        newErrors.pharmacyId = 'Pharmacy is required for this role'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateDetailsForm()) {
      return
    }

    setIsSavingDetails(true)
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          pharmacyId: formData.pharmacyId || null,
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setErrors({ submit: data.error || 'Failed to update user' })
        setIsSavingDetails(false)
        return
      }

      setSuccessMessage('User details updated successfully')
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating user:', error)
      setErrors({ submit: 'An error occurred while updating the user' })
    } finally {
      setIsSavingDetails(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validatePasswordForm()) {
      return
    }

    setIsSavingPassword(true)
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setErrors({ passwordSubmit: data.error || 'Failed to update password' })
        setIsSavingPassword(false)
        return
      }

      setSuccessMessage('Password updated successfully')
      setPasswordData({ newPassword: '', confirmPassword: '' })
      router.refresh()
    } catch (error) {
      console.error('Error updating password:', error)
      setErrors({ passwordSubmit: 'An error occurred while updating the password' })
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleResetToTemp = async () => {
    if (
      !confirm(
        `Reset ${user.firstName} ${user.lastName}'s password to a new temporary one?\n\n` +
          `They will be forced to change it on next login. The temporary password ` +
          `will be shown to you ONCE — make sure to copy it before navigating away.`
      )
    ) {
      return
    }

    setIsResettingToTemp(true)
    setSuccessMessage('')
    setErrors({})
    setTempPassword(null)
    setTempPasswordCopied(false)

    try {
      const response = await fetch(
        `/api/admin/users/${user.id}/reset-password`,
        { method: 'POST' }
      )

      const data = await response.json()

      if (!response.ok) {
        setErrors({
          tempReset: data.error || 'Failed to reset password',
        })
        return
      }

      setTempPassword(data.tempPassword)
      setSuccessMessage(
        `Temporary password generated. Copy it now — it will not be shown again.`
      )
    } catch (error) {
      console.error('Error resetting to temp password:', error)
      setErrors({
        tempReset: 'An error occurred while resetting the password',
      })
    } finally {
      setIsResettingToTemp(false)
    }
  }

  const handleCopyTempPassword = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setTempPasswordCopied(true)
      window.setTimeout(() => setTempPasswordCopied(false), 2500)
    } catch (error) {
      console.error('Clipboard write failed:', error)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) {
      return
    }

    setIsDeactivating(true)
    setSuccessMessage('')

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setErrors({ submit: data.error || 'Failed to deactivate user' })
        setIsDeactivating(false)
        return
      }

      setSuccessMessage('User has been deactivated')
      router.refresh()
    } catch (error) {
      console.error('Error deactivating user:', error)
      setErrors({ submit: 'An error occurred while deactivating the user' })
    } finally {
      setIsDeactivating(false)
    }
  }

  const activePharmacies = pharmacies.filter((p) => p.isActive)

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* User Details Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">User Details</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveDetails} className="p-6 space-y-6">
          {errors.submit && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">{errors.submit}</p>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="px-3 py-2 text-gray-900">{formData.firstName}</p>
              )}
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="px-3 py-2 text-gray-900">{formData.lastName}</p>
              )}
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="px-3 py-2 text-gray-900">{formData.email}</p>
            )}
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Role
            </label>
            {isEditing ? (
              <select
                name="role"
                value={formData.role}
                onChange={handleDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pharmacist">Pharmacist</option>
                <option value="pharmacy_admin">Pharmacy Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            ) : (
              <p className="px-3 py-2 text-gray-900 capitalize">
                {formData.role.replace('_', ' ')}
              </p>
            )}
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Pharmacy */}
          {['pharmacy_admin', 'pharmacist'].includes(formData.role) && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Pharmacy
              </label>
              {isEditing ? (
                <>
                  <select
                    name="pharmacyId"
                    value={formData.pharmacyId}
                    onChange={handleDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a pharmacy</option>
                    {activePharmacies.map((pharmacy) => (
                      <option key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name}
                      </option>
                    ))}
                  </select>
                  {errors.pharmacyId && (
                    <p className="mt-1 text-sm text-red-600">{errors.pharmacyId}</p>
                  )}
                </>
              ) : (
                <p className="px-3 py-2 text-gray-900">
                  {formData.pharmacyId ? (
                    <a
                      href={`/admin/pharmacies/${formData.pharmacyId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {user.pharmacyName}
                    </a>
                  ) : (
                    '—'
                  )}
                </p>
              )}
            </div>
          )}

          {/* Status */}
          {isEditing && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleDetailsChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">
                  Active
                </span>
              </label>
            </div>
          )}

          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Status
              </label>
              {formData.isActive ? (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              ) : (
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Inactive
                </span>
              )}
            </div>
          )}

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Created
            </label>
            <p className="px-3 py-2 text-gray-900">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSavingDetails}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isSavingDetails ? '#999' : '#25b4b4',
                }}
              >
                {isSavingDetails ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    pharmacyId: user.pharmacyId || '',
                    isActive: user.isActive,
                  })
                  setErrors({})
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Quick Reset to Temporary Password */}
      <div className="bg-white rounded-lg shadow border-l-4 border-teal-500">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Reset to Temporary Password
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Recommended for forgotten / locked-out users. Generates a random
            secure password and forces the user to change it on next login.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {errors.tempReset && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">
                {errors.tempReset}
              </p>
            </div>
          )}

          {tempPassword ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-300">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                One-time temporary password — copy it now
              </p>
              <p className="text-xs text-amber-800 mb-3">
                This will not be shown again. The user must change it the
                moment they log in.
              </p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 px-3 py-2.5 bg-white border border-amber-300 rounded-lg font-mono text-base text-gray-900 select-all">
                  {tempPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopyTempPassword}
                  className="px-4 py-2.5 rounded-lg font-medium text-white transition-colors"
                  style={{
                    backgroundColor: tempPasswordCopied ? '#16a34a' : '#25b4b4',
                  }}
                >
                  {tempPasswordCopied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-amber-800 mt-3">
                Suggested message: &ldquo;Your temporary password is{' '}
                <strong>{tempPassword}</strong>. Log in with your usual
                username/email; you&rsquo;ll be prompted to set a new password
                straight away.&rdquo;
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResetToTemp}
              disabled={isResettingToTemp}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isResettingToTemp ? '#999' : '#25b4b4',
              }}
            >
              {isResettingToTemp
                ? 'Generating temporary password…'
                : 'Reset to temporary password'}
            </button>
          )}
        </div>
      </div>

      {/* Password Reset Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Set Specific Password
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Only use this if you need to set a specific password (rare).
            Most resets should use the &ldquo;Reset to temporary password&rdquo;
            option above.
          </p>
        </div>

        <form onSubmit={handleSavePassword} className="p-6 space-y-6">
          {errors.passwordSubmit && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">{errors.passwordSubmit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSavingPassword}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSavingPassword ? '#999' : '#25b4b4',
              }}
            >
              {isSavingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Deactivate User Section */}
      {user.isActive && (
        <div className="bg-white rounded-lg shadow border-l-4 border-red-500">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Deactivate User</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Deactivating this user will prevent them from logging in. This action can be
              reversed by editing the user and enabling them again.
            </p>
            <button
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="px-4 py-2 rounded-lg font-medium transition-colors text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate User'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
