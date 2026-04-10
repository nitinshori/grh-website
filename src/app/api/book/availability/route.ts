import { NextResponse } from 'next/server'
import { getAvailability } from '@/lib/google-calendar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  let daysAhead = 14
  try {
    const body = await request.json()
    if (typeof body.daysAhead === 'number') {
      daysAhead = Math.min(Math.max(body.daysAhead, 1), 30)
    }
  } catch {
    // empty body is fine — use defaults
  }

  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  try {
    const slots = await getAvailability(startDate, endDate, 12)
    return NextResponse.json({
      slots: slots.map((s) => ({
        start: s.start,
        end: s.end,
        label: s.startLabel,
      })),
    })
  } catch (err) {
    console.error('Public availability fetch failed:', err)
    return NextResponse.json(
      { error: 'Unable to load availability. Please try again.' },
      { status: 500 }
    )
  }
}
