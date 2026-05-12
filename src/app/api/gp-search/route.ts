import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * GP practice search via NHS Spine ODS (Organisation Data Service).
 *
 * Public, free API. We support two query modes:
 *   • Name search — ODS does startswith match on Name. Good for users
 *     who know the practice name ("Belgrave Surgery", "Hockley Farm").
 *   • Postcode search — used when the query looks like a UK postcode
 *     prefix (e.g. "LE2", "LE2 7AB", "BS1"). Crucial because most
 *     surgeries don't have their city name in the practice name, so
 *     searching for "Leicester" returns almost nothing.
 *
 * If the input could plausibly be either, we run both in parallel and
 * merge — de-duping by ODS code.
 *
 * Endpoint:
 *   https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations
 *     ?Name=<query>|PostCode=<query>&PrimaryRoleId=RO180&Status=Active&Limit=15
 *
 * RO180 = "GP PRACTICE" primary role in the current ODS taxonomy.
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

/**
 * UK postcode prefix matcher. Matches:
 *   • Full postcodes: "LE2 7AB", "SW1A 1AA"
 *   • Outward only: "LE2", "SW1A"
 *   • Area only: "LE", "SW" (length 1–2 letters)
 * Designed to be generous so a partial type-as-you-go triggers postcode mode.
 */
function looksLikePostcode(q: string): boolean {
  const trimmed = q.trim().toUpperCase()
  // Reject if it contains spaces in odd positions or non-postcode chars
  if (!/^[A-Z][A-Z0-9 ]*$/.test(trimmed)) return false
  // Must contain at least one digit OR be a known 1-2 letter area prefix
  // followed by something looking postcode-y.
  if (/^[A-Z]{1,2}\d/.test(trimmed)) return true // LE1, SW1A, B23
  // Pure area prefix only (2 letters, no digit) — likely a name (e.g. "BS"),
  // don't trigger postcode mode unless 1 letter only (E, M, B = real areas).
  return false
}

async function searchByName(q: string): Promise<OdsOrganisation[]> {
  const url = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?Name=${encodeURIComponent(q)}&PrimaryRoleId=RO180&Status=Active&Limit=15`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = (await res.json()) as OdsSearchResponse
    return data.Organisations ?? []
  } catch {
    return []
  }
}

async function searchByPostcode(q: string): Promise<OdsOrganisation[]> {
  // ODS PostCode filter accepts partial postcodes (e.g. "LE2" returns all
  // Leicester central practices).
  const url = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?PostCode=${encodeURIComponent(q)}&PrimaryRoleId=RO180&Status=Active&Limit=25`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = (await res.json()) as OdsSearchResponse
    return data.Organisations ?? []
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  // Decide which searches to run. Postcode-looking queries hit BOTH endpoints
  // in case the practice name also matches; name-looking queries hit name only.
  const isPostcode = looksLikePostcode(q)

  const [byName, byPostcode] = await Promise.all([
    // For postcode-looking queries we skip the name search — ODS rejects very
    // short startswith name searches anyway and the postcode search is what
    // the user actually wants.
    isPostcode ? Promise.resolve<OdsOrganisation[]>([]) : (q.length >= 3 ? searchByName(q) : Promise.resolve<OdsOrganisation[]>([])),
    isPostcode ? searchByPostcode(q) : Promise.resolve<OdsOrganisation[]>([]),
  ])

  // Merge, de-dupe by OrgId, cap at 25.
  const seen = new Set<string>()
  const merged: OdsOrganisation[] = []
  for (const o of [...byName, ...byPostcode]) {
    if (seen.has(o.OrgId)) continue
    seen.add(o.OrgId)
    merged.push(o)
    if (merged.length >= 25) break
  }

  const lite = merged.map((o) => ({
    odsCode: o.OrgId,
    name: o.Name,
    postcode: o.PostCode ?? '',
    detailUrl: o.OrgLink ?? '',
  }))

  return NextResponse.json({ results: lite })
}
