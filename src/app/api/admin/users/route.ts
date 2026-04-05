import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, pharmacies } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
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

// GET: List all users with their pharmacy name, sorted by last name
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allUsers = await db
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
      .orderBy(asc(users.lastName))

    const responseUsers: UserWithPharmacy[] = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      pharmacyId: u.pharmacyId,
      pharmacyName: u.pharmacyName,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }))

    return NextResponse.json(responseUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      pharmacyId,
    } = body

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Validate pharmacyId requirement for pharmacy_admin and pharmacist roles
    if (['pharmacy_admin', 'pharmacist'].includes(role)) {
      if (!pharmacyId) {
        return NextResponse.json(
          { error: 'pharmacyId is required for this role' },
          { status: 400 }
        )
      }

      // Verify pharmacy exists
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role,
        pharmacyId: pharmacyId || null,
      })
      .returning()

    if (!newUser[0]) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Fetch the complete user data with pharmacy info
    const createdUser = await db
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
      .where(eq(users.id, newUser[0].id))
      .limit(1)

    return NextResponse.json(createdUser[0], { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
