import 'server-only'
import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getTenantBySlug } from '@/lib/tenants'
import { ALL_PGDS, WITHDRAWN_SLUGS } from '@/lib/pgd-access'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * GET /api/admin/sso-selftest?tenant=hubrx&slugs=acne,anti-malarials&all=1&ttl=300
 *
 * Tests the HubRx single sign-on end to end from OUR side, so that a
 * partner never has to report a broken link to us. It mints a token exactly
 * as HubRx Insights would (HS256, the shared secret that lives only in this
 * deployment's environment, the claims in docs/HUBRX_SSO_INTEGRATION.md) for
 * a dedicated self-test identity, then follows
 *   /sso?token=...&next=/for-pharmacies/epgd/<slug>
 * through every redirect with a cookie jar, and reports where each link
 * lands: the tool itself, our refusal banner, the login page, an SSO error
 * page, or something else. The secret is never returned.
 *
 * Super admin only. The self-test identity is provisioned by the same JIT
 * path as a real HubRx user, under a pharmacy named "GRH SSO self-test
 * (not a customer)", so what it sees is what a HubRx pharmacist sees.
 */

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function mint(secret: string, claims: Record<string, unknown>): string {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify(claims))
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest()
  return `${header}.${payload}.${b64url(sig)}`
}

interface Hop { url: string; status: number; location?: string }

interface Landing {
  slug: string
  next: string
  hops: Hop[]
  finalUrl: string
  finalStatus: number
  landed: 'tool' | 'refused' | 'login' | 'sso-error' | 'dashboard' | 'other'
  detail: string
  ms: number
}

async function walk(startUrl: string, expectedSlug: string): Promise<Landing> {
  const t0 = Date.now()
  const jar = new Map<string, string>()
  const hops: Hop[] = []
  let url = startUrl
  let res: Response | null = null
  for (let i = 0; i < 12; i++) {
    const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
    res = await fetch(url, {
      redirect: 'manual',
      headers: { cookie, 'user-agent': 'GRH-SSO-selftest/1.0', accept: 'text/html' },
      cache: 'no-store',
    })
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      const [pair] = sc.split(';')
      const eq = pair.indexOf('=')
      if (eq > 0) {
        const name = pair.slice(0, eq).trim()
        const value = pair.slice(eq + 1).trim()
        if (sc.toLowerCase().includes('max-age=0') || value === '') jar.delete(name)
        else jar.set(name, value)
      }
    }
    const location = res.headers.get('location') ?? undefined
    hops.push({ url, status: res.status, location })
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url).toString()
      continue
    }
    break
  }
  const finalUrl = url
  const finalStatus = res?.status ?? 0
  const body = res ? await res.text() : ''
  const path = new URL(finalUrl).pathname
  let landed: Landing['landed'] = 'other'
  let detail = ''
  if (path === `/for-pharmacies/epgd/${expectedSlug}` && finalStatus === 200) {
    landed = 'tool'
    const m = body.match(/<h1[^>]*>([^<]{0,120})<\/h1>/)
    detail = m ? m[1].replace(/\s+/g, ' ').trim() : 'page rendered'
  } else if (path === '/for-pharmacies/epgd' && new URL(finalUrl).searchParams.get('denied')) {
    landed = 'refused'
    detail = `denied=${new URL(finalUrl).searchParams.get('denied')} why=${new URL(finalUrl).searchParams.get('why')}`
  } else if (path === '/login') {
    landed = 'login'
    detail = new URL(finalUrl).search
  } else if (path === '/sso') {
    landed = 'sso-error'
    const m = body.match(/<h1>([^<]*)<\/h1>\s*<p>([^<]*)<\/p>/)
    detail = m ? `${m[1]}: ${m[2]}` : `status ${finalStatus}`
  } else if (path.startsWith('/for-pharmacies/dashboard')) {
    landed = 'dashboard'
    detail = path
  } else {
    detail = `${finalStatus} ${path}`
  }
  return { slug: expectedSlug, next: `/for-pharmacies/epgd/${expectedSlug}`, hops, finalUrl, finalStatus, landed, detail, ms: Date.now() - t0 }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const p = req.nextUrl.searchParams
  const tenantSlug = p.get('tenant') === 'hubrx-sandbox' ? 'hubrx-sandbox' : 'hubrx'
  const tenant = getTenantBySlug(tenantSlug)
  const secret = process.env[tenant.sso.secretEnvVar]
  if (!secret) {
    return NextResponse.json({ error: `${tenant.sso.secretEnvVar} is not set in this environment` }, { status: 500 })
  }
  const ttl = Math.min(Math.max(Number(p.get('ttl') ?? 300) || 300, 10), 3600)
  let slugs: string[]
  if (p.get('all')) {
    slugs = ALL_PGDS.map((x) => x.slug).filter((s) => !WITHDRAWN_SLUGS.has(s))
  } else {
    slugs = (p.get('slugs') ?? 'acne').split(',').map((s) => s.trim()).filter(Boolean)
  }
  const perLink = p.get('freshToken') !== '0' // a new token per link, as HubRx should mint them

  const origin = `https://${tenant.canonicalHost}`
  const now = () => Math.floor(Date.now() / 1000)
  const claims = () => ({
    sub: 'grh-sso-selftest',
    email: 'sso-selftest@getrealhealthpgd.co.uk',
    name: 'GRH SSO Self-test',
    pharmacy_id: 'grh-sso-selftest-pharmacy',
    pharmacy_name: 'GRH SSO self-test (not a customer)',
    role: 'pharmacist',
    iat: now(),
    exp: now() + ttl,
  })

  const results: Landing[] = []
  let sharedToken = perLink ? null : mint(secret, claims())
  for (const slug of slugs) {
    const token = perLink ? mint(secret, claims()) : sharedToken!
    const start = `${origin}/sso?token=${encodeURIComponent(token)}&next=${encodeURIComponent(`/for-pharmacies/epgd/${slug}`)}`
    try {
      results.push(await walk(start, slug))
    } catch (err) {
      results.push({ slug, next: `/for-pharmacies/epgd/${slug}`, hops: [], finalUrl: start.replace(/token=[^&]+/, 'token=***'), finalStatus: 0, landed: 'other', detail: `fetch failed: ${err instanceof Error ? err.message : String(err)}`, ms: 0 })
    }
  }
  sharedToken = null

  // an expired token, to prove the failure path shows the SSO error page
  let expiredLanding: Landing | null = null
  if (p.get('expired') !== '0') {
    const old = mint(secret, { ...claims(), iat: now() - 3600, exp: now() - 600 })
    const start = `${origin}/sso?token=${encodeURIComponent(old)}&next=${encodeURIComponent('/for-pharmacies/epgd/acne')}`
    try { expiredLanding = await walk(start, 'acne') } catch { expiredLanding = null }
  }

  const summary = results.reduce<Record<string, number>>((acc, r) => { acc[r.landed] = (acc[r.landed] ?? 0) + 1; return acc }, {})
  const scrub = (l: Landing | null) => l && ({ ...l, hops: l.hops.map((h) => ({ ...h, url: h.url.replace(/token=[^&]+/, 'token=***'), location: h.location?.replace(/token=[^&]+/, 'token=***') })), finalUrl: l.finalUrl.replace(/token=[^&]+/, 'token=***') })
  return NextResponse.json({
    tenant: tenantSlug,
    origin,
    tokenTtlSeconds: ttl,
    freshTokenPerLink: perLink,
    ranAt: new Date().toISOString(),
    summary,
    results: results.map(scrub),
    expiredToken: scrub(expiredLanding),
  })
}
