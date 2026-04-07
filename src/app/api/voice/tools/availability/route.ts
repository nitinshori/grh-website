import { NextResponse } from 'next/server'
import { getAvailability } from '@/lib/google-calendar'
import { verifyVapiToolsSecret } from '@/lib/vapi'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ToolRequestBody {
  // Vapi sends tool calls under message.toolCalls[].function.arguments
  message?: {
    toolCalls?: Array<{
      id?: string
      function?: {
        name?: string
        arguments?: { daysAhead?: number; date?: string } | string
      }
    }>
  }
  // also accept direct invocation for testing
  daysAhead?: number
  date?: string
}

export async function POST(request: Request) {
  if (!verifyVapiToolsSecret(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ToolRequestBody = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine — defaults
  }

  // Pull args either from Vapi shape or direct shape
  const toolCall = body.message?.toolCalls?.[0]
  let args: { daysAhead?: number; date?: string } = {}
  if (toolCall?.function?.arguments) {
    args =
      typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments
  } else {
    args = { daysAhead: body.daysAhead, date: body.date }
  }

  const daysAhead = Math.min(Math.max(args.daysAhead ?? 7, 1), 30)
  const startDate = args.date ? new Date(args.date) : new Date()
  const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  try {
    const slots = await getAvailability(startDate, endDate, 6)

    const speakable = slots.length
      ? slots.map((s) => s.startLabel).join('; ')
      : 'No free slots in the requested range.'

    const result = {
      slots: slots.map((s) => ({
        startTime: s.start,
        endTime: s.end,
        label: s.startLabel,
      })),
      speakable,
    }

    // If invoked as a Vapi tool call, wrap in the expected response shape
    if (toolCall?.id) {
      return NextResponse.json({
        results: [
          {
            toolCallId: toolCall.id,
            result,
          },
        ],
      })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Availability tool failed:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (toolCall?.id) {
      return NextResponse.json({
        results: [
          {
            toolCallId: toolCall.id,
            error: message,
          },
        ],
      })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
