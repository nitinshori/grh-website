import { NextResponse } from 'next/server'
import { createAppointment, getAvailability } from '@/lib/google-calendar'
import { verifyVapiToolsSecret } from '@/lib/vapi'
import { sendEmail, escapeHtml } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3 // max bookings per minute
const RATE_WINDOW = 60_000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimiter.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

interface BookArgs {
  callerName?: string
  callerEmail?: string
  callerPhone?: string
  pharmacyName?: string
  startTime?: string
  notes?: string
}

interface ToolRequestBody {
  message?: {
    toolCalls?: Array<{
      id?: string
      function?: {
        name?: string
        arguments?: BookArgs | string
      }
    }>
  }
  // direct invocation
  callerName?: string
  callerEmail?: string
  callerPhone?: string
  pharmacyName?: string
  startTime?: string
  notes?: string
}

export async function POST(request: Request) {
  if (!verifyVapiToolsSecret(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many booking requests. Please try again shortly.' }, { status: 429 })
  }

  let body: ToolRequestBody = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // Resolve args from Vapi shape or direct shape
  const toolCall = body.message?.toolCalls?.[0]
  let args: BookArgs = {}
  if (toolCall?.function?.arguments) {
    try {
      args =
        typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments
    } catch {
      const message = 'Invalid tool call arguments format'
      if (toolCall?.id) {
        return NextResponse.json({ results: [{ toolCallId: toolCall.id, error: message }] })
      }
      return NextResponse.json({ error: message }, { status: 400 })
    }
  } else {
    args = {
      callerName: body.callerName,
      callerEmail: body.callerEmail,
      callerPhone: body.callerPhone,
      pharmacyName: body.pharmacyName,
      startTime: body.startTime,
      notes: body.notes,
    }
  }

  if (!args.callerName || !args.startTime) {
    const message = 'callerName and startTime are required'
    if (toolCall?.id) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall.id, error: message }],
      })
    }
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Validate startTime is a valid ISO date
  const requestedStart = new Date(args.startTime)
  if (isNaN(requestedStart.getTime())) {
    const message = 'startTime must be a valid ISO date string'
    if (toolCall?.id) {
      return NextResponse.json({ results: [{ toolCallId: toolCall.id, error: message }] })
    }
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Validate startTime is in the future (at least 30 minutes ahead)
  const now = new Date()
  if (requestedStart.getTime() < now.getTime() + 30 * 60 * 1000) {
    const message = 'Appointment must be at least 30 minutes in the future'
    if (toolCall?.id) {
      return NextResponse.json({ results: [{ toolCallId: toolCall.id, error: message }] })
    }
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Re-validate against the offered-slot map. This implicitly covers
  // working-hours, weekend, and per-day-override rules — getAvailability()
  // only ever returns slots that the website itself would offer.
  try {
    const slotEnd = new Date(requestedStart.getTime() + 35 * 60 * 1000) // check 35 min window
    const freeSlots = await getAvailability(
      new Date(requestedStart.getTime() - 5 * 60 * 1000),
      slotEnd,
      10
    )
    const isStillFree = freeSlots.some(s => {
      const slotTime = new Date(s.start).getTime()
      return Math.abs(slotTime - requestedStart.getTime()) < 5 * 60 * 1000
    })
    if (!isStillFree) {
      const message = 'Sorry, that time slot is no longer available. Please check availability again.'
      if (toolCall?.id) {
        return NextResponse.json({ results: [{ toolCallId: toolCall.id, error: message }] })
      }
      return NextResponse.json({ error: message }, { status: 409 })
    }
  } catch (availErr) {
    console.error('Availability re-check failed:', availErr)
    // Continue anyway — better to book than to block entirely
  }

  try {
    const titleParts = [args.callerName]
    if (args.pharmacyName) titleParts.push(`(${args.pharmacyName})`)
    const summary = `Demo call: ${titleParts.join(' ')}`

    const description = [
      `Booked via AI receptionist`,
      args.pharmacyName ? `Pharmacy: ${args.pharmacyName}` : null,
      args.callerPhone ? `Phone: ${args.callerPhone}` : null,
      args.callerEmail ? `Email: ${args.callerEmail}` : null,
      args.notes ? `\nNotes:\n${args.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const event = await createAppointment({
      summary,
      description,
      startTime: args.startTime,
      durationMinutes: 30,
      attendeeEmail: args.callerEmail,
      attendeeName: args.callerName,
    })

    // Optional: send a confirmation email to Dr Shori
    try {
      const notify = process.env.VOICE_NOTIFY_EMAIL
      if (!notify) {
        console.warn('VOICE_NOTIFY_EMAIL not set — skipping notification')
        throw new Error('skip')
      }
      await sendEmail({
        to: notify,
        subject: `Appointment booked via AI: ${args.callerName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #25b4b4; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 18px;">New appointment booked</h1>
            </div>
            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p><strong>${escapeHtml(args.callerName)}</strong>${args.pharmacyName ? ` from ${escapeHtml(args.pharmacyName)}` : ''}</p>
              <p>Start: ${escapeHtml(formatTime(event.startTime))}</p>
              ${args.callerEmail ? `<p>Email: <a href="mailto:${escapeHtml(args.callerEmail)}">${escapeHtml(args.callerEmail)}</a></p>` : ''}
              ${args.callerPhone ? `<p>Phone: ${escapeHtml(args.callerPhone)}</p>` : ''}
              ${event.htmlLink ? `<p><a href="${escapeHtml(event.htmlLink)}" style="display:inline-block;background-color:#25b4b4;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open in Google Calendar</a></p>` : ''}
            </div>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Booking notification email failed:', emailErr)
    }

    const result = {
      success: true,
      eventId: event.eventId,
      startTime: event.startTime,
      endTime: event.endTime,
      htmlLink: event.htmlLink,
      speakable: `Booked for ${formatTime(event.startTime)}.`,
    }

    if (toolCall?.id) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall.id, result }],
      })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('Booking tool failed:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (toolCall?.id) {
      return NextResponse.json({
        results: [{ toolCallId: toolCall.id, error: message }],
      })
    }
    return NextResponse.json({ error: message }, { status: 500 })
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
