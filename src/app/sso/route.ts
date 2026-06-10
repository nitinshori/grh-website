/**
 * SSO landing endpoint.
 *
 *   GET /sso?token=<JWT>&next=<optional relative path>
 *
 * Called when a HubRx Insights user clicks through to the GRH PGD
 * service. The token is a short-lived (≤5 min) HS256 JWT signed by
 * HubRx Insights using a shared secret.
 *
 * Flow:
 *   1. Validate the tenant matches the hostname (hubrx subdomain only)
 *   2. Hand the token to NextAuth's hubrx-sso Credentials provider
 *      via signIn() — that does signature check + JIT user creation
 *      and sets the session cookie
 *   3. Redirect to /for-pharmacies/dashboard (or ?next= if specified
 *      and safe)
 */

import { NextResponse, type NextRequest } from 'next/server'
import { signIn } from '@/lib/auth'
import { tenantFromHost } from '@/lib/tenants'

export const runtime = 'nodejs' // bcrypt + drizzle need Node runtime

export async function GET(req: NextRequest) {
  const tenant = tenantFromHost(req.headers.get('host'))

  // Only enabled on tenants where SSO is configured. On the default GRH
  // hostname this route returns 404 to keep the attack surface minimal.
  if (!tenant.sso.enabled) {
    return new NextResponse('Not found', { status: 404 })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const nextParam = url.searchParams.get('next')

  if (!token) {
    return errorPage(
      'Missing token',
      'No SSO token was provided. Please return to HubRx Insights and click the PGD link again.',
    )
  }

  // Only allow safe relative redirects — never an off-site redirect via
  // ?next=https://evil.com.
  let dashboardPath = tenant.sso.dashboardRedirect
  if (nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')) {
    dashboardPath = nextParam
  }

  // Build an ABSOLUTE redirect URL anchored to the current request host
  // (hubrx.getrealhealthpgd.co.uk). Without this, NextAuth's default
  // redirect callback rewrites relative paths against NEXTAUTH_URL — which
  // on production points at the main getrealhealthpgd.co.uk domain — so
  // the user gets bounced off the hubrx subdomain after sign-in. The
  // custom `redirect` callback in src/lib/auth.ts is what permits this
  // cross-subdomain redirect to actually be honoured.
  const reqOrigin = new URL(req.url).origin
  const dashboardRedirect = reqOrigin + dashboardPath

  // signIn() will run the hubrx-sso provider's authorize() — that
  // validates the JWT signature, performs JIT provisioning, and on
  // success NextAuth sets the session cookie and redirects to
  // redirectTo. On failure it returns to /login with ?error=.
  try {
    await signIn('hubrx-sso', {
      token,
      redirectTo: dashboardRedirect,
    })
  } catch (err) {
    // signIn throws a special redirect error on success — that's how
    // Next.js redirects from server-side. Re-throw to let Next handle it.
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      typeof (err as { digest: string }).digest === 'string' &&
      (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
    ) {
      throw err
    }
    return errorPage(
      'Sign-in failed',
      'We could not verify your HubRx sign-in token. It may have expired (tokens are valid for 5 minutes) or the link may be malformed. Please return to HubRx Insights and try again.',
    )
  }

  // Unreachable: signIn always throws (success or failure).
  return NextResponse.redirect(new URL('/login', req.url))
}

function errorPage(title: string, body: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} — HubRx PGD Service</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #1e293b; }
  main { max-width: 480px; margin: 80px auto; padding: 32px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  h1 { color: #1F3D7A; font-size: 20px; margin: 0 0 12px; }
  p { line-height: 1.55; margin: 0 0 16px; }
  small { color: #64748b; }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(body)}</p>
<small>If the problem persists, contact your HubRx administrator.</small>
</main>
</body>
</html>`
  return new NextResponse(html, {
    status: 400,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
