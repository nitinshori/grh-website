import { Resend } from 'resend'

// Lazy-init so the build succeeds without the key present locally
let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

const DEFAULT_FROM = 'Get Real Health <noreply@getrealhealthpgd.co.uk>'

/**
 * Send a transactional email via Resend.
 * Lazy-initialised so the build doesn't require RESEND_API_KEY.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
  replyTo,
}: SendEmailParams): Promise<{ id: string | undefined }> {
  const resend = getResend()
  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  })

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`)
  }

  return { id: result.data?.id }
}

/**
 * Escape user-supplied strings before embedding in HTML email templates.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
