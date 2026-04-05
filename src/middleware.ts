import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req: NextRequest & { auth: { user: { role: string } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── Protect individual ePGD tools (not the index page) ────────
  const isEpgdTool =
    pathname.startsWith('/for-pharmacies/epgd/') &&
    pathname !== '/for-pharmacies/epgd' &&
    pathname !== '/for-pharmacies/epgd/' &&
    !pathname.startsWith('/for-pharmacies/epgd/shared')

  if (isEpgdTool && !session) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Protect pharmacy dashboard ───────────────────────────────
  if (pathname.startsWith('/for-pharmacies/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', req.nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── Protect admin routes ──────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', req.nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/for-pharmacies/dashboard', req.nextUrl.origin))
    }
  }

  // ── Protect client routes ─────────────────────────────────────
  if (pathname.startsWith('/client/')) {
    if (!session) {
      const loginUrl = new URL('/login', req.nextUrl.origin)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.user.role !== 'client') {
      // Non-client users can't access client pages
      if (session.user.role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin', req.nextUrl.origin))
      }
      return NextResponse.redirect(new URL('/for-pharmacies/dashboard', req.nextUrl.origin))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/for-pharmacies/epgd/:path+',
    '/for-pharmacies/dashboard/:path*',
    '/admin/:path*',
    '/client/:path*',
  ],
}
