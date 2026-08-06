import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { gpPracticeContacts } from '@/lib/db/schema'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────────────────
// Remembered GP practice contacts.
//
// Reported by Moin (Aug 2026): the GP email has to be typed for every
// consultation, where Pharma Doctor used to have it already filled. NHS
// ODS only publishes an email for a minority of practices, so we learn
// them: whatever a pharmacist types for a practice is remembered against
// that practice's ODS code and offered next time.
//
// GET  /api/gp-contacts?odsCode=A81001  → { email, phone, practiceName }
// POST /api/gp-contacts                 → remember { odsCode, email, ... }
// ─────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const odsCode = (new URL(req.url).searchParams.get('odsCode') ?? '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase()
  if (!odsCode) return NextResponse.json({ found: false })

  const [row] = await db
    .select({
      email: gpPracticeContacts.email,
      phone: gpPracticeContacts.phone,
      practiceName: gpPracticeContacts.practiceName,
    })
    .from(gpPracticeContacts)
    .where(eq(gpPracticeContacts.odsCode, odsCode))
    .limit(1)

  if (!row?.email && !row?.phone) return NextResponse.json({ found: false })
  return NextResponse.json({ found: true, ...row })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const limited = rateLimit(`gpcontact:${session.user.id}`, 120, 60_000)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { odsCode?: string; email?: string; phone?: string; practiceName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const odsCode = (body.odsCode ?? '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const email = (body.email ?? '').trim()
  const phone = (body.phone ?? '').trim()
  const practiceName = (body.practiceName ?? '').trim() || null

  // Only remember something worth remembering, and never a malformed
  // address: a bad value here would propagate to every other pharmacy.
  if (!odsCode || (!email && !phone)) return NextResponse.json({ ok: false })
  if (email && !EMAIL_RE.test(email)) return NextResponse.json({ ok: false })

  await db
    .insert(gpPracticeContacts)
    .values({
      odsCode,
      practiceName,
      email: email || null,
      phone: phone || null,
      source: 'user',
      updatedByPharmacyId: session.user.pharmacyId ?? null,
    })
    .onConflictDoUpdate({
      target: gpPracticeContacts.odsCode,
      set: {
        // COALESCE on the new value so a blank submission never wipes a
        // good remembered address.
        email: sql`COALESCE(NULLIF(EXCLUDED.email, ''), ${gpPracticeContacts.email})`,
        phone: sql`COALESCE(NULLIF(EXCLUDED.phone, ''), ${gpPracticeContacts.phone})`,
        practiceName: sql`COALESCE(EXCLUDED.practice_name, ${gpPracticeContacts.practiceName})`,
        timesUsed: sql`${gpPracticeContacts.timesUsed} + 1`,
        updatedByPharmacyId: session.user.pharmacyId ?? null,
        updatedAt: new Date(),
      },
    })

  return NextResponse.json({ ok: true })
}
