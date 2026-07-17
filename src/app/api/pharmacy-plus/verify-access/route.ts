import { NextRequest, NextResponse } from 'next/server'
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  issueAccessToken,
  verifyAccessPassword,
} from '@/lib/pharmacy-plus-access'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Fail closed: if no access password is configured, deny access rather
    // than opening the hub to everyone.
    if (!process.env.PHARMACY_PLUS_ACCESS_PASSWORD) {
      return NextResponse.json(
        { ok: false, error: 'Access is not configured' },
        { status: 503 }
      )
    }

    if (!verifyAccessPassword(password)) {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 })
    }

    // Issue a short-lived, signed, HTTP-only cookie the resource/download
    // routes can verify server-side.
    const res = NextResponse.json({ ok: true })
    res.cookies.set(ACCESS_COOKIE, issueAccessToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_COOKIE_MAX_AGE,
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 })
  }
}
