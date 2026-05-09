import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

// Temporary route — remove after use
export async function POST(req: Request) {
  const { secret, emails, password } = await req.json()

  // Simple secret to prevent random access
  if (secret !== 'grh-temp-reset-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hash = await bcrypt.hash(password, 10)
  const results: string[] = []

  for (const email of emails) {
    const updated = await db
      .update(users)
      .set({ passwordHash: hash })
      .where(eq(sql`LOWER(${users.email})`, email.toLowerCase()))
      .returning({ email: users.email, firstName: users.firstName, lastName: users.lastName })

    if (updated.length) {
      results.push(`✅ ${updated[0].firstName} ${updated[0].lastName} (${updated[0].email})`)
    } else {
      results.push(`⚠️ No user found for ${email}`)
    }
  }

  return NextResponse.json({ results })
}
