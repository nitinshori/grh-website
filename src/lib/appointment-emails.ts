import 'server-only'
import { and, eq, gte, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { appointments, appointmentTypes, clinicians, patientInvites, pharmacies } from '@/lib/db/schema'
import { sendEmail, escapeHtml } from '@/lib/email'

/**
 * Patient-facing appointment emails (migration 076): a confirmation when
 * a booking is made with an email address, a reminder the day before,
 * and an invitation a pharmacy sends with its booking link.
 *
 * All are sent from noreply@ in the pharmacy's name, with reply-to the
 * pharmacy's own email so a patient's reply reaches the pharmacy, not us.
 * Nothing clinical goes in them: service name, time, place, phone.
 */

const APP_URL = () => process.env.APP_URL || 'https://getrealhealthpgd.co.uk'
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function whenLondon(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(d)
}

interface ApptForEmail {
  id: string
  startTime: Date
  patientFirstName: string | null
  patientName: string | null
  patientEmail: string | null
  pharmacyName: string
  brandName: string | null
  address: string | null
  phone: string | null
  pharmacyEmail: string | null
  groupSlug: string | null
  typeName: string | null
  clinicianName: string | null
}

async function loadAppointment(id: string): Promise<ApptForEmail | null> {
  const [r] = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      patientFirstName: appointments.patientFirstName,
      patientName: appointments.patientName,
      patientEmail: appointments.patientEmail,
      pharmacyName: pharmacies.name,
      brandName: pharmacies.brandName,
      address: pharmacies.address,
      phone: pharmacies.phone,
      pharmacyEmail: pharmacies.email,
      groupSlug: pharmacies.groupSlug,
      typeName: appointmentTypes.name,
      clinicianName: clinicians.name,
    })
    .from(appointments)
    .innerJoin(pharmacies, eq(pharmacies.id, appointments.pharmacyId))
    .leftJoin(appointmentTypes, eq(appointmentTypes.id, appointments.appointmentTypeId))
    .leftJoin(clinicians, eq(clinicians.id, appointments.clinicianId))
    .where(eq(appointments.id, id))
    .limit(1)
  return r ?? null
}

function footer(a: { pharmacyName: string; brandName: string | null; address: string | null; phone: string | null }): string {
  const name = escapeHtml(a.brandName || a.pharmacyName)
  return `<p style="color:#666;font-size:13px">${name}${a.address ? `, ${escapeHtml(a.address.replace(/\s*\n+\s*/g, ', '))}` : ''}${a.phone ? `. Telephone ${escapeHtml(a.phone)}` : ''}.</p>`
}

function fromFor(a: { pharmacyName: string; brandName: string | null }): string {
  const name = (a.brandName || a.pharmacyName).replace(/[<>"]/g, '').slice(0, 60)
  return `${name} <noreply@getrealhealthpgd.co.uk>`
}

/** Confirmation to the patient. Idempotent: sends once per appointment. */
export async function sendBookingConfirmation(appointmentId: string): Promise<{ ok: true; to: string } | { ok: false; reason: string }> {
  const a = await loadAppointment(appointmentId)
  if (!a) return { ok: false, reason: 'not found' }
  const to = a.patientEmail?.trim() ?? ''
  if (!EMAIL_RE.test(to)) return { ok: false, reason: 'no patient email' }
  // Claim first so two callers cannot both send.
  const [claimed] = await db
    .update(appointments)
    .set({ confirmationSentAt: new Date() })
    .where(and(eq(appointments.id, appointmentId), isNull(appointments.confirmationSentAt)))
    .returning({ id: appointments.id })
  if (!claimed) return { ok: false, reason: 'already sent' }
  const display = a.brandName || a.pharmacyName
  const first = a.patientFirstName || a.patientName?.split(' ')[0] || 'there'
  try {
    await sendEmail({
      from: fromFor(a),
      replyTo: a.pharmacyEmail || undefined,
      to,
      subject: `Your appointment at ${display}: ${whenLondon(a.startTime)}`,
      html:
        `<p>Hello ${escapeHtml(first)},</p>` +
        `<p>Your appointment is booked.</p>` +
        `<p><strong>${escapeHtml(a.typeName || 'Appointment')}</strong><br>${escapeHtml(whenLondon(a.startTime))}<br>${escapeHtml(display)}${a.address ? `, ${escapeHtml(a.address.replace(/\s*\n+\s*/g, ', '))}` : ''}${a.clinicianName ? `<br>With ${escapeHtml(a.clinicianName)}` : ''}</p>` +
        `<p>If you need to change or cancel, please contact the pharmacy${a.phone ? ` on ${escapeHtml(a.phone)}` : ''}${a.pharmacyEmail ? ` or reply to this email` : ''}.</p>` +
        footer(a),
    })
    return { ok: true, to }
  } catch (e) {
    await db.update(appointments).set({ confirmationSentAt: null }).where(eq(appointments.id, appointmentId))
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

/** Reminder to the patient. Idempotent per appointment. */
export async function sendBookingReminder(appointmentId: string): Promise<{ ok: true; to: string } | { ok: false; reason: string }> {
  const a = await loadAppointment(appointmentId)
  if (!a) return { ok: false, reason: 'not found' }
  const to = a.patientEmail?.trim() ?? ''
  if (!EMAIL_RE.test(to)) return { ok: false, reason: 'no patient email' }
  const [claimed] = await db
    .update(appointments)
    .set({ reminderSentAt: new Date() })
    .where(and(eq(appointments.id, appointmentId), isNull(appointments.reminderSentAt), eq(appointments.status, 'booked')))
    .returning({ id: appointments.id })
  if (!claimed) return { ok: false, reason: 'already sent or not booked' }
  const display = a.brandName || a.pharmacyName
  const first = a.patientFirstName || a.patientName?.split(' ')[0] || 'there'
  try {
    await sendEmail({
      from: fromFor(a),
      replyTo: a.pharmacyEmail || undefined,
      to,
      subject: `Reminder: your appointment at ${display} tomorrow, ${whenLondon(a.startTime)}`,
      html:
        `<p>Hello ${escapeHtml(first)},</p>` +
        `<p>A reminder of your appointment tomorrow.</p>` +
        `<p><strong>${escapeHtml(a.typeName || 'Appointment')}</strong><br>${escapeHtml(whenLondon(a.startTime))}<br>${escapeHtml(display)}${a.address ? `, ${escapeHtml(a.address.replace(/\s*\n+\s*/g, ', '))}` : ''}</p>` +
        `<p>If you can no longer make it, please let the pharmacy know${a.phone ? ` on ${escapeHtml(a.phone)}` : ''} so the time can be offered to someone else.</p>` +
        footer(a),
    })
    return { ok: true, to }
  } catch (e) {
    await db.update(appointments).set({ reminderSentAt: null }).where(eq(appointments.id, appointmentId))
    return { ok: false, reason: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Booked appointments starting tomorrow (London) with a patient email and
 * no reminder yet. The daily cron calls this once in the morning.
 */
export async function appointmentsDueReminder(): Promise<string[]> {
  // Tomorrow in London as a date, then its UTC bounds.
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' })
  const todayLondon = fmt.format(new Date())
  const [y, m, d] = todayLondon.split('-').map(Number)
  // Build tomorrow's local midnight bounds via a London offset lookup.
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1))
  const dayAfter = new Date(Date.UTC(y, m - 1, d + 2))
  const offsetMs = (dt: Date) => {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hour12: false, timeZoneName: 'shortOffset' }).formatToParts(dt)
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
    const mm = /GMT([+-]\d+)/.exec(tz)
    return (mm ? Number(mm[1]) : 0) * 3600 * 1000
  }
  const start = new Date(tomorrow.getTime() - offsetMs(tomorrow))
  const end = new Date(dayAfter.getTime() - offsetMs(dayAfter))
  const rows = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(
      eq(appointments.status, 'booked'),
      isNull(appointments.reminderSentAt),
      sql`${appointments.patientEmail} IS NOT NULL AND ${appointments.patientEmail} <> ''`,
      // Online bookings only when the patient ticked the box; staff
      // bookings carry an email only because the patient gave it for this.
      sql`(${appointments.bookedOnline} = false OR ${appointments.emailConfirmation} = true)`,
      gte(appointments.startTime, start),
      lt(appointments.startTime, end),
    ))
  return rows.map((r) => r.id)
}

export interface InviteInput {
  pharmacyId: string
  sentByUserId: string
  toEmail: string
  patientName: string | null
  serviceName: string | null
  message: string | null
}

/** An invitation from the pharmacy with its booking link. Recorded whether or not it sends. */
export async function sendPatientInvite(input: InviteInput): Promise<{ ok: true; to: string; bookingUrl: string } | { ok: false; error: string }> {
  const to = input.toEmail.trim().toLowerCase()
  if (!EMAIL_RE.test(to)) return { ok: false, error: 'Enter a valid email address' }
  const [ph] = await db
    .select({ pharmacyName: pharmacies.name, brandName: pharmacies.brandName, address: pharmacies.address, phone: pharmacies.phone, email: pharmacies.email, groupSlug: pharmacies.groupSlug })
    .from(pharmacies)
    .where(eq(pharmacies.id, input.pharmacyId))
    .limit(1)
  if (!ph) return { ok: false, error: 'Pharmacy not found' }
  if (!ph.groupSlug) return { ok: false, error: 'This pharmacy has no booking page yet; contact Get Real Health' }
  const bookingUrl = `${APP_URL()}/book/${ph.groupSlug}`
  const display = ph.brandName || ph.pharmacyName
  const first = input.patientName?.trim().split(' ')[0] || 'there'
  const service = input.serviceName?.trim() || null
  const note = input.message?.trim() || null
  let error: string | null = null
  try {
    await sendEmail({
      from: fromFor(ph),
      replyTo: ph.email || undefined,
      to,
      subject: service ? `Book your ${service} appointment at ${display}` : `Book an appointment at ${display}`,
      html:
        `<p>Hello ${escapeHtml(first)},</p>` +
        (note ? `<p>${escapeHtml(note).replace(/\n/g, '<br>')}</p>` : `<p>${escapeHtml(display)} would like to invite you to book${service ? ` a ${escapeHtml(service)} appointment` : ' an appointment'}.</p>`) +
        `<p>You can choose a date and time that suits you here:</p>` +
        `<p><a href="${bookingUrl}" style="display:inline-block;padding:10px 18px;background:#13685a;color:#fff;text-decoration:none;border-radius:6px">Book online</a></p>` +
        `<p style="color:#666;font-size:13px">Or copy this link into your browser: ${bookingUrl}</p>` +
        `<p>If you would rather book by phone${ph.phone ? `, call ${escapeHtml(ph.phone)}` : ', call the pharmacy'}.</p>` +
        footer(ph),
    })
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }
  await db.insert(patientInvites).values({
    pharmacyId: input.pharmacyId,
    sentByUserId: input.sentByUserId,
    toEmail: to,
    patientName: input.patientName?.trim().slice(0, 255) || null,
    serviceName: service?.slice(0, 255) || null,
    message: note,
    error,
  })
  if (error) return { ok: false, error: `Could not send: ${error}` }
  return { ok: true, to, bookingUrl }
}
