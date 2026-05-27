import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
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
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as
    | (Record<string, string | number | undefined> & { step?: number; id?: string; turnstileToken?: string })
    | null
  if (!body) return NextResponse.json({ error: 'Bad body' }, { status: 400 })

  const step = Number(body.step) === 2 ? 2 : 1

  // Captcha only on first save (no id yet)
  if (!body.id) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const captcha = await verifyTurnstile(body.turnstileToken as string | undefined, ip)
    if (!captcha.ok) {
      return NextResponse.json(
        { error: 'Captcha verification failed', detail: captcha.error },
        { status: 400 },
      )
    }
  }

  // Step 1 must have a pharmacy name; step 2 must additionally have contact email + names
  const pharmacyName = (body.pharmacyName as string | undefined)?.trim()
  if (!pharmacyName || pharmacyName.length < 2) {
    return NextResponse.json({ error: 'Missing required field: pharmacyName' }, { status: 400 })
  }

  if (step === 2) {
    const required: Array<keyof typeof body> = ['contactFirstName', 'contactLastName', 'contactEmail']
    for (const f of required) {
      const v = body[f] as string | undefined
      if (!v || typeof v !== 'string' || v.trim().length < 2) {
        return NextResponse.json({ error: `Missing required field: ${String(f)}` }, { status: 400 })
      }
    }
    const email = (body.contactEmail as string).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid contact email' }, { status: 400 })
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
      return NextResponse.json({ error: 'This sign-up is already closed' }, { status: 409 })
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
    }).catch((e) => {
      console.error('[onboarding] admin notify failed (non-fatal):', e)
    })
  }

  return NextResponse.json({ id: savedId, status: 'started', step })
}
