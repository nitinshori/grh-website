import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Postcode → address lookup, proxied server-side.
 *
 *   GET /api/postcode/<POSTCODE>
 *   → { valid, postcode, town, region, country, addresses?: string[] }
 *
 * Two tiers:
 *  1. If GETADDRESS_API_KEY is set, we call getAddress.io and return the
 *     full house-level address list (Royal Mail PAF data) so the pharmacist
 *     can pick the patient's exact address.
 *  2. Otherwise we fall back to the free postcodes.io service, which only
 *     resolves the locality (town/region) — the pharmacist types the house
 *     number and street themselves.
 *
 * Proxied here (not called from the browser) to keep the API key server-side
 * and the site's Content-Security-Policy connect-src allow-list tight.
 */
export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postcode: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { postcode } = await params
  const clean = decodeURIComponent(postcode).replace(/[^A-Z0-9]/gi, '')
  if (!clean) return NextResponse.json({ valid: false, error: 'Empty postcode' }, { status: 400 })

  // ── Tier 1a: full PAF address list via Ideal Postcodes ──────────
  // Preferred provider (pay-as-you-go, no subscription). Set
  // IDEAL_POSTCODES_API_KEY (starts "ak_") in Vercel to enable.
  const ipKey = process.env.IDEAL_POSTCODES_API_KEY
  if (ipKey) {
    try {
      const ipRes = await fetch(
        `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(clean)}?api_key=${encodeURIComponent(ipKey)}`,
        { next: { revalidate: 86400 } },
      )
      if (ipRes.ok) {
        const data = (await ipRes.json()) as {
          result?: Array<{ line_1?: string; line_2?: string; line_3?: string; post_town?: string; postcode?: string }>
        }
        const addresses = (data.result ?? [])
          .map((a) =>
            [a.line_1, a.line_2, a.line_3, a.post_town]
              .map((s) => (s ?? '').trim())
              .filter(Boolean)
              .join(', '),
          )
          .filter(Boolean)
        if (addresses.length > 0) {
          return NextResponse.json({
            valid: true,
            postcode: data.result?.[0]?.postcode ?? formatPostcode(clean),
            addresses,
          })
        }
      }
      if (ipRes.status === 404) {
        // Ideal Postcodes 404 genuinely means "postcode does not exist".
        return NextResponse.json({ valid: false, error: 'Postcode not found' }, { status: 404 })
      }
      // Bad key / quota / outage → fall through.
    } catch {
      // fall through
    }
  }

  // ── Tier 1b: getAddress.io (legacy option, kept as fallback) ────
  // Uses their current Autocomplete API — the old /find/{postcode}
  // endpoint has been retired and 404s for every request.
  const gaKey = process.env.GETADDRESS_API_KEY
  if (gaKey) {
    try {
      const gaRes = await fetch(
        `https://api.getAddress.io/autocomplete/${encodeURIComponent(clean)}?api-key=${encodeURIComponent(gaKey)}&all=true&template=${encodeURIComponent('{formatted_address}')}`,
        { next: { revalidate: 86400 } },
      )
      if (gaRes.ok) {
        const data = (await gaRes.json()) as {
          suggestions?: Array<{ address?: string; id?: string }>
        }
        const addresses = (data.suggestions ?? [])
          .map((s) =>
            (s.address ?? '')
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean)
              .join(', '),
          )
          .filter(Boolean)
        if (addresses.length > 0) {
          return NextResponse.json({
            valid: true,
            postcode: formatPostcode(clean),
            addresses,
          })
        }
        // No suggestions (unknown postcode) — fall through so the free
        // lookup can still validate/fill the locality or say not-found.
      }
      // Any other getAddress failure (bad key, quota, outage) falls
      // through to the free locality lookup rather than breaking the form.
    } catch {
      // fall through to tier 2
    }
  }

  // ── Tier 2: locality only via postcodes.io (free, keyless) ──────
  let res: Response
  try {
    res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
      next: { revalidate: 86400 },
    })
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: 'Lookup service unreachable', detail: String(err) },
      { status: 502 },
    )
  }

  if (res.status === 404) {
    return NextResponse.json({ valid: false, error: 'Postcode not found' }, { status: 404 })
  }
  if (!res.ok) {
    return NextResponse.json({ valid: false, error: 'Lookup failed' }, { status: 502 })
  }

  const body = (await res.json()) as {
    result?: {
      postcode?: string
      admin_district?: string
      admin_ward?: string
      parish?: string
      region?: string
      country?: string
    }
  }
  const r = body.result
  if (!r) return NextResponse.json({ valid: false, error: 'Postcode not found' }, { status: 404 })

  return NextResponse.json({
    valid: true,
    postcode: r.postcode ?? formatPostcode(clean),
    town: r.admin_district ?? r.parish ?? r.admin_ward ?? '',
    region: r.region ?? r.country ?? '',
    country: r.country ?? '',
  })
}

function formatPostcode(clean: string): string {
  if (clean.length < 5) return clean
  return `${clean.slice(0, -3)} ${clean.slice(-3)}`
}
