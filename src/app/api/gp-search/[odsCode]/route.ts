import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Fetch a single GP practice's full details by ODS code.
 *   GET /api/gp-search/<ODS_CODE>
 *   → { name, address, phone, postcode, odsCode }
 */
export const dynamic = 'force-dynamic'

interface OdsContact { type: string; value: string }

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ odsCode: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { odsCode } = await params
  const code = odsCode.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  if (!code) return NextResponse.json({ error: 'Bad code' }, { status: 400 })

  const url = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations/${code}`
  let res: Response
  try {
    res = await fetch(url, { next: { revalidate: 86400 } })
  } catch (err) {
    return NextResponse.json({ error: 'NHS directory unreachable', detail: String(err) }, { status: 502 })
  }
  if (!res.ok) {
    return NextResponse.json({ error: 'Practice not found', status: res.status }, { status: 404 })
  }
  // NHS ODS quirk: Contacts.Contact comes back as either an array (multi-contact)
  // OR a single object (one contact). The original code assumed array-only and
  // silently failed on single-contact practices. Reported by Moin June 2026 —
  // "GP details not auto-filling on selection". Defensive normalisation below.
  const body = await res.json() as { Organisation?: {
    Name: string
    OrgId?: { extension: string }
    GeoLoc?: { Location?: {
      AddrLn1?: string; AddrLn2?: string; AddrLn3?: string
      Town?: string; County?: string; PostCode?: string; Country?: string
    } }
    Contacts?: { Contact?: OdsContact[] | OdsContact }
  } }
  const org = body.Organisation
  if (!org) return NextResponse.json({ error: 'Empty response' }, { status: 502 })

  const loc = org.GeoLoc?.Location ?? {}
  const address = [loc.AddrLn1, loc.AddrLn2, loc.AddrLn3, loc.Town, loc.County, loc.PostCode]
    .filter((s): s is string => Boolean(s)).join(', ')
  // Normalise Contact to always be an array. Cover all three shapes:
  // missing, single object, or already an array.
  const rawContacts = org.Contacts?.Contact
  const contacts: OdsContact[] = Array.isArray(rawContacts)
    ? rawContacts
    : rawContacts
    ? [rawContacts]
    : []
  const phone = contacts.find((c) => c.type?.toLowerCase() === 'tel')?.value ?? ''
  // NHS ODS also carries email/url contacts for some practices (many have
  // none). Extract email when present so the consult form can auto-fill it.
  const email = contacts.find((c) => c.type?.toLowerCase() === 'email')?.value ?? ''

  return NextResponse.json({
    odsCode: code,
    name: org.Name,
    address,
    phone,
    email,
    postcode: loc.PostCode ?? '',
  })
}
