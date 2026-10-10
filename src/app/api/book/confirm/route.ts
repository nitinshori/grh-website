import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Retired: discovery-call booking (no page uses it any more).
 * Switched off October 2026. Every request gets 410 Gone straight away, with
 * no database writes, emails or calendar bookings. The previous
 * implementation is in git history if it is ever needed again.
 */
function gone() {
  return NextResponse.json({ error: 'This booking service is no longer available.' }, { status: 410 })
}

export async function POST() {
  return gone()
}

export async function GET() {
  return gone()
}
