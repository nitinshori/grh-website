import crypto from 'crypto'

// ── Vapi webhook payload types ──────────────────────────────────
//
// These are intentionally permissive — Vapi's payload shape changes
// occasionally and we only care about the fields we use.

export interface VapiToolCall {
  id?: string
  name?: string
  arguments?: Record<string, unknown>
}

export interface VapiTranscriptMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  message?: string
  content?: string
  time?: number
}

export interface VapiCallObject {
  id?: string
  status?: string
  startedAt?: string
  endedAt?: string
  customer?: {
    number?: string
    name?: string
  }
  phoneNumber?: {
    number?: string
  }
}

export interface VapiArtifact {
  transcript?: string
  messages?: VapiTranscriptMessage[]
  recordingUrl?: string
  recording?: { url?: string }
}

export interface VapiAnalysis {
  summary?: string
  structuredData?: {
    callerName?: string
    callerEmail?: string
    pharmacyName?: string
    enquiryType?: string
    appointmentBooked?: boolean
    appointmentTime?: string
    [key: string]: unknown
  }
  successEvaluation?: string | boolean
}

export interface VapiEndOfCallReport {
  type?: string
  call?: VapiCallObject
  artifact?: VapiArtifact
  analysis?: VapiAnalysis
  durationSeconds?: number
  durationMinutes?: number
  endedReason?: string
  recordingUrl?: string
  transcript?: string
  summary?: string
  startedAt?: string
  endedAt?: string
}

export interface VapiWebhookPayload {
  message?: VapiEndOfCallReport
  // Sometimes Vapi nests things differently — keep it open
  [key: string]: unknown
}

// ── Signature verification ──────────────────────────────────────
//
// Vapi signs outbound webhooks using a shared secret. The secret is
// passed in the `x-vapi-secret` header (or as an HMAC depending on
// configuration). We support both: a simple shared-secret check and
// an HMAC SHA256 check on the raw body.

/**
 * Verify a Vapi webhook signature.
 *
 * Modes:
 *   - Simple shared secret: compares `x-vapi-secret` header to env value.
 *   - HMAC: compares hex digest of HMAC-SHA256(body, secret) to
 *     `x-vapi-signature` header.
 *
 * Returns true if either method validates.
 */
export function verifyVapiSignature(
  rawBody: string,
  headers: Headers
): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET
  if (!secret) {
    // If no secret is configured, deny by default in production
    return process.env.NODE_ENV !== 'production'
  }

  // 1. Simple shared secret header
  const sharedHeader = headers.get('x-vapi-secret') || headers.get('x-vapi-signature-secret')
  if (sharedHeader && timingSafeEqualString(sharedHeader, secret)) {
    return true
  }

  // 2. HMAC signature header
  const signature = headers.get('x-vapi-signature')
  if (signature) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex')
    if (timingSafeEqualString(signature, expected)) {
      return true
    }
  }

  return false
}

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Verify the shared secret for Vapi tool endpoints.
 * Tool endpoints (availability, book) use a separate secret because
 * they're called mid-call and don't include a signature.
 */
export function verifyVapiToolsSecret(headers: Headers): boolean {
  const secret = process.env.VAPI_TOOLS_SECRET
  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }
  const provided =
    headers.get('x-vapi-tools-secret') ||
    headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!provided) return false
  return timingSafeEqualString(provided, secret)
}

// ── Helpers for parsing the report ──────────────────────────────

/**
 * Extract the most useful fields from a Vapi end-of-call report,
 * regardless of whether they sit at the top level or under `message`.
 */
export function extractCallReport(payload: VapiWebhookPayload): {
  vapiCallId: string | null
  callerNumber: string | null
  durationSeconds: number | null
  recordingUrl: string | null
  transcript: string | null
  summary: string | null
  structuredData: VapiAnalysis['structuredData'] | null
  startedAt: Date | null
  endedAt: Date | null
  status: string | null
} {
  const msg: VapiEndOfCallReport =
    (payload.message as VapiEndOfCallReport | undefined) ||
    (payload as unknown as VapiEndOfCallReport)

  const call = msg.call || {}
  const artifact = msg.artifact || {}
  const analysis = msg.analysis || {}

  const recordingUrl =
    msg.recordingUrl || artifact.recordingUrl || artifact.recording?.url || null

  const transcript = msg.transcript || artifact.transcript || formatMessages(artifact.messages)

  const summary = msg.summary || analysis.summary || null

  const startedAtStr = msg.startedAt || call.startedAt || null
  const endedAtStr = msg.endedAt || call.endedAt || null

  let durationSeconds: number | null = null
  if (typeof msg.durationSeconds === 'number') {
    durationSeconds = msg.durationSeconds
  } else if (typeof msg.durationMinutes === 'number') {
    durationSeconds = Math.round(msg.durationMinutes * 60)
  } else if (startedAtStr && endedAtStr) {
    const diff = new Date(endedAtStr).getTime() - new Date(startedAtStr).getTime()
    if (!isNaN(diff)) durationSeconds = Math.round(diff / 1000)
  }

  return {
    vapiCallId: call.id || null,
    callerNumber: call.customer?.number || null,
    durationSeconds,
    recordingUrl,
    transcript: transcript || null,
    summary,
    structuredData: analysis.structuredData || null,
    startedAt: startedAtStr ? new Date(startedAtStr) : null,
    endedAt: endedAtStr ? new Date(endedAtStr) : null,
    status: call.status || msg.endedReason || null,
  }
}

function formatMessages(messages?: VapiTranscriptMessage[]): string | null {
  if (!messages || messages.length === 0) return null
  return messages
    .map((m) => {
      const speaker = m.role === 'assistant' ? 'AI' : m.role === 'user' ? 'Caller' : m.role
      const text = m.message || m.content || ''
      return `${speaker}: ${text}`
    })
    .join('\n')
}
