import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests, type OnboardingBranch } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendOnboardingStepEmail } from '@/lib/onboarding-notify'

export const dynamic = 'force-dynamic'

/**
 * POST /api/onboarding
 *
 * Step-by-step capture from the public /onboard wizard. Called on EVERY
 * Next click (not just at the end) so we don't lose leads who bail mid-flow.
 *
 *   step=1  → pharmacy details (no contact email yet)
 *   step=2  → pharmacist details (contact email arrives now)
 *
 * Body shape:
 *   { id?, step: 1 | 2, pharmacyName, pharmacyAddress, ..., contactFirstName, ..., turnstileToken? }
 *
 * Returns { id, status }.
 *
 * Self-serve, no auth. Captcha only on the first save (step=1 without id).
 * Each save fires an admin email to ADMIN_NOTIFY_EMAIL (or info@getrealhealthpgd.co.uk
 * as a sensible fallback) so the founder sees abandoned-cart leads.
 */
const MAX_BRANCHES = 12

const str = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

/**
 * Extra branches from the wizard (migration 069). The primary pharmacy is
 * in the top-level pharmacy_* fields; these are the others. A branch with
 * no name is dropped rather than rejected, since the wizard shows an empty
 * row the customer may not have used.
 */
function cleanBranches(raw: unknown, primaryName: string): OnboardingBranch[] | { error: string } {
  if (raw == null) return []
  if (!Array.isArray(raw)) return { error: 'Please check your branch list and try again.' }
  if (raw.length > MAX_BRANCHES) return { error: `You can add up to ${MAX_BRANCHES} extra branches here. For a larger group, please email info@getrealhealthpgd.co.uk.` }
  const out: OnboardingBranch[] = []
  const seen = new Set([primaryName.trim().toLowerCase()])
  for (const b of raw) {
    if (!b || typeof b !== 'object') continue
    const o = b as Record<string, unknown>
    const name = str(o.name, 255)
    if (!name || name.length < 2) continue
    const key = name.toLowerCase()
    if (seen.has(key)) return { error: `"${name}" is listed twice; give each branch a distinct name (add the town or road)` }
    seen.add(key)
    const email = str(o.email, 255)?.toLowerCase() ?? null
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: `The email for ${name} does not look right` }
    out.push({
      name,
      gphc: str(o.gphc, 50),
      odsCode: str(o.odsCode, 20),
      address: str(o.address, 500),
      postcode: str(o.postcode, 20),
      phone: str(o.phone, 50),
      email,
    })
  }
  return out
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as
    | (Record<string, unknown> & { step?: number; id?: string; turnstileToken?: string; branches?: unknown })
    | null
  if (!body) return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 })

  const branches = cleanBranches(body.branches, typeof body.pharmacyName === 'string' ? body.pharmacyName : '')
  if (!Array.isArray(branches)) return NextResponse.json({ error: branches.error }, { status: 400 })

  const step = Number(body.step) === 2 ? 2 : 1

  // Captcha only on first save (no id yet)
  if (!body.id) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const captcha = await verifyTurnstile(body.turnstileToken as string | undefined, ip)
    if (!captcha.ok) {
      console.warn('[onboarding] captcha failed:', captcha.error)
      return NextResponse.json(
        { error: 'Please complete the security check and try again.' },
        { status: 400 },
      )
    }
  }

  // Step 1 must have a pharmacy name; step 2 must additionally have contact email + names
  const pharmacyName = (body.pharmacyName as string | undefined)?.trim()
  if (!pharmacyName || pharmacyName.length < 2) {
    return NextResponse.json({ error: 'Please enter the pharmacy name.' }, { status: 400 })
  }

  if (step === 2) {
    // Same rule as the wizard: any non-blank value (a 1-character name is fine).
    const required: Array<[keyof typeof body, string]> = [
      ['contactFirstName', 'Please enter your first name.'],
      ['contactLastName', 'Please enter your last name.'],
      ['contactEmail', 'Please enter your email address.'],
    ]
    for (const [f, message] of required) {
      const v = body[f] as string | undefined
      if (!v || typeof v !== 'string' || v.trim().length < 1) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }
    const email = (body.contactEmail as string).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please check your email address.' }, { status: 400 })
    }
  }

  // ── Resume / create / update ────────────────────────────────────
  // If client sent an id (returning from a previous Next click) and it's a
  // started/dd_pending row, update it. Otherwise create a fresh row.

  let id = body.id as string | undefined
  let existingStep = 0

  if (id) {
    const [existing] = await db
      .select({ id: onboardingRequests.id, status: onboardingRequests.status, step: onboardingRequests.lastStepCompleted })
      .from(onboardingRequests)
      .where(eq(onboardingRequests.id, id))
      .limit(1)
    if (!existing) {
      // Stale id from previous browser session — drop it and create fresh
      id = undefined
    } else if (existing.status === 'rejected' || existing.status === 'completed') {
      return NextResponse.json({ error: 'This sign-up is already closed. Please email info@getrealhealthpgd.co.uk if you need help.' }, { status: 409 })
    } else {
      existingStep = existing.step ?? 0
    }
  }

  const values = {
    pharmacyName: pharmacyName.slice(0, 255),
    pharmacyAddress: (body.pharmacyAddress as string | undefined)?.trim().slice(0, 500) || null,
    pharmacyPostcode: (body.pharmacyPostcode as string | undefined)?.trim().slice(0, 20) || null,
    pharmacyPhone: (body.pharmacyPhone as string | undefined)?.trim().slice(0, 50) || null,
    pharmacyEmail:
      (body.pharmacyEmail as string | undefined)?.trim().toLowerCase().slice(0, 255) || null,
    pharmacyGphc: (body.pharmacyGphc as string | undefined)?.trim().slice(0, 50) || null,
    pharmacyOdsCode: (body.pharmacyOdsCode as string | undefined)?.trim().slice(0, 20) || null,
    contactFirstName:
      (body.contactFirstName as string | undefined)?.trim().slice(0, 100) || null,
    contactLastName: (body.contactLastName as string | undefined)?.trim().slice(0, 100) || null,
    contactEmail:
      (body.contactEmail as string | undefined)?.trim().toLowerCase().slice(0, 255) || null,
    contactPhone: (body.contactPhone as string | undefined)?.trim().slice(0, 50) || null,
    contactGphc: (body.contactGphc as string | undefined)?.trim().slice(0, 50) || null,
    contactRole: (body.contactRole as string | undefined)?.trim().slice(0, 50) || null,
    // Optional. Blank stays blank rather than becoming a placeholder value.
    heardAbout: (body.heardAbout as string | undefined)?.trim().slice(0, 60) || null,
    heardAboutDetail:
      (body.heardAboutDetail as string | undefined)?.trim().slice(0, 500) || null,
    branches,
    groupName: branches.length > 0 ? str(body.groupName, 255) : null,
    lastStepCompleted: Math.max(existingStep, step),
    status: 'started' as const,
    updatedAt: new Date(),
  }

  let savedId = id
  if (id) {
    await db.update(onboardingRequests).set(values).where(eq(onboardingRequests.id, id))
  } else {
    // De-dupe: if the same contact email is mid-flow already, return that row's id
    // so the user resumes instead of creating a parallel draft. Only meaningful
    // at step 2 (when an email is captured).
    if (step === 2 && values.contactEmail) {
      const [dup] = await db
        .select({ id: onboardingRequests.id })
        .from(onboardingRequests)
        .where(
          and(
            eq(onboardingRequests.contactEmail, values.contactEmail),
            // Resume only active drafts, not rejected/completed
            // (drizzle's NOT IN syntax is verbose; status enum compare is fine here)
            eq(onboardingRequests.status, 'started'),
          ),
        )
        .limit(1)
      if (dup) {
        await db.update(onboardingRequests).set(values).where(eq(onboardingRequests.id, dup.id))
        savedId = dup.id
      }
    }

    if (!savedId) {
      const [created] = await db
        .insert(onboardingRequests)
        .values(values)
        .returning({ id: onboardingRequests.id })
      savedId = created.id
    }
  }

  // ── Fire admin notification email (best-effort) ─────────────────
  // Don't block the request if Resend errors. Only email if step number
  // is higher than what we had before (don't double-email on rapid re-saves).
  if (step > existingStep) {
    await sendOnboardingStepEmail({
      onboardingId: savedId!,
      step,
      pharmacyName: values.pharmacyName,
      pharmacyAddress: values.pharmacyAddress,
      pharmacyPostcode: values.pharmacyPostcode,
      pharmacyEmail: values.pharmacyEmail,
      pharmacyPhone: values.pharmacyPhone,
      pharmacyGphc: values.pharmacyGphc,
      contactFirstName: values.contactFirstName,
      contactLastName: values.contactLastName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      contactRole: values.contactRole,
      branchNames: branches.map((b) => b.name),
      groupName: values.groupName,
    }).catch((e) => {
      console.error('[onboarding] admin notify failed (non-fatal):', e)
    })
  }

  return NextResponse.json({ id: savedId, status: 'started', step })
}
