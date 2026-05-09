import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { consultationRecords } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { audit } from '@/lib/audit'
import { rateLimit } from '@/lib/rate-limit'
import { tryDecrypt } from '@/lib/encryption'

/**
 * GET /api/consultation-records/[id] — get full record with clinical data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.pharmacyId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const limited = rateLimit(`view:${session.user.id}`, 200, 60_000)
    if (!limited.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { id } = await params

    const [record] = await db
      .select()
      .from(consultationRecords)
      .where(
        and(
          eq(consultationRecords.id, id),
          eq(consultationRecords.pharmacyId, session.user.pharmacyId),
          isNull(consultationRecords.deletedAt)
        )
      )
      .limit(1)

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    await audit({
      pharmacyId: session.user.pharmacyId,
      userId: session.user.id,
      userEmail: session.user.email || null,
      action: 'record_view',
      recordId: record.id,
      request,
    })

    // Decrypt clinical_data before returning (handles legacy plaintext too)
    const decrypted = { ...record, clinicalData: tryDecrypt(record.clinicalData) }
    return NextResponse.json({ record: decrypted })
  } catch (error) {
    console.error('Consultation record detail error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * DELETE /api/consultation-records/[id] — soft-delete a record (GDPR Art. 17)
 * Body: { reason: string }
 * Sets deleted_at, deleted_by, deleted_reason. Record stays in DB for 30 days
 * before a separate purge job removes it permanently.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.pharmacyId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Only pharmacy_admin or super_admin can soft-delete
    if (session.user.role !== 'pharmacy_admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const reason = (body?.reason || '').toString().trim().slice(0, 255)

    if (!reason) {
      return NextResponse.json(
        { error: 'A reason is required (e.g. "patient erasure request")' },
        { status: 400 }
      )
    }

    const result = await db
      .update(consultationRecords)
      .set({
        deletedAt: new Date(),
        deletedBy: session.user.id,
        deletedReason: reason,
      })
      .where(
        and(
          eq(consultationRecords.id, id),
          eq(consultationRecords.pharmacyId, session.user.pharmacyId),
          isNull(consultationRecords.deletedAt)
        )
      )
      .returning({ id: consultationRecords.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    await audit({
      pharmacyId: session.user.pharmacyId,
      userId: session.user.id,
      userEmail: session.user.email || null,
      action: 'record_soft_delete',
      recordId: id,
      details: { reason },
      request,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Consultation record soft-delete error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
