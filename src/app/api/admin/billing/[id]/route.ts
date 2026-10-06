import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { applyScheduledFeeChange, cancelBranchBilling, editBranchBilling, retryBranchBilling, uncancelBranchBilling } from '@/lib/billing'
import { audit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/billing/[id]
 *   { monthlyFeePence?, feeChangePence?, feeChangeOn?, notes? }
 *   Edits what one pharmacy pays. A changed monthly fee is pushed to
 *   GoCardless before it is saved.
 *
 * POST /api/admin/billing/[id]?action=apply    apply the scheduled change now
 * POST /api/admin/billing/[id]?action=retry    retry a failed subscription
 * POST /api/admin/billing/[id]?action=cancel   cancel at GoCardless and record it
 * POST /api/admin/billing/[id]?action=uncancel clear the cancellation (then Retry, or invoices resume)
 *
 * Super admin only. Every change is audited.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: 'Bad body' }, { status: 400 })

  const edit: Parameters<typeof editBranchBilling>[1] = {}
  if ('monthlyFeePence' in body) edit.monthlyFeePence = Math.floor(Number(body.monthlyFeePence))
  if ('feeChangePence' in body) edit.feeChangePence = body.feeChangePence == null ? null : Math.floor(Number(body.feeChangePence))
  if ('feeChangeOn' in body) edit.feeChangeOn = body.feeChangeOn == null || body.feeChangeOn === '' ? null : String(body.feeChangeOn)
  if ('notes' in body) edit.notes = body.notes == null ? null : String(body.notes).slice(0, 1000)
  const strOrNull = (v: unknown, max: number) => (v == null || String(v).trim() === '' ? null : String(v).trim().slice(0, max))
  if ('billingName' in body) edit.billingName = strOrNull(body.billingName, 255)
  if ('billingAddress' in body) edit.billingAddress = strOrNull(body.billingAddress, 1000)
  if ('billingEmail' in body) edit.billingEmail = strOrNull(body.billingEmail, 255)
  if ('invoiceFrom' in body) edit.invoiceFrom = strOrNull(body.invoiceFrom, 10)
  if (body.billingMethod === 'direct_debit' || body.billingMethod === 'bank_transfer') edit.billingMethod = body.billingMethod

  const result = await editBranchBilling(id, edit)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  await audit({ action: 'billing_edited', userId: session.user.id, details: { subscriptionRowId: id, ...edit } })
  return NextResponse.json({ ok: true })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const action = request.nextUrl.searchParams.get('action')
  if (action === 'apply') {
    const r = await applyScheduledFeeChange(id)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    await audit({ action: 'billing_fee_change_applied', userId: session.user.id, details: { subscriptionRowId: id, from: r.from, to: r.to, by: 'admin' } })
    return NextResponse.json({ ok: true, from: r.from, to: r.to })
  }
  if (action === 'retry') {
    const r = await retryBranchBilling(id)
    if (r.error) return NextResponse.json({ error: r.error, subscriptionId: r.subscriptionId }, { status: 400 })
    await audit({ action: 'billing_subscription_retried', userId: session.user.id, details: { subscriptionRowId: id, subscriptionId: r.subscriptionId } })
    return NextResponse.json({ ok: true, subscriptionId: r.subscriptionId })
  }
  if (action === 'uncancel') {
    const r = await uncancelBranchBilling(id)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    await audit({ action: 'billing_edited', userId: session.user.id, details: { subscriptionRowId: id, uncancelled: true } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'cancel') {
    const r = await cancelBranchBilling(id)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    await audit({ action: 'billing_cancelled', userId: session.user.id, details: { subscriptionRowId: id } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
