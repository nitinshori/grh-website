import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One-shot migration endpoint to create the voice_calls table.
 *
 * Hit this once after deployment, then DELETE the file. Protected by
 * a setup secret to avoid drive-by execution.
 *
 * Usage:
 *   curl -X POST https://getrealhealthpgd.co.uk/api/setup-voice \
 *        -H "x-setup-secret: <SETUP_SECRET>"
 */
export async function POST(request: Request) {
  const provided = request.headers.get('x-setup-secret')
  const expected = process.env.SETUP_SECRET || process.env.VAPI_TOOLS_SECRET
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL not configured' },
      { status: 500 }
    )
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS voice_calls (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        vapi_call_id varchar(255) UNIQUE,
        caller_number varchar(50),
        caller_name varchar(255),
        caller_email varchar(255),
        pharmacy_name varchar(255),
        enquiry_type varchar(100),
        summary text,
        transcript text,
        recording_url text,
        duration_seconds integer,
        appointment_booked boolean DEFAULT false NOT NULL,
        appointment_time timestamp,
        calendar_event_id varchar(255),
        status varchar(50),
        started_at timestamp NOT NULL,
        ended_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `

    await sql`
      CREATE INDEX IF NOT EXISTS voice_calls_started_at_idx
        ON voice_calls (started_at DESC);
    `

    return NextResponse.json({
      success: true,
      message:
        'voice_calls table created (or already existed). You can now delete src/app/api/setup-voice/route.ts.',
    })
  } catch (err) {
    console.error('setup-voice failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Migration failed' },
      { status: 500 }
    )
  }
}
