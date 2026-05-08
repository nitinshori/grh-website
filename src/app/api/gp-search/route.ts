import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * GP practice search via NHS Spine ODS (Organisation Data Service).
 *
 * Public, free API. We proxy to:
 *   https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations
 *     ?Name=<query>&PrimaryRoleId=RO76&Status=Active&Limit=20
 *
 * RO76 = "GP PRACTICE" primary role.
 *
 * Auth-gated so unauthenticated traffic can't abuse it (it's a free upstream
 * but we still don't want to be a public proxy).
 *
 * Returns: { results: Array<{ odsCode, name, address, phone, postcode }> }
 */
export const dynamic = 'force-dynamic'

interface OdsOrganisation {
  Name: string
  OrgId: string
  Status: string
  OrgRecordClass: string
  PostCode?: string
  LastChangeDate?: string
  PrimaryRoleId?: string
  PrimaryRoleDescription?: string
  OrgLink?: string
}

interface OdsSearchResponse {
  Organisations?: OdsOrganisation[]
}

interface OdsOrgDetail {
  Organisation?: {
    Name: string
    OrgId?: { extension: string }
    GeoLoc?: {
      Location?: {
        AddrLn1?: string
        AddrLn2?: string
        AddrLn3?: string
        Town?: string
        County?: string
        PostCode?: string
        Country?: string
      }
    }
    Contacts?: {
      Contact?: Array<{ type: string; value: string }>
    }
  }
}

function formatAddress(loc: OdsOrgDetail['Organisation'] extends infer T ? T extends { GeoLoc?: infer G } ? G : never : never): string {
  if (!loc || typeof loc !== 'object') return ''
  const l = (loc as { Location?: Record<string, string | undefined> }).Location
  if (!l) return ''
  return [l.AddrLn1, l.AddrLn2, l.AddrLn3, l.Town, l.County, l.PostCode]
    .filter((s): s is string => Boolean(s))
    .join(', ')
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 3) {
    return NextResponse.json({ results: [] })
  }

  // ODS expects URL-encoded name; uses startswith match by default
  const url = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?Name=${encodeURIComponent(q)}&PrimaryRoleId=RO76&Status=Active&Limit=15`
  let listRes: Response
  try {
    listRes = await fetch(url, { next: { revalidate: 3600 } })
  } catch (err) {
    return NextResponse.json({ error: 'NHS directory unreachable', detail: String(err) }, { status: 502 })
  }
  if (!listRes.ok) {
    return NextResponse.json({ error: 'NHS directory error', status: listRes.status }, { status: 502 })
  }
  const list = (await listRes.json()) as OdsSearchResponse
  const orgs = list.Organisations ?? []

  // Lightweight result without full details (faster). Keep it under 15.
  const lite = orgs.slice(0, 15).map((o) => ({
    odsCode: o.OrgId,
    name: o.Name,
    postcode: o.PostCode ?? '',
    detailUrl: o.OrgLink ?? '',
  }))

  return NextResponse.json({ results: lite })
}
