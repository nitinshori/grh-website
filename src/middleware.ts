import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── HCP self-certification gate ──────────────────────────────────────
// Routes that require a "yes I am a healthcare professional" confirmation
// before they will render. The confirmation is stored in a cookie. This
// is the recognised mechanism for relying on the Reg 279 exemption to
// the prohibition on advertising prescription-only medicines to the
// general public.
const HCP_COOKIE_NAME = 'grh_hcp_confirmed'
const HCP_GATED_PREFIXES = [
  '/for-pharmacies/pgd-catalogue',
  '/for-pharmacies/epgd',
  '/pharmacy-plus-health',
  '/resources',
]

function isHcpGatedPath(pathname: string): boolean {
  return HCP_GATED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'),
  )
}

export default auth((req: NextRequest & { auth: { user: { role: string } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── HCP self-cert gate (must run before everything else) ──────
  // Authenticated users (logged-in pharmacy customers, admins, clients)
  // implicitly count as healthcare professionals — the soft gate is
  // about catching anonymous visitors.
  if (isHcpGatedPath(pathname) && !session) {
    const hcpCookie = req.cookies.get(HCP_COOKIE_NAME)?.value
    if (hcpCookie !== '1') {
      const gateUrl = new URL('/healthcare-professional', req.nextUrl.origin)
      // Preserve any querystring on the original request so the user
      // is returned exactly where they were trying to go.
      const fullPath = pathname + req.nextUrl.search
      gateUrl.searchParams.set('return', fullPath)
      return NextResponse.redirect(gateUrl)
    }
  }

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
    // HCP-gated public routes
    '/for-pharmacies/pgd-catalogue/:path*',
    '/pharmacy-plus-health/:path*',
    '/resources/:path*',
    // Auth-gated routes (also pass through HCP gate)
    '/for-pharmacies/epgd/:path+',
    '/for-pharmacies/dashboard/:path*',
    '/admin/:path*',
    '/client/:path*',
  ],
}
