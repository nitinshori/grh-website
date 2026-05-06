import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/consultation-records/[id] — get full record with clinical data
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.pharmacyId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { id } = await params

    const [record] = await db
      .select()
      .from(consultationRecords)
      .where(
        and(
          eq(consultationRecords.id, id),
          eq(consultationRecords.pharmacyId, session.user.pharmacyId)
        )
      )
      .limit(1)

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json({ record })
  } catch (error) {
    console.error('Consultation record detail error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
