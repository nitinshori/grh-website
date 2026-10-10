import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Retired: AI phone receptionist webhook (Vapi).
 * Switched off October 2026. Every request gets 410 Gone straight away, with
 * no database writes, emails or calendar bookings. The previous
 * implementation is in git history if it is ever needed again.
 */
function gone() {
  return NextResponse.json({ error: 'The AI phone receptionist has been switched off.' }, { status: 410 })
}

export async function POST() {
  return gone()
}

export async function GET() {
  return gone()
}
