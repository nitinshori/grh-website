import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  recordConsultationStart,
  recordConsultationComplete,
  getPharmacyStats,
  getSystemStats,
} from '@/lib/analytics'

/**
 * POST /api/analytics — record a consultation event
 * Body: { pgdSlug, action: 'start' | 'complete', consultationId? }
 */
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.pharmacyId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { pgdSlug, action, consultationId } = body

    if (action === 'start') {
      if (!pgdSlug) {
        return NextResponse.json({ error: 'pgdSlug is required' }, { status: 400 })
      }
      const id = await recordConsultationStart(
        session.user.id,
        session.user.pharmacyId,
        pgdSlug
      )
      return NextResponse.json({ consultationId: id })
    }

    if (action === 'complete') {
      if (!consultationId) {
        return NextResponse.json({ error: 'consultationId is required' }, { status: 400 })
      }
      await recordConsultationComplete(consultationId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

/**
 * GET /api/analytics?pharmacyId=xxx&days=30
 * super_admin can query any pharmacy or omit pharmacyId for system-wide
 * pharmacy users can only see their own pharmacy
 */
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const pharmacyId = searchParams.get('pharmacyId')

    // Super admin: system-wide or specific pharmacy
    if (session.user.role === 'super_admin') {
      if (pharmacyId) {
        const stats = await getPharmacyStats(pharmacyId, days)
        return NextResponse.json(stats)
      }
      const stats = await getSystemStats(days)
      return NextResponse.json(stats)
    }

    // Pharmacy users: own pharmacy only
    const userPharmacyId = session.user.pharmacyId
    if (!userPharmacyId) {
      return NextResponse.json({ error: 'No pharmacy assigned' }, { status: 403 })
    }

    // Prevent querying other pharmacies
    if (pharmacyId && pharmacyId !== userPharmacyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stats = await getPharmacyStats(userPharmacyId, days)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Analytics GET error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
