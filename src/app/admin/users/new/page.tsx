'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Pharmacy = {
  id: string
  name: string
  isActive: boolean
}

export default function NewUserPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pharmacyParam = searchParams.get('pharmacy')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'pharmacist',
    pharmacyId: pharmacyParam || '',
  })

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoadingPharmacies, setIsLoadingPharmacies] = useState(true)

  // Fetch pharmacies on component mount
  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const response = await fetch('/api/admin/pharmacies')
        if (!response.ok) throw new Error('Failed to fetch pharmacies')
        const data = await response.json()
        setPharmacies(data.filter((p: Pharmacy) => p.isActive))
      } catch (error) {
        console.error('Error fetching pharmacies:', error)
      } finally {
        setIsLoadingPharmacies(false)
      }
    }

    fetchPharmacies()
  }, [])

  const validateForm = (): boolean => {
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

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          pharmacyId: formData.pharmacyId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setErrors({ submit: data.error || 'Failed to create user' })
        setLoading(false)
        return
      }

      router.push('/admin/users')
    } catch (error) {
      console.error('Error creating user:', error)
      setErrors({
        submit: 'An error occurred while creating the user',
      })
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 inline-flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
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
            Back to Users
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New User</h1>
          <p className="text-gray-600">Add a new admin, pharmacy admin, or pharmacist user</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm font-medium text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Role */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pharmacist">Pharmacist</option>
                <option value="pharmacy_admin">Pharmacy Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Pharmacists and Pharmacy Admins require a pharmacy assignment
              </p>
            </div>

            {/* Pharmacy Selection */}
            {['pharmacy_admin', 'pharmacist'].includes(formData.role) && (
              <div>
                <label
                  htmlFor="pharmacyId"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Pharmacy
                </label>
                {isLoadingPharmacies ? (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading pharmacies...
                  </div>
                ) : pharmacies.length === 0 ? (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-red-50 text-red-700 text-sm">
                    No active pharmacies available. Please create a pharmacy first.
                  </div>
                ) : (
                  <select
                    id="pharmacyId"
                    name="pharmacyId"
                    value={formData.pharmacyId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a pharmacy</option>
                    {pharmacies.map((pharmacy) => (
                      <option key={pharmacy.id} value={pharmacy.id}>
                        {pharmacy.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.pharmacyId && (
                  <p className="mt-1 text-sm text-red-600">{errors.pharmacyId}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: loading ? '#999' : '#25b4b4' }}
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
              <Link
                href="/admin/users"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
