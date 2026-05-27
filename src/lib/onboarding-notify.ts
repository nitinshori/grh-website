import "server-only"
import { Resend } from "resend"

interface StepPayload {
  onboardingId: string
  step: 1 | 2 | number
  pharmacyName: string
  pharmacyAddress?: string | null
  pharmacyPostcode?: string | null
  pharmacyEmail?: string | null
  pharmacyPhone?: string | null
  pharmacyGphc?: string | null
  contactFirstName?: string | null
  contactLastName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactRole?: string | null
}

const FALLBACK_TO = "info@getrealhealthpgd.co.uk"
const FROM = "Get Real Health <noreply@getrealhealthpgd.co.uk>"

function esc(str: string | null | undefined): string {
  if (str == null) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Email the admin every time someone advances through /onboard. Fires when a
 * step number increases — never on the same step twice (the caller guards
 * this). The recipient is ADMIN_NOTIFY_EMAIL if set, otherwise info@...
 */
export async function sendOnboardingStepEmail(p: StepPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[onboarding-notify] RESEND_API_KEY not set — skipping email")
    return
  }
  const to = process.env.ADMIN_NOTIFY_EMAIL || FALLBACK_TO
  const appUrl = process.env.APP_URL || "https://getrealhealthpgd.co.uk"

  const stepLabel = p.step === 1 ? "Step 1 — Pharmacy details captured" : p.step === 2 ? "Step 2 — Pharmacist details captured" : `Step ${p.step}`
  const stage = p.step === 1 ? "New lead started onboarding" : "Lead progressed to pharmacist details"
  const subject = `${stage}: ${p.pharmacyName}`

  const adminLink = `${appUrl}/admin/onboarding/${p.onboardingId}`

  const rows: Array<[string, string | null | undefined]> = [
    ["Pharmacy", p.pharmacyName],
    ["Pharmacy GPhC", p.pharmacyGphc],
    ["Pharmacy address", p.pharmacyAddress],
    ["Pharmacy postcode", p.pharmacyPostcode],
    ["Pharmacy phone", p.pharmacyPhone],
    ["Pharmacy email", p.pharmacyEmail],
  ]
  if (p.step >= 2) {
    rows.push(
      ["Contact name", `${p.contactFirstName ?? ""} ${p.contactLastName ?? ""}`.trim() || null],
      ["Contact email", p.contactEmail],
      ["Contact phone", p.contactPhone],
      ["Contact role", p.contactRole],
    )
  }

  const rowsHtml = rows
    .filter(([, v]) => v && String(v).trim() !== "")
    .map(([label, v], i) => `<tr style="background-color: ${i % 2 ? "#ffffff" : "#f9fafb"};"><td style="padding: 6px 10px; font-weight: 600; color: #374151; vertical-align: top; width: 160px;">${esc(label)}</td><td style="padding: 6px 10px; color: #111827;">${esc(v)}</td></tr>`)
    .join("")

  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #14b8a6; padding: 18px 24px; border-radius: 8px 8px 0 0;">
    <p style="color: #ecfdf5; margin: 0 0 4px; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">${esc(stepLabel)}</p>
    <h1 style="color: white; margin: 0; font-size: 19px;">${esc(p.pharmacyName)}</h1>
  </div>
  <div style="background: #ffffff; padding: 16px 0; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">${rowsHtml}</table>
    <div style="padding: 16px 24px;">
      <a href="${esc(adminLink)}" style="display: inline-block; background-color: #14b8a6; color: white; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 13px;">View in admin</a>
      <p style="color: #6b7280; font-size: 11px; margin: 14px 0 0; line-height: 1.5;">${p.step === 1
        ? "They&rsquo;ve only completed page 1 so far. Could still bail. Worth a soft outreach if they don&rsquo;t reach page 3 within a few days."
        : "They&rsquo;ve completed pharmacist details. Next step is GoCardless. If they bail here, follow up &mdash; they&rsquo;re clearly interested."}</p>
    </div>
  </div>
</div>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  })
}
