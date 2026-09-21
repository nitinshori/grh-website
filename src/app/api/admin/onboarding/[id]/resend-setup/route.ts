import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { ensureFirstUser, sendSetupEmail } from '@/lib/onboarding-setup'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/onboarding/[id]/resend-setup
 * Admin-only. For an approved sign-up whose customer has not yet chosen a
 * password: make sure the user exists (creating it for sign-ups approved
 * before September 2026, when the user was only created at link-click), issue
 * a fresh set-password link and email it. Returns the link too, so the admin
 * can send it by another route if email keeps failing.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const [req] = await db.select().from(onboardingRequests).where(eq(onboardingRequests.id, id)).limit(1)
  if (!req) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (req.status !== 'approved' && req.status !== 'completed') {
    return NextResponse.json({ error: 'Only an approved sign-up can be re-sent a setup link' }, { status: 400 })
  }
  if (!req.pharmacyId || !req.contactEmail) {
    return NextResponse.json({ error: 'No pharmacy or contact email on this sign-up' }, { status: 400 })
  }
  const user = await ensureFirstUser(req)
  if (!user) return NextResponse.json({ error: 'Could not find or create the user' }, { status: 500 })
  const result = await sendSetupEmail(req, user, 'resend')
  return NextResponse.json({ ok: true, ...result })
}
