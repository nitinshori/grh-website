import { db } from '@/lib/db'
import { auditLogs } from '@/lib/db/schema'

export type AuditAction =
  | 'record_create'
  | 'record_view'
  | 'record_list'
  | 'record_export'
  | 'record_soft_delete'
  | 'record_purge'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'password_change'

export interface AuditEntry {
  pharmacyId?: string | null
  userId?: string | null
  userEmail?: string | null
  action: AuditAction
  recordId?: string | null
  recordCount?: number | null
  details?: Record<string, unknown> | null
  request?: Request | null
}

/**
 * Write an immutable audit log entry. Errors are swallowed so audit failure
 * never blocks the user-facing request, but they are logged to the console
 * for ops to pick up.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    let ipAddress: string | null = null
    let userAgent: string | null = null
    if (entry.request) {
      // Trust the leftmost IP in the X-Forwarded-For chain when behind Vercel
      ipAddress =
        entry.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        entry.request.headers.get('x-real-ip') ||
        null
      userAgent = entry.request.headers.get('user-agent')?.slice(0, 500) || null
    }

    await db.insert(auditLogs).values({
      pharmacyId: entry.pharmacyId ?? null,
      userId: entry.userId ?? null,
      userEmail: entry.userEmail ?? null,
      action: entry.action,
      recordId: entry.recordId ?? null,
      recordCount: entry.recordCount ?? null,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    })
  } catch (err) {
    // Never fail the parent request because audit failed — log instead
    console.error('[audit] write failed:', err)
  }
}
