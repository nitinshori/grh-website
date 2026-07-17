import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Free postcode lookup, proxied server-side through postcodes.io.
 *   GET /api/postcode/<POSTCODE>
 *   → { valid, postcode, town, region, country }
 *
 * Note: postcodes.io is free and needs no key, but only resolves a postcode
 * to its locality (district/ward/region) — it does NOT return house-level
 * PAF addresses. So this fills the town + postcode; the pharmacist adds the
 * house number / street. Proxied here (not called from the browser) to keep
 * the site's Content-Security-Policy connect-src allow-list tight.
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

  let res: Response
  try {
    res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`, {
      next: { revalidate: 86400 },
    })
  } catch (err) {
    return NextResponse.json({ valid: false, error: 'Lookup service unreachable', detail: String(err) }, { status: 502 })
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
    postcode: r.postcode ?? clean,
    town: r.admin_district ?? r.parish ?? r.admin_ward ?? '',
    region: r.region ?? r.country ?? '',
    country: r.country ?? '',
  })
}
