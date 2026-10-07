import { NextResponse } from 'next/server'
import { appointmentsDueReminder, sendBookingReminder } from '@/lib/appointment-emails'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * GET /api/cron/appointment-reminders, daily 08:00 UTC (vercel.json):
 * emails a reminder to every patient with a booked appointment tomorrow
 * (London) who gave an email address. Each appointment is reminded once.
 * Auth: `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  if (request.headers.get('authorization') !== `Bearer ${expected}`) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const due = await appointmentsDueReminder()
  let sent = 0
  const failed: Array<{ id: string; reason: string }> = []
  for (const id of due) {
    const r = await sendBookingReminder(id)
    if (r.ok) sent++
    else if (r.reason !== 'already sent or not booked') failed.push({ id, reason: r.reason })
  }
  if (failed.length) console.error('[appointment-reminders] failures:', failed)
  return NextResponse.json({ ok: true, due: due.length, sent, failed })
}
