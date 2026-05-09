import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { onboardingRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json().catch(() => ({})) as { reason?: string }
  await db
    .update(onboardingRequests)
    .set({
      status: 'rejected',
      rejectedReason: body.reason?.slice(0, 1000) || 'No reason given',
      updatedAt: new Date(),
    })
    .where(eq(onboardingRequests.id, id))
  return NextResponse.json({ ok: true })
}
