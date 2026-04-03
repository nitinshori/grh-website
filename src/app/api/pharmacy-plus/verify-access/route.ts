import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const expected = process.env.PHARMACY_PLUS_ACCESS_PASSWORD

    if (!expected) {
      // If no access password is set, allow open access
      return NextResponse.json({ ok: true })
    }

    if (!password || password !== expected) {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 })
  }
}
