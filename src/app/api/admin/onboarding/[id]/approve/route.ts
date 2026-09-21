import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests, pharmacies, pharmacyPgds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { ALL_PGDS } from '@/lib/pgd-access'
import { ensureFirstUser, sendSetupEmail } from '@/lib/onboarding-setup'
import { createSubscription } from '@/lib/gocardless'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/onboarding/[id]/approve
 * Admin-only. Creates the pharmacy, assigns all PGDs, creates the first user
 * (locked until they choose a password) and emails the contact a tokenised
 * set-password link. The customer never sees this endpoint directly.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({})) as { monthlyFeePence?: number }
  const monthlyFeePence = Number.isFinite(body.monthlyFeePence) ? Math.floor(body.monthlyFeePence as number) : null
  if (!monthlyFeePence || monthlyFeePence < 100) {
    return NextResponse.json({ error: 'Monthly fee (in pence) is required and must be at least £1.00' }, { status: 400 })
  }

  const [req] = await db
    .select()
    .from(onboardingRequests)
    .where(eq(onboardingRequests.id, id))
    .limit(1)
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.status === 'approved' || req.status === 'completed') {
    return NextResponse.json({ error: 'Already approved' }, { status: 409 })
  }
  if (!req.gocardlessMandateId) {
    return NextResponse.json({ error: 'No GoCardless mandate on record — direct debit not set up.' }, { status: 400 })
  }
  // Contact fields are nullable since migration 018 (drafts at step 1 may not
  // have them). By the time we get to approval the customer should have filled
  // step 2; refuse approval if they haven't, since we need contactEmail to
  // send the set-password invite.
  if (!req.contactEmail || !req.contactFirstName) {
    return NextResponse.json(
      { error: 'Onboarding draft is incomplete — contact details missing. The customer has not finished step 2.' },
      { status: 400 },
    )
  }
  const contactEmail = req.contactEmail

  // 1. Create pharmacy row
  const slug = (req.pharmacyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80) +
                '-' + req.id.slice(0, 4))
  const [newPharmacy] = await db
    .insert(pharmacies)
    .values({
      name: req.pharmacyName,
      slug,
      groupSlug: slug, // single-site default; admin can change later
      address: req.pharmacyAddress,
      phone: req.pharmacyPhone,
      email: req.pharmacyEmail || contactEmail,
      isActive: true,
    })
    .returning({ id: pharmacies.id })

  // 2. Assign all canonical PGDs
  const slugs = ALL_PGDS.map((p) => p.slug)
  for (const s of slugs) {
    await db.insert(pharmacyPgds).values({ pharmacyId: newPharmacy.id, pgdSlug: s }).onConflictDoNothing()
  }

  // 3. Create the GoCardless subscription with the admin-set fee
  let subscriptionId: string | null = null
  let subscriptionError: string | null = null
  try {
    const sub = await createSubscription({
      mandateId: req.gocardlessMandateId,
      amountPence: monthlyFeePence,
      name: `Get Real Health monthly subscription — ${req.pharmacyName}`,
      metadata: {
        pharmacy_id: newPharmacy.id,
        onboarding_id: req.id,
      },
    })
    subscriptionId = sub.id
  } catch (e) {
    subscriptionError = e instanceof Error ? e.message : String(e)
    // Don't abort — pharmacy is provisioned, admin can retry the subscription
    // separately. We still mark approved so the customer can set their password.
  }

  // 4. Mark approved. The login is created now, not when a link is clicked:
  //    Burrage Pharmacy (Sep 2026) was approved and billed with a setup email
  //    that never arrived, and there was no account for anything to reset.
  await db
    .update(onboardingRequests)
    .set({
      status: 'approved',
      approvedBy: session.user.id,
      approvedAt: new Date(),
      pharmacyId: newPharmacy.id,
      monthlyFeePence,
      gocardlessSubscriptionId: subscriptionId,
      updatedAt: new Date(),
    })
    .where(eq(onboardingRequests.id, req.id))

  const forSetup = { ...req, pharmacyId: newPharmacy.id }
  const user = await ensureFirstUser(forSetup)
  if (!user) {
    return NextResponse.json({ error: 'Pharmacy created but the first user could not be: contact email missing.' }, { status: 500 })
  }

  // 5. Email the contact the set-password link; the outcome is stored on the
  //    request so the queue shows "sent" or the error, with a Resend button.
  const { setupUrl, emailed, emailError } = await sendSetupEmail(forSetup, user, 'welcome')

  return NextResponse.json({
    ok: true,
    pharmacyId: newPharmacy.id,
    setupUrl,
    emailed,
    emailError,
    subscriptionId,
    subscriptionError,
  })
}
