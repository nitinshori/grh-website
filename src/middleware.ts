import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { neon } from '@neondatabase/serverless'

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

// ── Just-in-time is_active check (forced session revocation) ────────
// JWT sessions are stateless, so deactivating a user via the database
// doesn't immediately kick them out — their token stays valid until
// it expires. This in-middleware check queries the DB for is_active
// on each authenticated request (cached for 60s per instance) and
// clears the session cookie + redirects to /login?error=blocked when
// the user has been deactivated. Means a blocked user is logged out
// at most one click after their account flips inactive.
//
// On DB failure, we fail open (allow request through) to avoid locking
// everyone out if Neon has a hiccup.
const sql = neon(process.env.DATABASE_URL!)
const activeCache = new Map<string, { isActive: boolean; expiresAt: number }>()
const ACTIVE_CACHE_TTL_MS = 60_000

async function isUserActive(userId: string): Promise<boolean> {
  const cached = activeCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.isActive
  try {
    const rows = (await sql`
      SELECT is_active FROM users WHERE id = ${userId} LIMIT 1
    `) as Array<{ is_active: boolean }>
    const isActive = rows[0]?.is_active === true
    activeCache.set(userId, {
      isActive,
      expiresAt: Date.now() + ACTIVE_CACHE_TTL_MS,
    })
    return isActive
  } catch (err) {
    console.error('Middleware is_active check failed (failing open):', err)
    return true
  }
}

function buildBlockedResponse(origin: string): NextResponse {
  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('error', 'blocked')
  const res = NextResponse.redirect(loginUrl)
  // Clear every plausible session-cookie name across NextAuth v4/v5 + dev/prod
  for (const name of [
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
  ]) {
    res.cookies.set(name, '', { path: '/', expires: new Date(0) })
  }
  return res
}

export default auth(async (req: NextRequest & { auth: { user: { id?: string; role: string } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── Just-in-time is_active check on every authenticated request ────
  if (session?.user?.id) {
    const active = await isUserActive(session.user.id)
    if (!active) {
      return buildBlockedResponse(req.nextUrl.origin)
    }
  }

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
