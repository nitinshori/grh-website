import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { onboardingRequests, pharmacies, pharmacyPgds } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { ALL_PGDS } from '@/lib/pgd-access'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/onboarding/[id]/approve
 * Admin-only. Creates the pharmacy + assigns all 70 PGDs + emails the contact
 * a tokenised "set your password" link. The customer never sees this endpoint
 * directly — they're invited via email after we approve.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const [req] = await db
    .select()
    .from(onboardingRequests)
    .where(eq(onboardingRequests.id, id))
    .limit(1)
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.status === 'approved' || req.status === 'completed') {
    return NextResponse.json({ error: 'Already approved' }, { status: 409 })
  }

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
      email: req.pharmacyEmail || req.contactEmail,
      isActive: true,
    })
    .returning({ id: pharmacies.id })

  // 2. Assign all canonical PGDs
  const slugs = ALL_PGDS.map((p) => p.slug)
  for (const s of slugs) {
    await db.insert(pharmacyPgds).values({ pharmacyId: newPharmacy.id, pgdSlug: s }).onConflictDoNothing()
  }

  // 3. Generate single-use setup token (signed URL)
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = await bcrypt.hash(rawToken, 10)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db
    .update(onboardingRequests)
    .set({
      status: 'approved',
      approvedBy: session.user.id,
      approvedAt: new Date(),
      pharmacyId: newPharmacy.id,
      setupTokenHash: tokenHash,
      setupTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(onboardingRequests.id, req.id))

  // 4. Email the contact with the setup link
  const appUrl = process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
  const setupUrl = `${appUrl}/setup-account?id=${req.id}&token=${rawToken}`
  let emailed = false
  let emailError: string | undefined
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Get Real Health <noreply@getrealhealthpgd.co.uk>',
        to: req.contactEmail,
        subject: `Welcome to Get Real Health — set up your account`,
        text:
          `Hi ${req.contactFirstName},\n\n` +
          `Your application for ${req.pharmacyName} has been approved. ` +
          `Click the link below to set your password and access the Get Real Health PGD platform:\n\n` +
          `${setupUrl}\n\n` +
          `The link expires in 7 days. If it expires, reply to this email and we'll send a new one.\n\n` +
          `— Dr Nitin Shori\nGet Real Health\n`,
      })
      emailed = true
    } catch (e) { emailError = e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json({
    ok: true,
    pharmacyId: newPharmacy.id,
    setupUrl,
    emailed,
    emailError,
  })
}
