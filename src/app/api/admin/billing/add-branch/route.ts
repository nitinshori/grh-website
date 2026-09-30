import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pharmacies, pharmacyPgds, pharmacySubscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { ALL_PGDS } from '@/lib/pgd-access'
import { isValidFeePence, MAX_FEE_PENCE, MIN_FEE_PENCE, pounds, startBranchBilling } from '@/lib/billing'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/billing/add-branch
 * {
 *   sourceRowId: string        pharmacy_subscriptions row whose mandate is reused
 *   name: string               new branch
 *   address?, postcode?, phone?, email?, gphc?
 *   monthlyFeePence?: number   defaults to the source row's fee
 *   groupSlug?: string         defaults to the source pharmacy's group_slug
 * }
 *
 * A company that already pays by Direct Debit adds another branch without
 * a second sign-up: the new pharmacy is created in the same group, gets
 * every PGD, and a new subscription is started on the existing mandate
 * (My Local Chemist, 30 Sep 2026: Dispharma Retail Ltd adding Wilford
 * Lane and Alum Rock Road to the mandate that bills Melton Road). No
 * login is created; the group's pharmacy_admin covers the new branch.
 */

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const b = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!b) return NextResponse.json({ error: 'Bad body' }, { status: 400 })
  const sourceRowId = str(b.sourceRowId, 64)
  const name = str(b.name, 255)
  if (!sourceRowId) return NextResponse.json({ error: 'sourceRowId is required' }, { status: 400 })
  if (!name || name.length < 2) return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })

  const [src] = await db
    .select({
      id: pharmacySubscriptions.id,
      pharmacyId: pharmacySubscriptions.pharmacyId,
      onboardingId: pharmacySubscriptions.onboardingId,
      mandateId: pharmacySubscriptions.gocardlessMandateId,
      fee: pharmacySubscriptions.monthlyFeePence,
      cancelledAt: pharmacySubscriptions.cancelledAt,
      groupSlug: pharmacies.groupSlug,
      sourceName: pharmacies.name,
      email: pharmacies.email,
      phone: pharmacies.phone,
    })
    .from(pharmacySubscriptions)
    .innerJoin(pharmacies, eq(pharmacies.id, pharmacySubscriptions.pharmacyId))
    .where(eq(pharmacySubscriptions.id, sourceRowId))
    .limit(1)
  if (!src) return NextResponse.json({ error: 'Source billing row not found' }, { status: 404 })
  if (!src.mandateId) return NextResponse.json({ error: `${src.sourceName} has no mandate on record` }, { status: 400 })
  if (src.cancelledAt) return NextResponse.json({ error: `${src.sourceName}'s billing is cancelled; cannot add to it` }, { status: 400 })

  const monthlyFeePence = b.monthlyFeePence == null || b.monthlyFeePence === '' ? src.fee : Math.floor(Number(b.monthlyFeePence))
  if (!isValidFeePence(monthlyFeePence)) {
    return NextResponse.json({ error: `Monthly fee must be between ${pounds(MIN_FEE_PENCE)} and ${pounds(MAX_FEE_PENCE)}` }, { status: 400 })
  }
  const groupSlug = str(b.groupSlug, 100)?.toLowerCase() ?? src.groupSlug ?? null
  if (groupSlug && !/^[a-z0-9-]{3,100}$/.test(groupSlug)) {
    return NextResponse.json({ error: 'Group slug must be lower-case letters, digits and hyphens' }, { status: 400 })
  }

  const [dup] = await db.select({ id: pharmacies.id }).from(pharmacies).where(eq(pharmacies.name, name)).limit(1)
  if (dup) return NextResponse.json({ error: `A pharmacy named "${name}" already exists` }, { status: 409 })

  const address = [str(b.address, 500), str(b.postcode, 20)].filter(Boolean).join(', ') || null
  const [created] = await db
    .insert(pharmacies)
    .values({
      name,
      slug: `${slugify(name)}-${sourceRowId.slice(0, 4)}`,
      groupSlug,
      address,
      phone: str(b.phone, 50) ?? src.phone,
      email: str(b.email, 255)?.toLowerCase() ?? src.email,
      isActive: true,
    })
    .returning({ id: pharmacies.id, name: pharmacies.name })

  await db.insert(pharmacyPgds).values(ALL_PGDS.map((p) => ({ pharmacyId: created.id, pgdSlug: p.slug }))).onConflictDoNothing()

  const billing = await startBranchBilling({
    pharmacyId: created.id,
    pharmacyName: created.name,
    onboardingId: src.onboardingId ?? null,
    mandateId: src.mandateId,
    monthlyFeePence,
    notes: `Added to ${src.sourceName}'s Direct Debit on ${new Date().toISOString().slice(0, 10)}${str(b.gphc, 50) ? `; GPhC premises ${str(b.gphc, 50)}` : ''}`,
  })

  await audit({
    action: 'billing_edited',
    userId: session.user.id,
    pharmacyId: created.id,
    details: { addedBranch: created.name, onMandateOf: src.sourceName, mandateId: src.mandateId, monthlyFeePence, subscriptionId: billing.subscriptionId, error: billing.error },
  })

  return NextResponse.json({ ok: true, pharmacyId: created.id, name: created.name, groupSlug, mandateId: src.mandateId, ...billing })
}
