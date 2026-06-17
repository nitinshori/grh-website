// Import from auth-edge (not auth.ts) — keeps the heavy Credentials
// providers (bcryptjs, drizzle, node:crypto) out of the Edge Middleware
// bundle. The cookie-based session reading still works identically
// because both configs sign / decode with the same NEXTAUTH_SECRET.
import { auth } from '@/lib/auth-edge'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { tenantFromHost } from '@/lib/tenants'
import { TENANT_HEADER } from '@/lib/tenant-context'

// ── Per-tenant routing ───────────────────────────────────────────────
// On non-default tenants (e.g. hubrx.getrealhealthpgd.co.uk), the public
// marketing site is deliberately hidden — HubRx pharmacies should only
// ever see the SSO landing, login fallback, and the authenticated portal.
// Anything outside this allow-list returns 404.
const TENANT_ALLOWED_PREFIXES = [
  '/login',
  '/logout',
  '/sso',
  '/for-pharmacies/dashboard',
  '/for-pharmacies/epgd',
  '/api/auth',           // NextAuth endpoints (signin/signout/session)
  '/api/voice',          // existing AI receptionist webhooks (unaffected)
  '/_next',              // build assets
  '/favicon',
  '/logos',              // tenant logos under /public/logos
  '/healthcare-professional', // HCP self-cert gate
]

function isTenantAllowedPath(pathname: string): boolean {
  return TENANT_ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'),
  )
}

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

export default auth(async (req: NextRequest & { auth: { user: { id?: string; role: string; mustChangePassword?: boolean } } | null }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── Forced password change gate ─────────────────────────────
  // PPH (and other bulk-imported) users are created with a temporary
  // password and `must_change_password = true`. Once they sign in,
  // every page redirects to /change-password until the flag clears.
  // We let only the change-password page itself, the API that backs
  // it, and the sign-out routes through.
  if (session?.user?.mustChangePassword) {
    const allowedWhileForcing = [
      '/change-password',
      '/api/account/change-password',
      '/api/auth', // NextAuth callbacks incl. sign-out
      '/_next',
      '/logos',
      '/favicon',
    ]
    const allowed = allowedWhileForcing.some(
      (p) => pathname === p || pathname.startsWith(p + '/'),
    )
    if (!allowed) {
      return NextResponse.redirect(new URL('/change-password', req.nextUrl.origin))
    }
  }

  // ── Tenant resolution ────────────────────────────────────────
  // Pick the tenant from the Host header so downstream code can theme
  // / restrict / SSO accordingly. The slug is forwarded to server
  // components via the `x-tenant` request header so they don't need to
  // re-parse the host.
  const host = req.headers.get('host')
  const tenant = tenantFromHost(host)

  // On a tenant that hides marketing (e.g. HubRx), block any path that
  // isn't on the allow-list. Done BEFORE the is_active and HCP checks
  // so an unauthenticated visitor to the HubRx subdomain just sees the
  // tenant login screen, not the public GRH marketing site.
  if (tenant.hideMarketing && !isTenantAllowedPath(pathname)) {
    return new NextResponse('Not found', { status: 404 })
  }

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

  // Forward the active tenant slug to server components via a request
  // header. They read it via `getTenant()` in src/lib/tenant-context.ts.
  const res = NextResponse.next()
  res.headers.set(TENANT_HEADER, tenant.slug)
  return res
})

export const config = {
  matcher: [
    // Catch-all so the tenant header is set on every page request. We
    // exclude:
    //   - /api/  → keeps webhook endpoints (Vapi, GoCardless, NextAuth
    //              internal routes) untouched by our auth + tenant logic.
    //              NextAuth handles its own callback routing.
    //   - Next.js build/internal paths
    //   - public static files we never want to gate
    //
    // Add new excludes here, not new matches.
    '/((?!api/|_next/static|_next/image|favicon.ico|logos/|videos/|images/).*)',
  ],
}
