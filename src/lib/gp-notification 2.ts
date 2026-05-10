/**
 * GP-notification email. Sends a one-page consultation summary to the
 * patient's GP practice address using Resend. No-op if RESEND_API_KEY is
 * not configured. Errors are swallowed — we never block the pharmacist's
 * save on a failed notification.
 */

interface GpNotificationInput {
  to: string
  patientFirstName: string
  patientLastName: string
  patientDob: string
  patientNhsNumber?: string | null
  pgdTitle: string
  outcome: string
  medicineSupplied?: string | null
  medicineDose?: string | null
  medicineDuration?: string | null
  consultationDate: Date
  pharmacistName: string
  pharmacistGphc: string
  pharmacyName: string
  pharmacyAddress: string
  clinicalNotes?: string
}

export async function sendGpNotification(data: GpNotificationInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  // Validate email shape
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to)) {
    return { ok: false, error: 'Invalid GP email' }
  }

  const dateStr = data.consultationDate.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const subject = `Pharmacy consultation summary — ${data.patientFirstName} ${data.patientLastName} (DOB ${data.patientDob})`

  const html = `<!DOCTYPE html>
<html><body style="font-family: -apple-system, system-ui, sans-serif; line-height: 1.5; color: #111; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h2 style="margin:0 0 16px 0; color: #0d4f4f;">Community pharmacy consultation summary</h2>
  <p style="margin:0 0 16px 0; color:#555;">This summary is sent at the patient's request to keep their GP record up to date. No reply is required unless you have clinical concerns.</p>

  <h3 style="margin:24px 0 8px 0; color: #0d4f4f; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Patient</h3>
  <table style="width:100%; border-collapse:collapse; font-size:14px;">
    <tr><td style="padding:4px 0; color:#666; width:160px;">Name</td><td><strong>${escapeHtml(data.patientFirstName)} ${escapeHtml(data.patientLastName)}</strong></td></tr>
    <tr><td style="padding:4px 0; color:#666;">Date of birth</td><td>${escapeHtml(data.patientDob)}</td></tr>
    ${data.patientNhsNumber ? `<tr><td style="padding:4px 0; color:#666;">NHS number</td><td>${escapeHtml(data.patientNhsNumber)}</td></tr>` : ''}
  </table>

  <h3 style="margin:24px 0 8px 0; color: #0d4f4f; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Consultation</h3>
  <table style="width:100%; border-collapse:collapse; font-size:14px;">
    <tr><td style="padding:4px 0; color:#666; width:160px;">PGD</td><td>${escapeHtml(data.pgdTitle)}</td></tr>
    <tr><td style="padding:4px 0; color:#666;">Date</td><td>${escapeHtml(dateStr)}</td></tr>
    <tr><td style="padding:4px 0; color:#666;">Outcome</td><td><strong>${escapeHtml(data.outcome.replace(/_/g, ' '))}</strong></td></tr>
    ${data.medicineSupplied ? `<tr><td style="padding:4px 0; color:#666;">Medicine supplied</td><td>${escapeHtml(data.medicineSupplied)}${data.medicineDose ? ` — ${escapeHtml(data.medicineDose)}` : ''}${data.medicineDuration ? `, ${escapeHtml(data.medicineDuration)}` : ''}</td></tr>` : ''}
  </table>

  ${data.clinicalNotes ? `<h3 style="margin:24px 0 8px 0; color: #0d4f4f; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Pharmacist's notes</h3>
  <p style="margin:0; padding:12px; background:#f5f7f7; border-radius:6px; font-size:14px;">${escapeHtml(data.clinicalNotes)}</p>` : ''}

  <h3 style="margin:24px 0 8px 0; color: #0d4f4f; font-size:14px; text-transform:uppercase; letter-spacing:0.5px;">Pharmacist</h3>
  <table style="width:100%; border-collapse:collapse; font-size:14px;">
    <tr><td style="padding:4px 0; color:#666; width:160px;">Name</td><td>${escapeHtml(data.pharmacistName)}</td></tr>
    <tr><td style="padding:4px 0; color:#666;">GPhC</td><td>${escapeHtml(data.pharmacistGphc)}</td></tr>
    <tr><td style="padding:4px 0; color:#666;">Pharmacy</td><td>${escapeHtml(data.pharmacyName)}</td></tr>
    <tr><td style="padding:4px 0; color:#666;">Address</td><td>${escapeHtml(data.pharmacyAddress)}</td></tr>
  </table>

  <p style="margin:32px 0 0 0; padding-top:16px; border-top:1px solid #eee; color:#888; font-size:12px;">
    Sent via Get Real Health PGD platform with the patient's explicit consent. If you believe this email was sent in error or no longer wish to receive these notifications, please contact the pharmacy at the address above.
  </p>
</body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Get Real Health <noreply@getrealhealthpgd.co.uk>',
        to: data.to,
        subject,
        html,
        replyTo: undefined,
      }),
    })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return { ok: false, error: `Resend ${res.status}: ${errText.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
