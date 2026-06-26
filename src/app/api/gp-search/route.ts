import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * GP practice search via NHS Spine ODS (Organisation Data Service).
 *
 * Three search modes:
 *   • Name — ODS does startswith match on Name. Good when users know
 *     the practice name ("Belgrave Surgery", "Hockley Farm").
 *   • Postcode — used when the query looks like a UK postcode prefix
 *     (e.g. "LE2", "LE2 7AB", "BS1").
 *   • City fallback (NEW) — when the user types a city name like
 *     "Leicester" we ALSO fan out across the city's postcode prefixes
 *     (LE1, LE2, LE3…). This catches the case where a surgery doesn't
 *     have the city name in its title (true for most Leicester / London
 *     / Manchester / Birmingham surgeries).
 *
 * Endpoint:
 *   https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations
 *     ?Name=<query>|PostCode=<query>&PrimaryRoleId=RO177&Status=Active&Limit=15
 *
 * RO177 = "PRESCRIBING COST CENTRE" — this is the role current GP
 * practices register under in the ODS taxonomy. (RO180 = "PRIMARY CARE
 * TRUST SITE" is legacy and almost empty — using it was the bug behind
 * the Leicester GP search returning zero results.)
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
 * Major UK cities → outward-postcode prefixes. When a user types a city
 * name and the name search comes back empty, we fan out the postcode
 * search across all of these prefixes in parallel and merge the results.
 *
 * Coverage = the most-searched UK cities by community-pharmacy population.
 * Add to this list if Moin / other customers report missing cities.
 */
const CITY_TO_POSTCODE_PREFIXES: Record<string, string[]> = {
  // North-west
  manchester: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M19', 'M20', 'M21', 'M22', 'M23'],
  liverpool: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L11', 'L12', 'L13', 'L14', 'L15', 'L16', 'L17', 'L18', 'L19'],
  preston: ['PR1', 'PR2', 'PR3', 'PR4', 'PR5'],
  blackburn: ['BB1', 'BB2'],
  bolton: ['BL1', 'BL2', 'BL3', 'BL4', 'BL5', 'BL6'],
  // West Yorkshire / Midlands
  bradford: ['BD1', 'BD2', 'BD3', 'BD4', 'BD5', 'BD6', 'BD7', 'BD8', 'BD9', 'BD10', 'BD11', 'BD12', 'BD13', 'BD14', 'BD15', 'BD16', 'BD17', 'BD18'],
  leeds: ['LS1', 'LS2', 'LS3', 'LS4', 'LS5', 'LS6', 'LS7', 'LS8', 'LS9', 'LS10', 'LS11', 'LS12', 'LS13', 'LS14', 'LS15', 'LS16'],
  sheffield: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14'],
  // Leicester city (LE1-LE9) + wider Leicestershire (LE10-LE19: Hinckley,
  // Loughborough, Coalville, Melton Mowbray, Market Harborough, Lutterworth,
  // Wigston). Moin reported wider-area surgeries were missing - June 2026.
  leicester: ['LE1', 'LE2', 'LE3', 'LE4', 'LE5', 'LE6', 'LE7', 'LE8', 'LE9',
              'LE10', 'LE11', 'LE12', 'LE13', 'LE14', 'LE15', 'LE16', 'LE17', 'LE18', 'LE19'],
  nottingham: ['NG1', 'NG2', 'NG3', 'NG4', 'NG5', 'NG6', 'NG7', 'NG8', 'NG9'],
  birmingham: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21'],
  coventry: ['CV1', 'CV2', 'CV3', 'CV4', 'CV5', 'CV6'],
  wolverhampton: ['WV1', 'WV2', 'WV3', 'WV4', 'WV6'],
  derby: ['DE1', 'DE21', 'DE22', 'DE23', 'DE24'],
  stoke: ['ST1', 'ST2', 'ST3', 'ST4', 'ST5', 'ST6'],
  // London — common shorthand for the inner area
  london: ['E1', 'E2', 'EC1', 'EC2', 'N1', 'NW1', 'SE1', 'SW1', 'W1', 'WC1', 'WC2'],
  // South-west & south
  bristol: ['BS1', 'BS2', 'BS3', 'BS4', 'BS5', 'BS6', 'BS7', 'BS8', 'BS9', 'BS10', 'BS11', 'BS13', 'BS14', 'BS15', 'BS16'],
  bath: ['BA1', 'BA2'],
  southampton: ['SO14', 'SO15', 'SO16', 'SO17', 'SO18', 'SO19'],
  portsmouth: ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6'],
  brighton: ['BN1', 'BN2', 'BN3'],
  oxford: ['OX1', 'OX2', 'OX3', 'OX4'],
  cambridge: ['CB1', 'CB2', 'CB3', 'CB4', 'CB5'],
  // North-east
  newcastle: ['NE1', 'NE2', 'NE3', 'NE4', 'NE5', 'NE6', 'NE7', 'NE8'],
  sunderland: ['SR1', 'SR2', 'SR3', 'SR4', 'SR5', 'SR6'],
  middlesbrough: ['TS1', 'TS3', 'TS4', 'TS5', 'TS6', 'TS7', 'TS8'],
  hull: ['HU1', 'HU2', 'HU3', 'HU4', 'HU5', 'HU6', 'HU7', 'HU8', 'HU9'],
  york: ['YO1', 'YO10', 'YO23', 'YO24', 'YO26', 'YO30', 'YO31', 'YO32'],
  // Wales
  cardiff: ['CF1', 'CF3', 'CF5', 'CF10', 'CF11', 'CF14', 'CF23', 'CF24'],
  swansea: ['SA1', 'SA2', 'SA3', 'SA4', 'SA5', 'SA6'],
  newport: ['NP10', 'NP18', 'NP19', 'NP20'],
}

/**
 * UK postcode prefix matcher. Matches:
 *   • Full postcodes: "LE2 7AB", "SW1A 1AA"
 *   • Outward only: "LE2", "SW1A"
 * Requires at least one digit so plain words like "BS" or "Leicester"
 * don't trigger postcode mode.
 */
function looksLikePostcode(q: string): boolean {
  const trimmed = q.trim().toUpperCase()
  if (!/^[A-Z][A-Z0-9 ]*$/.test(trimmed)) return false
  return /^[A-Z]{1,2}\d/.test(trimmed)
}

/** Strip whitespace, lowercase. */
function normaliseCity(s: string): string {
  return s.trim().toLowerCase()
}

async function searchByName(q: string): Promise<OdsOrganisation[]> {
  const url = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?Name=${encodeURIComponent(q)}&PrimaryRoleId=RO177&Status=Active&Limit=50`
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
  const url = `https://directory.spineservices.nhs.uk/ORD/2-0-0/organisations?PostCode=${encodeURIComponent(q)}&PrimaryRoleId=RO177&Status=Active&Limit=50`
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

  const isPostcode = looksLikePostcode(q)
  const cityKey = normaliseCity(q)
  const cityPrefixes = CITY_TO_POSTCODE_PREFIXES[cityKey]

  // ── Three parallel branches ───────────────────────────────────
  const tasks: Promise<OdsOrganisation[]>[] = []

  if (isPostcode) {
    // Looks like a postcode — search postcode only
    tasks.push(searchByPostcode(q))
  } else {
    // Always try the name search first
    if (q.length >= 3) tasks.push(searchByName(q))

    // If the query is a known city name, fan out across all its postcode
    // prefixes in parallel. Each returns up to ~25, we'll cap the merged
    // list below.
    if (cityPrefixes) {
      for (const prefix of cityPrefixes) {
        tasks.push(searchByPostcode(prefix))
      }
    }
  }

  const results = await Promise.all(tasks)

  // Merge, de-dupe by OrgId, cap at 50.
  const seen = new Set<string>()
  const merged: OdsOrganisation[] = []
  for (const list of results) {
    for (const o of list) {
      if (seen.has(o.OrgId)) continue
      seen.add(o.OrgId)
      merged.push(o)
      if (merged.length >= 50) break
    }
    if (merged.length >= 50) break
  }

  const lite = merged.map((o) => ({
    odsCode: o.OrgId,
    name: o.Name,
    postcode: o.PostCode ?? '',
    detailUrl: o.OrgLink ?? '',
  }))

  // Hint payload — UI uses this to show a helpful empty-state message.
  const matchedCity = cityPrefixes ? cityKey : null

  return NextResponse.json({
    results: lite,
    matchedCity,
    searchMode: isPostcode ? 'postcode' : matchedCity ? 'city-fallback' : 'name',
  })
}
