import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyTurnstile } from '@/lib/turnstile'

// Lazy-init so the build succeeds without the key present locally
let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// Simple in-memory rate limiting
const recentSubmissions = new Map<string, number>()
const RATE_LIMIT_MS = 5 * 60 * 1000 // 5 minutes

const ENQUIRY_LABELS: Record<string, string> = {
  demo: 'Book a Demo',
  pricing: 'Pricing Enquiry',
  'pgd-enquiry': 'PGD Enquiry',
  'patient-enquiry': 'Patient Enquiry',
  other: 'General Enquiry',
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, pharmacyName, enquiryType, message, turnstileToken } = body

    // Captcha gate (no-op if TURNSTILE_SECRET_KEY isn't set)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const captcha = await verifyTurnstile(turnstileToken, ip)
    if (!captcha.ok) {
      return NextResponse.json(
        { error: 'Captcha verification failed', detail: captcha.error },
        { status: 400 }
      )
    }

    // Validation
    if (!name || !email || !enquiryType || !message) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    // Rate limiting
    const normalised = email.toLowerCase().trim()
    const lastSubmission = recentSubmissions.get(normalised)
    if (lastSubmission && Date.now() - lastSubmission < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: 'You have already submitted a form recently. Please wait a few minutes.' },
        { status: 429 }
      )
    }
    recentSubmissions.set(normalised, Date.now())

    // Clean up old entries periodically
    if (recentSubmissions.size > 1000) {
      const cutoff = Date.now() - RATE_LIMIT_MS
      for (const [key, time] of recentSubmissions) {
        if (time < cutoff) recentSubmissions.delete(key)
      }
    }

    const enquiryLabel = ENQUIRY_LABELS[enquiryType] || enquiryType

    // Send notification email to admin
    const resend = getResend()
    await resend.emails.send({
      from: 'Get Real Health <noreply@getrealhealthpgd.co.uk>',
      to: 'hello@getrealhealth.co.uk',
      replyTo: email,
      subject: `New Contact: ${enquiryLabel} from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #25b4b4; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
          </div>
          <div style="background-color: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #374151; width: 140px; vertical-align: top;">Name</td>
                <td style="padding: 8px 12px; color: #111827;">${escapeHtml(name)}</td>
              </tr>
              <tr style="background-color: #ffffff;">
                <td style="padding: 8px 12px; font-weight: bold; color: #374151; vertical-align: top;">Email</td>
                <td style="padding: 8px 12px; color: #111827;"><a href="mailto:${escapeHtml(email)}" style="color: #25b4b4;">${escapeHtml(email)}</a></td>
              </tr>
              ${phone ? `<tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #374151; vertical-align: top;">Phone</td>
                <td style="padding: 8px 12px; color: #111827;">${escapeHtml(phone)}</td>
              </tr>` : ''}
              ${pharmacyName ? `<tr style="background-color: #ffffff;">
                <td style="padding: 8px 12px; font-weight: bold; color: #374151; vertical-align: top;">Pharmacy</td>
                <td style="padding: 8px 12px; color: #111827;">${escapeHtml(pharmacyName)}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 12px; font-weight: bold; color: #374151; vertical-align: top;">Enquiry Type</td>
                <td style="padding: 8px 12px; color: #111827;">${escapeHtml(enquiryLabel)}</td>
              </tr>
              <tr style="background-color: #ffffff;">
                <td style="padding: 8px 12px; font-weight: bold; color: #374151; vertical-align: top;">Message</td>
                <td style="padding: 8px 12px; color: #111827; white-space: pre-wrap;">${escapeHtml(message)}</td>
              </tr>
            </table>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px; text-align: center;">
            Sent from the contact form at getrealhealthpgd.co.uk
          </p>
        </div>
      `,
    })

    // Send auto-reply to the submitter
    const firstName = name.split(' ')[0]
    await resend.emails.send({
      from: 'Get Real Health <noreply@getrealhealthpgd.co.uk>',
      to: email,
      subject: 'Thanks for contacting Get Real Health',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #25b4b4; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Thanks for getting in touch</h1>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; line-height: 1.6;">Hi ${escapeHtml(firstName)},</p>
            <p style="color: #374151; line-height: 1.6;">
              Thank you for contacting Get Real Health. We have received your ${enquiryLabel.toLowerCase()} and will get back to you as soon as possible, usually within 1 business day.
            </p>
            <p style="color: #374151; line-height: 1.6;">
              In the meantime, you can browse our <a href="https://getrealhealthpgd.co.uk/for-pharmacies/pgd-catalogue" style="color: #25b4b4;">PGD catalogue</a> or check out our <a href="https://getrealhealthpgd.co.uk/for-pharmacies/pricing" style="color: #25b4b4;">transparent pricing</a>.
            </p>
            <p style="color: #374151; line-height: 1.6;">
              Best regards,<br/>
              <strong>The Get Real Health Team</strong>
            </p>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px; text-align: center;">
            Get Real Health | getrealhealthpgd.co.uk
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or email us directly at hello@getrealhealth.co.uk.' },
      { status: 500 }
    )
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
