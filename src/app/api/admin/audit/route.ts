import { NextRequest, NextResponse } from 'next/server'
import { desc, sql } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'

/**
 * GET /api/admin/audit?action=login_failed&limit=50&contains=hubrx
 *
 * Recent audit entries, newest first. Super admin only, read only. Added
 * 29 Sep 2026 so a partner's failed SSO sign-ins (recorded by the hubrx-sso
 * provider as action login_failed with the reason) can be read without the
 * Vercel log, which is gone within an hour on the current plan.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const p = req.nextUrl.searchParams
  const action = p.get('action')
  const contains = p.get('contains')
  const limit = Math.min(Number(p.get('limit') ?? 50) || 50, 500)

  const conditions = []
  if (action) conditions.push(sql`${auditLogs.action}::text = ${action}`)
  if (contains) conditions.push(sql`(${auditLogs.details} ILIKE ${'%' + contains + '%'} OR ${auditLogs.userEmail} ILIKE ${'%' + contains + '%'})`)
  const where = conditions.length ? sql.join(conditions, sql` AND `) : undefined

  const rows = await db
    .select({
      id: auditLogs.id,
      createdAt: auditLogs.createdAt,
      action: auditLogs.action,
      userEmail: auditLogs.userEmail,
      userId: auditLogs.userId,
      pharmacyId: auditLogs.pharmacyId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
    })
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)

  return NextResponse.json({ count: rows.length, rows })
}
