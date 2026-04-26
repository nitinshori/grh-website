import { NextResponse } from 'next/server'
import { createAppointment } from '@/lib/google-calendar'
import { sendEmail, escapeHtml } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BookingRequest {
  name: string
  email: string
  phone?: string
  pharmacyName?: string
  startTime: string
  notes?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: Partial<BookingRequest> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, phone, pharmacyName, startTime, notes } = body

  // Validate required fields
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (!email?.trim() || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }
  if (!startTime) {
    return NextResponse.json({ error: 'Start time is required' }, { status: 400 })
  }

  // Validate the startTime is a valid future date
  const start = new Date(startTime)
  if (isNaN(start.getTime()) || start < new Date()) {
    return NextResponse.json({ error: 'Please select a valid future time slot' }, { status: 400 })
  }

  try {
    const titleParts = [name.trim()]
    if (pharmacyName?.trim()) titleParts.push(`(${pharmacyName.trim()})`)
    const summary = `Discovery call: ${titleParts.join(' ')}`

    const description = [
      'Booked via getrealhealthpgd.co.uk',
      pharmacyName?.trim() ? `Pharmacy: ${pharmacyName.trim()}` : null,
      phone?.trim() ? `Phone: ${phone.trim()}` : null,
      email.trim() ? `Email: ${email.trim()}` : null,
      notes?.trim() ? `\nNotes:\n${notes.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const event = await createAppointment({
      summary,
      description,
      startTime,
      durationMinutes: 30,
      attendeeEmail: email.trim(),
      attendeeName: name.trim(),
    })

    const formattedTime = formatTime(event.startTime)

    // Send confirmation email to the booker
    try {
      await sendEmail({
        to: email.trim(),
        subject: 'Your discovery call with Get Real Health is confirmed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #25b4b4; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">Discovery Call Confirmed</h1>
            </div>
            <div style="background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Hi ${escapeHtml(name.trim())},</p>
              <p>Your 30-minute discovery call with Get Real Health has been booked.</p>
              <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 6px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0 0 4px 0; font-weight: bold; color: #134e4a;">${escapeHtml(formattedTime)}</p>
                <p style="margin: 0; color: #5f6b7a; font-size: 14px;">30 minutes &middot; UK time</p>
              </div>
              <p>You should also receive a Google Calendar invitation. Nitin Shori, GRH&rsquo;s founder, will walk you through the platform, answer any questions, and help you find the right plan for your pharmacy.</p>
              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">Need to reschedule? Just reply to this email or call us.</p>
            </div>
            <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 16px;">Get Real Health &middot; getrealhealthpgd.co.uk</p>
          </div>
        `,
        replyTo: 'nitin@getrealhealthpgd.co.uk',
      })
    } catch (emailErr) {
      console.error('Booking confirmation email failed:', emailErr)
    }

    // Send admin notification
    try {
      const notify = process.env.VOICE_NOTIFY_EMAIL
      if (!notify) {
        console.error('VOICE_NOTIFY_EMAIL env var is not set — skipping admin notification')
      } else {
      await sendEmail({
        to: notify,
        subject: `New booking: ${name.trim()}${pharmacyName?.trim() ? ` (${pharmacyName.trim()})` : ''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #25b4b4; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 18px;">New discovery call booked (website)</h1>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p><strong>${escapeHtml(name.trim())}</strong>${pharmacyName?.trim() ? ` from ${escapeHtml(pharmacyName.trim())}` : ''}</p>
              <p>When: ${escapeHtml(formattedTime)}</p>
              <p>Email: <a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a></p>
              ${phone?.trim() ? `<p>Phone: ${escapeHtml(phone.trim())}</p>` : ''}
              ${notes?.trim() ? `<p>Notes: ${escapeHtml(notes.trim())}</p>` : ''}
              ${event.htmlLink ? `<p style="margin-top: 16px;"><a href="${escapeHtml(event.htmlLink)}" style="display:inline-block;background-color:#25b4b4;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open in Google Calendar</a></p>` : ''}
            </div>
          </div>
        `,
      })
      }
    } catch (emailErr) {
      console.error('Admin booking notification failed:', emailErr)
    }

    return NextResponse.json({
      success: true,
      startTime: event.startTime,
      endTime: event.endTime,
      formattedTime,
    })
  } catch (err) {
    console.error('Booking failed:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Booking failed: ${message}. Please try again or contact us directly.` },
      { status: 500 }
    )
  }
}

function formatTime(iso: string): string {
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
