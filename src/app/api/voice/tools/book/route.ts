import { NextResponse } from 'next/server'
import { createAppointment } from '@/lib/google-calendar'
import { verifyVapiToolsSecret } from '@/lib/vapi'
import { sendEmail, escapeHtml } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    args =
      typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments
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
      const notify = process.env.VOICE_NOTIFY_EMAIL || 'nitinshori@me.com'
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
