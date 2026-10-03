import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests, pharmacies, pharmacyPgds, users, type OnboardingBranch } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { ALL_PGDS } from '@/lib/pgd-access'
import { ensureFirstUser, sendSetupEmail } from '@/lib/onboarding-setup'
import { isValidFeePence, isValidIsoDate, MAX_FEE_PENCE, MIN_FEE_PENCE, pounds, startBranchBilling, todayLondon } from '@/lib/billing'

export const dynamic = 'force-dynamic'
// A group is N pharmacies, N×70 PGD rows and N GoCardless calls in series.
export const maxDuration = 60

/**
 * POST /api/admin/onboarding/[id]/approve
 * Admin-only. Creates the pharmacy (or every branch of a multi-branch
 * sign-up, all under one group_slug), assigns all PGDs, starts one
 * GoCardless subscription per branch on the customer's single mandate,
 * creates the first user (locked until they choose a password) and emails
 * the contact a tokenised set-password link.
 *
 * Body: {
 *   monthlyFeePence: number        per branch, per month, ex VAT
 *   feeChangePence?: number|null   scheduled change, per branch (e.g. a
 *   feeChangeOn?: 'YYYY-MM-DD'     first-year group rate moving to standard)
 *   feeNote?: string               why, for the billing page
 *   joinGroupSlug?: string         attach to an existing group's slug
 * }
 */

interface ApproveBody {
  monthlyFeePence?: number
  feeChangePence?: number | null
  feeChangeOn?: string | null
  feeNote?: string | null
  /**
   * Attach this sign-up to an existing group instead of starting a new
   * one: the pharmacies.group_slug of a pharmacy already on the platform.
   * For a group whose branches signed up one at a time (Delmergate, 29 Sep
   * 2026, before the multi-branch wizard existed).
   */
  joinGroupSlug?: string | null
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({})) as ApproveBody
  const monthlyFeePence = typeof body.monthlyFeePence === 'number' ? Math.floor(body.monthlyFeePence) : NaN
  if (!isValidFeePence(monthlyFeePence)) {
    return NextResponse.json({ error: `Monthly fee per pharmacy must be between ${pounds(MIN_FEE_PENCE)} and ${pounds(MAX_FEE_PENCE)}` }, { status: 400 })
  }
  const feeChangePence = body.feeChangePence == null ? null : Math.floor(Number(body.feeChangePence))
  const feeChangeOn = body.feeChangeOn == null || body.feeChangeOn === '' ? null : body.feeChangeOn
  if ((feeChangePence == null) !== (feeChangeOn == null)) {
    return NextResponse.json({ error: 'A scheduled fee change needs both a new fee and a date' }, { status: 400 })
  }
  if (feeChangePence != null && !isValidFeePence(feeChangePence)) {
    return NextResponse.json({ error: `Scheduled fee must be between ${pounds(MIN_FEE_PENCE)} and ${pounds(MAX_FEE_PENCE)}` }, { status: 400 })
  }
  if (feeChangeOn != null && (!isValidIsoDate(feeChangeOn) || feeChangeOn <= todayLondon())) {
    return NextResponse.json({ error: 'Scheduled fee change date must be a real future date (YYYY-MM-DD)' }, { status: 400 })
  }
  const feeNote = typeof body.feeNote === 'string' && body.feeNote.trim() ? body.feeNote.trim().slice(0, 1000) : null
  const joinGroupSlug = typeof body.joinGroupSlug === 'string' && body.joinGroupSlug.trim() ? body.joinGroupSlug.trim().toLowerCase() : null
  let joinGroupName: string | null = null
  if (joinGroupSlug) {
    if (!/^[a-z0-9-]{3,100}$/.test(joinGroupSlug)) {
      return NextResponse.json({ error: 'Group slug must be lower-case letters, digits and hyphens' }, { status: 400 })
    }
    const [member] = await db
      .select({ name: pharmacies.name })
      .from(pharmacies)
      .where(eq(pharmacies.groupSlug, joinGroupSlug))
      .limit(1)
    if (!member) return NextResponse.json({ error: `No pharmacy has the group slug "${joinGroupSlug}"; check it on Admin, Billing` }, { status: 400 })
    joinGroupName = member.name
  }

  const [pre] = await db
    .select()
    .from(onboardingRequests)
    .where(eq(onboardingRequests.id, id))
    .limit(1)
  if (!pre) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (pre.status === 'approved' || pre.status === 'completed') {
    return NextResponse.json({ error: 'Already approved' }, { status: 409 })
  }
  if (pre.status !== 'awaiting_approval') {
    return NextResponse.json({ error: `Only a sign-up awaiting approval can be approved (this one is "${pre.status}")` }, { status: 409 })
  }
  if (!pre.gocardlessMandateId) {
    return NextResponse.json({ error: 'No GoCardless mandate on record — direct debit not set up.' }, { status: 400 })
  }
  if (!pre.contactEmail || !pre.contactFirstName) {
    return NextResponse.json(
      { error: 'Onboarding draft is incomplete — contact details missing. The customer has not finished step 2.' },
      { status: 400 },
    )
  }

  // The contact email is customer-typed. If it already belongs to a user at
  // another pharmacy, approving would attach a stranger's account to this
  // sign-up (and, for a group, promote them). Refuse and let the admin sort
  // it out by hand.
  // The one legitimate case: the contact already runs another branch of
  // the group this sign-up is joining. Then no new login is made and no
  // setup email is sent; their existing account already reaches the whole
  // group.
  const [clash] = await db
    .select({ id: users.id, pharmacyId: users.pharmacyId, role: users.role, groupSlug: pharmacies.groupSlug })
    .from(users)
    .leftJoin(pharmacies, eq(pharmacies.id, users.pharmacyId))
    .where(sql`LOWER(${users.email}) = ${pre.contactEmail.trim().toLowerCase()}`)
    .limit(1)
  const contactAlreadyInGroup = !!(clash && joinGroupSlug && clash.groupSlug === joinGroupSlug && (clash.role === 'pharmacist' || clash.role === 'pharmacy_admin'))
  if (clash && !contactAlreadyInGroup && (clash.pharmacyId || clash.role !== 'pharmacist')) {
    return NextResponse.json(
      {
        error: `The contact email ${pre.contactEmail} already belongs to an existing user${clash.pharmacyId ? ' at another pharmacy' : ` with role ${clash.role}`}. Approval refused; resolve the account first${clash.groupSlug ? `, or attach this sign-up to group "${clash.groupSlug}" if it is another branch of theirs` : ''}.`,
        // Lets the queue fill the slug in rather than make the admin type it.
        suggestedGroupSlug: clash.groupSlug && (clash.role === 'pharmacist' || clash.role === 'pharmacy_admin') ? clash.groupSlug : null,
      },
      { status: 409 },
    )
  }

  // Claim the request before anything is created: exactly one approve can
  // flip it from awaiting_approval, so a double click, a second tab or a
  // platform retry gets a 409 instead of a second set of pharmacies and
  // subscriptions on the same mandate.
  const [req] = await db
    .update(onboardingRequests)
    .set({ status: 'approved', approvedBy: session.user.id, approvedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(onboardingRequests.id, id), eq(onboardingRequests.status, 'awaiting_approval')))
    .returning()
  if (!req) return NextResponse.json({ error: 'This sign-up is being approved already' }, { status: 409 })
  if (!req.gocardlessMandateId || !req.contactEmail) {
    return NextResponse.json({ error: 'Sign-up changed underneath us; reload and try again' }, { status: 409 })
  }
  const contactEmail = req.contactEmail
  const mandateId = req.gocardlessMandateId
  const extraBranches: OnboardingBranch[] = Array.isArray(req.branches) ? req.branches : []
  const isGroup = extraBranches.length > 0 || !!joinGroupSlug

  // 1. Create the pharmacy rows. A single site keeps the old behaviour
  //    (group_slug = its own slug). A multi-branch sign-up, or one joining
  //    an existing group, puts every branch under one group slug so the
  //    group overview, shared diary and staff pages work from day one.
  const idTail = req.id.slice(0, 4)
  const groupSlug = joinGroupSlug
    ? joinGroupSlug
    : isGroup
      ? `${slugify(req.groupName || req.pharmacyName)}-${idTail}`
      : `${slugify(req.pharmacyName)}-${idTail}`

  const allBranches: Array<{ name: string; address: string | null; phone: string | null; email: string | null }> = [
    { name: req.pharmacyName, address: req.pharmacyAddress, phone: req.pharmacyPhone, email: req.pharmacyEmail || contactEmail },
    ...extraBranches.map((b) => ({
      name: b.name,
      address: [b.address, b.postcode].filter(Boolean).join(', ') || null,
      phone: b.phone ?? null,
      email: b.email || req.pharmacyEmail || contactEmail,
    })),
  ]

  // Every pharmacy row in one statement: either the whole group exists or
  // none of it does. If this fails nothing has been billed, so the claim is
  // released and the admin can try again.
  let created: Array<{ id: string; name: string }>
  try {
    created = await db
      .insert(pharmacies)
      .values(allBranches.map((b, i) => ({
        name: b.name,
        slug: `${slugify(b.name)}-${idTail}${i > 0 ? `-${i}` : ''}`,
        groupSlug,
        address: b.address,
        phone: b.phone,
        email: b.email,
        isActive: true,
      })))
      .returning({ id: pharmacies.id, name: pharmacies.name })
  } catch (e) {
    await db
      .update(onboardingRequests)
      .set({ status: 'awaiting_approval', approvedBy: null, approvedAt: null, updatedAt: new Date() })
      .where(eq(onboardingRequests.id, req.id))
    return NextResponse.json({ error: `Could not create the pharmacy rows: ${e instanceof Error ? e.message : String(e)}. Nothing was billed; try again.` }, { status: 500 })
  }
  // insert().returning() keeps input order in Postgres for a single VALUES list
  const primary = created[0]

  await db
    .update(onboardingRequests)
    .set({ pharmacyId: primary.id, groupSlug, updatedAt: new Date() })
    .where(eq(onboardingRequests.id, req.id))

  // 2. Assign all canonical PGDs to every branch (one statement per branch)
  const slugs = ALL_PGDS.map((p) => p.slug)
  for (const ph of created) {
    await db.insert(pharmacyPgds).values(slugs.map((s) => ({ pharmacyId: ph.id, pgdSlug: s }))).onConflictDoNothing()
  }

  // 3. One GoCardless subscription per branch, all on the same mandate, at
  //    the admin-set per-branch fee. Failures are recorded, not fatal.
  const billing: Array<{ pharmacyId: string; name: string; subscriptionId: string | null; error: string | null }> = []
  for (const ph of created) {
    const r = await startBranchBilling({
      pharmacyId: ph.id,
      pharmacyName: ph.name,
      onboardingId: req.id,
      mandateId,
      monthlyFeePence,
      feeChangePence,
      feeChangeOn,
      notes: feeNote,
    })
    billing.push({ pharmacyId: ph.id, name: ph.name, ...r })
  }
  const subscriptionErrors = billing.filter((b) => b.error).map((b) => `${b.name}: ${b.error}`)

  // 4. Record what was created against the (already claimed) request. The
  //    login is created now, not when a link is clicked: Burrage Pharmacy
  //    (Sep 2026) was approved and billed with a setup email that never
  //    arrived, and there was no account for anything to reset.
  await db
    .update(onboardingRequests)
    .set({
      pharmacyId: primary.id,
      groupSlug,
      monthlyFeePence,
      feeChangePence,
      feeChangeOn,
      feeNote,
      gocardlessSubscriptionId: billing[0]?.subscriptionId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(onboardingRequests.id, req.id))

  const forSetup = { ...req, pharmacyId: primary.id }

  // Contact already has a login at another branch of this group: nothing
  // to create or email. Their group access covers the new branch.
  if (contactAlreadyInGroup && clash) {
    if (clash.role === 'pharmacist') {
      await db.update(users).set({ role: 'pharmacy_admin', updatedAt: new Date() }).where(eq(users.id, clash.id))
    }
    return NextResponse.json({
      ok: true,
      pharmacyId: primary.id,
      pharmacies: created,
      groupSlug,
      joinedGroup: joinGroupName,
      setupUrl: null,
      emailed: false,
      emailError: null,
      existingUser: true,
      subscriptionId: billing[0]?.subscriptionId ?? null,
      subscriptionError: subscriptionErrors.length ? subscriptionErrors.join('; ') : null,
      billing,
    })
  }

  const user = await ensureFirstUser(forSetup)
  if (!user) {
    return NextResponse.json({ error: 'Pharmacy created but the first user could not be: contact email missing.' }, { status: 500 })
  }
  // The contact on a multi-branch sign-up runs the group (Delmergate's is a
  // business support manager, not a pharmacist): pharmacy_admin gives them
  // the group overview, staff management and every branch's diary.
  // Only a plain pharmacist attached to this group's primary is promoted
  // (the clash check above already refused any other existing account).
  if (isGroup) {
    await db
      .update(users)
      .set({ role: 'pharmacy_admin', updatedAt: new Date() })
      .where(and(eq(users.id, user.id), eq(users.role, 'pharmacist'), eq(users.pharmacyId, primary.id)))
  }

  // 5. Email the contact the set-password link; the outcome is stored on the
  //    request so the queue shows "sent" or the error, with a Resend button.
  const { setupUrl, emailed, emailError } = await sendSetupEmail(forSetup, user, 'welcome')

  return NextResponse.json({
    ok: true,
    pharmacyId: primary.id,
    pharmacies: created,
    groupSlug,
    joinedGroup: joinGroupName,
    setupUrl,
    emailed,
    emailError,
    subscriptionId: billing[0]?.subscriptionId ?? null,
    subscriptionError: subscriptionErrors.length ? subscriptionErrors.join('; ') : null,
    billing,
  })
}
