import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { voiceCalls } from '@/lib/db/schema'
import { sendEmail, escapeHtml } from '@/lib/email'
import {
  verifyVapiSignature,
  extractCallReport,
  type VapiWebhookPayload,
} from '@/lib/vapi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ENQUIRY_LABELS: Record<string, string> = {
  sales: 'Sales Enquiry',
  demo: 'Demo Request',
  support: 'Support',
  pricing: 'Pricing Enquiry',
  general: 'General Enquiry',
  other: 'General Enquiry',
}

export async function POST(request: Request) {
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Could not read body' }, { status: 400 })
  }

  // Verify Vapi signature
  if (!verifyVapiSignature(rawBody, request.headers)) {
    console.warn('Vapi webhook: signature verification failed')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: VapiWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // We only act on end-of-call reports
  const messageType =
    (payload.message as { type?: string } | undefined)?.type ||
    (payload as { type?: string }).type
  if (messageType && messageType !== 'end-of-call-report' && messageType !== 'call-report') {
    // Ack other message types so Vapi doesn't retry
    return NextResponse.json({ ok: true, ignored: messageType })
  }

  const report = extractCallReport(payload)
  const structured = report.structuredData || {}

  // Build the row
  try {
    const inserted = await db
      .insert(voiceCalls)
      .values({
        vapiCallId: report.vapiCallId || undefined,
        callerNumber: report.callerNumber || undefined,
        callerName: structured.callerName || undefined,
        callerEmail: structured.callerEmail || undefined,
        pharmacyName: structured.pharmacyName || undefined,
        enquiryType: structured.enquiryType || undefined,
        summary: report.summary || undefined,
        transcript: report.transcript || undefined,
        recordingUrl: report.recordingUrl || undefined,
        durationSeconds: report.durationSeconds || undefined,
        appointmentBooked: structured.appointmentBooked === true,
        appointmentTime: structured.appointmentTime
          ? new Date(structured.appointmentTime)
          : undefined,
        status: report.status || 'completed',
        startedAt: report.startedAt || new Date(),
        endedAt: report.endedAt || undefined,
      })
      .onConflictDoNothing({ target: voiceCalls.vapiCallId })
      .returning()

    // Send notification email
    try {
      await sendCallNotificationEmail({
        callerName: structured.callerName,
        callerEmail: structured.callerEmail,
        callerNumber: report.callerNumber,
        pharmacyName: structured.pharmacyName,
        enquiryType: structured.enquiryType,
        summary: report.summary,
        transcript: report.transcript,
        recordingUrl: report.recordingUrl,
        durationSeconds: report.durationSeconds,
        appointmentBooked: structured.appointmentBooked === true,
        appointmentTime: structured.appointmentTime,
      })
    } catch (emailErr) {
      console.error('Vapi webhook: email failed', emailErr)
      // Don't fail the webhook on email errors
    }

    return NextResponse.json({ ok: true, id: inserted[0]?.id })
  } catch (err) {
    console.error('Vapi webhook: db insert failed', err)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}

interface NotificationParams {
  callerName?: string
  callerEmail?: string
  callerNumber?: string | null
  pharmacyName?: string
  enquiryType?: string
  summary?: string | null
  transcript?: string | null
  recordingUrl?: string | null
  durationSeconds?: number | null
  appointmentBooked?: boolean
  appointmentTime?: string
}

async function sendCallNotificationEmail(p: NotificationParams) {
  const notifyEmail = process.env.VOICE_NOTIFY_EMAIL || 'nitinshori@me.com'

  const callerName = p.callerName || 'Unknown caller'
  const pharmacy = p.pharmacyName || ''
  const enquiryLabel = p.enquiryType
    ? ENQUIRY_LABELS[p.enquiryType.toLowerCase()] || p.enquiryType
    : 'Enquiry'

  const subject = pharmacy
    ? `New call: ${enquiryLabel} from ${callerName} (${pharmacy})`
    : `New call: ${enquiryLabel} from ${callerName}`

  const durationLabel = p.durationSeconds
    ? `${Math.floor(p.durationSeconds / 60)}m ${p.durationSeconds % 60}s`
    : '—'

  const appointmentBlock = p.appointmentBooked
    ? `<div style="background-color:#ecfdf5;border:1px solid #10b981;border-radius:6px;padding:12px;margin:16px 0;">
        <strong style="color:#065f46;">✓ Appointment booked</strong>
        ${p.appointmentTime ? `<div style="color:#065f46;font-size:14px;margin-top:4px;">${escapeHtml(formatAppointmentTime(p.appointmentTime))}</div>` : ''}
      </div>`
    : ''

  const recordingBlock = p.recordingUrl
    ? `<p style="margin:16px 0;"><a href="${escapeHtml(p.recordingUrl)}" style="display:inline-block;background-color:#25b4b4;color:#ffffff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">▶ Listen to recording</a></p>`
    : ''

  const transcriptBlock = p.transcript
    ? `<h3 style="color:#374151;margin-top:24px;">Full transcript</h3>
       <pre style="background-color:#f3f4f6;padding:16px;border-radius:6px;white-space:pre-wrap;font-family:'Courier New',monospace;font-size:13px;color:#111827;line-height:1.5;">${escapeHtml(p.transcript)}</pre>`
    : ''

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background-color: #25b4b4; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">New phone call</h1>
        <div style="color: #d1fae5; font-size: 14px; margin-top: 4px;">${escapeHtml(enquiryLabel)} • ${durationLabel}</div>
      </div>
      <div style="background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        ${appointmentBlock}

        <h3 style="color:#374151;margin-top:0;">Caller details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;width:140px;">Name</td><td style="padding:6px 0;color:#111827;">${escapeHtml(callerName)}</td></tr>
          ${p.pharmacyName ? `<tr><td style="padding:6px 0;color:#6b7280;">Pharmacy</td><td style="padding:6px 0;color:#111827;">${escapeHtml(p.pharmacyName)}</td></tr>` : ''}
          ${p.callerNumber ? `<tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;color:#111827;">${escapeHtml(p.callerNumber)}</td></tr>` : ''}
          ${p.callerEmail ? `<tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;color:#111827;"><a href="mailto:${escapeHtml(p.callerEmail)}" style="color:#25b4b4;">${escapeHtml(p.callerEmail)}</a></td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#6b7280;">Enquiry</td><td style="padding:6px 0;color:#111827;">${escapeHtml(enquiryLabel)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Duration</td><td style="padding:6px 0;color:#111827;">${durationLabel}</td></tr>
        </table>

        ${recordingBlock}

        ${p.summary ? `<h3 style="color:#374151;margin-top:24px;">Summary</h3>
        <p style="color:#374151;line-height:1.6;white-space:pre-wrap;">${escapeHtml(p.summary)}</p>` : ''}

        ${transcriptBlock}
      </div>
      <p style="color:#9ca3af;font-size:12px;margin-top:16px;text-align:center;">
        Get Real Health AI Receptionist • <a href="https://getrealhealthpgd.co.uk/admin/voice-calls" style="color:#25b4b4;">View in dashboard</a>
      </p>
    </div>
  `

  const replyTo = p.callerEmail || undefined
  await sendEmail({
    to: notifyEmail,
    subject,
    html,
    replyTo,
  })
}

function formatAppointmentTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}
