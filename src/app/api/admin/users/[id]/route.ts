import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

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

// GET: Get single user with pharmacy details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        pharmacyId: users.pharmacyId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        pharmacyName: pharmacies.name,
      })
      .from(users)
      .leftJoin(pharmacies, eq(users.pharmacyId, pharmacies.id))
      .where(eq(users.id, id))
      .limit(1)

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData: UserWithPharmacy = {
      id: user[0].id,
      email: user[0].email,
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      role: user[0].role,
      pharmacyId: user[0].pharmacyId,
      pharmacyName: user[0].pharmacyName,
      isActive: user[0].isActive,
      createdAt: user[0].createdAt,
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT: Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { firstName, lastName, email, role, pharmacyId, isActive, password } =
      body

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate email format if provided
    if (email && email !== existingUser[0].email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      // Check if email already exists
      const emailExists = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1)

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Validate pharmacyId requirement for pharmacy_admin and pharmacist roles
    const roleToUse = role || existingUser[0].role
    if (['pharmacy_admin', 'pharmacist'].includes(roleToUse)) {
      if (!pharmacyId && !existingUser[0].pharmacyId) {
        return NextResponse.json(
          { error: 'pharmacyId is required for this role' },
          { status: 400 }
        )
      }

      // If pharmacyId is provided, verify it exists
      if (pharmacyId) {
        const pharmacy = await db
          .select()
          .from(pharmacies)
          .where(eq(pharmacies.id, pharmacyId))
          .limit(1)

        if (pharmacy.length === 0) {
          return NextResponse.json(
            { error: 'Pharmacy not found' },
            { status: 400 }
          )
        }
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}

    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email.toLowerCase()
    if (role !== undefined) updateData.role = role
    if (pharmacyId !== undefined) updateData.pharmacyId = pharmacyId
    if (isActive !== undefined) updateData.isActive = isActive

    // Hash password if provided and non-empty
    if (password && password.length > 0) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }
      const passwordHash = await bcrypt.hash(password, 12)
      updateData.passwordHash = passwordHash
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser[0]) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // Fetch updated user data with pharmacy info
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        pharmacyId: users.pharmacyId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        pharmacyName: pharmacies.name,
      })
      .from(users)
      .leftJoin(pharmacies, eq(users.pharmacyId, pharmacies.id))
      .where(eq(users.id, id))
      .limit(1)

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE: Deactivate user (set is_active=false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Deactivate user
    const deactivatedUser = await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id))
      .returning()

    if (!deactivatedUser[0]) {
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      )
    }

    // Fetch deactivated user data with pharmacy info
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        pharmacyId: users.pharmacyId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        pharmacyName: pharmacies.name,
      })
      .from(users)
      .leftJoin(pharmacies, eq(users.pharmacyId, pharmacies.id))
      .where(eq(users.id, id))
      .limit(1)

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error deactivating user:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate user' },
      { status: 500 }
    )
  }
}
