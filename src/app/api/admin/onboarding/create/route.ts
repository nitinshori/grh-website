import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { onboardingRequests, type OnboardingBranch } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { isValidFeePence, isValidIsoDate, MAX_FEE_PENCE, MIN_FEE_PENCE, pounds, todayLondon } from '@/lib/billing'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/onboarding/create
 * Admin creates a sign-up on a customer's behalf with everything filled in
 * (pharmacy, extra branches, contact, group name, agreed fee and any
 * scheduled change). Returns a durable link for the customer to open and
 * set up the Direct Debit: /onboard/dd?id=<id>&key=<resumeKey>. Once the
 * mandate completes the request lands in the queue as awaiting_approval
 * like any other, with the agreed fee pre-filled on the approval form.
 *
 * Body: {
 *   pharmacyName, pharmacyAddress?, pharmacyPostcode?, pharmacyPhone?, pharmacyEmail?, pharmacyGphc?, pharmacyOdsCode?,
 *   contactFirstName, contactLastName, contactEmail, contactPhone?, contactGphc?, contactRole?,
 *   branches?: [{ name, address?, postcode?, phone?, email?, gphc?, odsCode? }],
 *   groupName?, monthlyFeePence?, feeChangePence?, feeChangeOn?, feeNote?
 * }
 */

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const b = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Bad body' }, { status: 400 })

  const pharmacyName = str(b.pharmacyName, 255)
  const contactFirstName = str(b.contactFirstName, 100)
  const contactLastName = str(b.contactLastName, 100)
  const contactEmail = str(b.contactEmail, 255)?.toLowerCase() ?? null
  if (!pharmacyName || pharmacyName.length < 2) return NextResponse.json({ error: 'Pharmacy name is required' }, { status: 400 })
  if (!contactFirstName || !contactLastName) return NextResponse.json({ error: 'Contact first and last name are required' }, { status: 400 })
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return NextResponse.json({ error: 'A valid contact email is required' }, { status: 400 })

  const branches: OnboardingBranch[] = []
  const seen = new Set([pharmacyName.toLowerCase()])
  if (Array.isArray(b.branches)) {
    for (const raw of b.branches) {
      if (!raw || typeof raw !== 'object') continue
      const o = raw as Record<string, unknown>
      const name = str(o.name, 255)
      if (!name || name.length < 2) continue
      if (seen.has(name.toLowerCase())) return NextResponse.json({ error: `"${name}" is listed twice` }, { status: 400 })
      seen.add(name.toLowerCase())
      branches.push({
        name,
        gphc: str(o.gphc, 50),
        odsCode: str(o.odsCode, 20),
        address: str(o.address, 500),
        postcode: str(o.postcode, 20),
        phone: str(o.phone, 50),
        email: str(o.email, 255)?.toLowerCase() ?? null,
      })
    }
  }

  const monthlyFeePence = b.monthlyFeePence == null || b.monthlyFeePence === '' ? null : Math.floor(Number(b.monthlyFeePence))
  if (monthlyFeePence != null && !isValidFeePence(monthlyFeePence)) {
    return NextResponse.json({ error: `Monthly fee must be between ${pounds(MIN_FEE_PENCE)} and ${pounds(MAX_FEE_PENCE)}` }, { status: 400 })
  }
  const feeChangePence = b.feeChangePence == null || b.feeChangePence === '' ? null : Math.floor(Number(b.feeChangePence))
  const feeChangeOn = str(b.feeChangeOn, 10)
  if ((feeChangePence == null) !== (feeChangeOn == null)) return NextResponse.json({ error: 'A scheduled change needs both a fee and a date' }, { status: 400 })
  if (feeChangePence != null && !isValidFeePence(feeChangePence)) return NextResponse.json({ error: 'Scheduled fee out of range' }, { status: 400 })
  if (feeChangeOn != null && (!isValidIsoDate(feeChangeOn) || feeChangeOn <= todayLondon())) return NextResponse.json({ error: 'Scheduled date must be a real future date' }, { status: 400 })

  const resumeKey = crypto.randomBytes(24).toString('hex')
  const [created] = await db
    .insert(onboardingRequests)
    .values({
      pharmacyName,
      pharmacyAddress: str(b.pharmacyAddress, 500),
      pharmacyPostcode: str(b.pharmacyPostcode, 20),
      pharmacyPhone: str(b.pharmacyPhone, 50),
      pharmacyEmail: str(b.pharmacyEmail, 255)?.toLowerCase() ?? null,
      pharmacyGphc: str(b.pharmacyGphc, 50),
      pharmacyOdsCode: str(b.pharmacyOdsCode, 20),
      contactFirstName,
      contactLastName,
      contactEmail,
      contactPhone: str(b.contactPhone, 50),
      contactGphc: str(b.contactGphc, 50),
      contactRole: str(b.contactRole, 50) ?? 'manager',
      branches,
      groupName: str(b.groupName, 255),
      monthlyFeePence,
      feeChangePence,
      feeChangeOn,
      feeNote: str(b.feeNote, 1000),
      heardAbout: 'existing',
      heardAboutDetail: 'Set up by Get Real Health on the customer\'s behalf',
      lastStepCompleted: 2,
      status: 'started',
      resumeKey,
      createdByAdmin: session.user.id,
    })
    .returning({ id: onboardingRequests.id })

  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const link = `${appUrl}/onboard/dd?id=${created.id}&key=${resumeKey}`
  return NextResponse.json({ ok: true, id: created.id, link, pharmacies: branches.length + 1 })
}
