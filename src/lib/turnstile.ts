/**
 * Cloudflare Turnstile server-side verification.
 * Called from public state-changing endpoints (onboarding, contact,
 * booking-confirm) before they do any DB writes.
 *
 * Required env vars:
 *   TURNSTILE_SECRET_KEY               (server)
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY     (client — exposed to the browser)
 *
 * Set them in Vercel and run the site through https://dash.cloudflare.com →
 * Turnstile → Add site. Use Hostname = `getrealhealthpgd.co.uk`. Mode:
 * Managed (handles bots automatically; users see no challenge in 99% of cases).
 *
 * If the env vars are absent, verifyTurnstile() returns true (open). This
 * matches the pre-Turnstile behaviour and stops accidentally locking us out
 * during local development. In production we rely on the env vars being set.
 */

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
}

export async function verifyTurnstile(token: string | null | undefined, remoteIp?: string | null): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Dev / not yet configured — let through but log so we notice in prod
    if (process.env.NODE_ENV === 'production') {
      console.warn('[turnstile] TURNSTILE_SECRET_KEY not set — captcha is OFF.')
    }
    return { ok: true }
  }
  if (!token) return { ok: false, error: 'Missing captcha token' }

  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', token)
  if (remoteIp) form.set('remoteip', remoteIp)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    if (!res.ok) return { ok: false, error: `Turnstile API ${res.status}` }
    const body = (await res.json()) as TurnstileResponse
    if (!body.success) return { ok: false, error: (body['error-codes'] || []).join(',') || 'failed' }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
