import 'server-only'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { legal } from '@/lib/legal'
import { pdfSafe } from '@/lib/invoice-pdf'
import { MANAGER_DECLARATION, PRACTITIONER_DECLARATION, type TeamMember } from '@/lib/authorisations'

/**
 * The practitioner authorisation register for one branch: for every
 * practitioner, every PGD with its current version, when they signed it,
 * and who countersigned. Multi-page, plain table, for the superintendent's
 * file and for an inspector.
 */

const GREEN = rgb(0.075, 0.42, 0.33)
const GREY = rgb(0.4, 0.4, 0.4)
const BLACK = rgb(0.1, 0.1, 0.1)
const RED = rgb(0.7, 0.1, 0.1)
const AMBER = rgb(0.7, 0.45, 0.05)

function ukDateTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
}

export async function renderAuthorisationRegister(opts: { pharmacyName: string; pharmacyAddress: string | null; members: TeamMember[]; generatedBy: string }): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Practitioner authorisation register: ${pdfSafe(opts.pharmacyName)}`)
  doc.setAuthor(legal.companyName)
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const W = 841.89, H = 595.28 // A4 landscape
  const margin = 40
  const width = W - margin * 2
  let page: PDFPage = doc.addPage([W, H])
  let y = H - margin
  let pageNo = 1
  const generated = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })

  const text = (s: string, x: number, size = 9, font: PDFFont = regular, color = BLACK) => {
    page.drawText(pdfSafe(s), { x, y, size, font, color })
  }
  const clip = (s: string, font: PDFFont, size: number, max: number) => {
    const full = pdfSafe(s)
    let t = full
    while (t && font.widthOfTextAtSize(t + '...', size) > max) t = t.slice(0, -1)
    return t === full ? t : t + '...'
  }
  const footer = () => {
    const f = `${legal.companyName}, company ${legal.companyNumber}. Generated ${generated} by ${opts.generatedBy}. Page ${pageNo}.`
    page.drawText(pdfSafe(f), { x: margin, y: 22, size: 7, font: regular, color: GREY })
  }
  const newPage = () => {
    footer()
    page = doc.addPage([W, H])
    pageNo++
    y = H - margin
  }
  const ensure = (needed: number) => { if (y - needed < 40) newPage() }

  // Title block
  text('Practitioner authorisation register', margin, 16, bold, GREEN)
  y -= 20
  text(opts.pharmacyName, margin, 12, bold)
  y -= 14
  if (opts.pharmacyAddress) { text(opts.pharmacyAddress.replace(/\s*\n+\s*/g, ', '), margin, 9, regular, GREY); y -= 12 }
  y -= 4
  const intro = `Each Patient Group Direction is authorised by ${legal.companyName} (authorising doctor, pharmacist and organisation). This register records, for every practitioner at this pharmacy, the PGDs they have signed to work under, the document version signed, and the manager's countersignature. A signature lapses when the document is reissued and must be renewed. Practitioner declaration: "${PRACTITIONER_DECLARATION}" Manager declaration: "${MANAGER_DECLARATION}"`
  for (const line of wrapText(intro, regular, 8, width)) { text(line, margin, 8, regular, GREY); y -= 10 }
  y -= 8

  // Columns
  const cols = { pgd: margin, ver: margin + 300, state: margin + 360, signed: margin + 450, counter: margin + 580 }
  const header = () => {
    text('PGD', cols.pgd, 8, bold, GREY)
    text('Version', cols.ver, 8, bold, GREY)
    text('Status', cols.state, 8, bold, GREY)
    text('Signed (practitioner)', cols.signed, 8, bold, GREY)
    text('Countersigned (manager)', cols.counter, 8, bold, GREY)
    y -= 4
    page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    y -= 10
  }

  if (opts.members.length === 0) {
    text('No practitioners are registered at this pharmacy yet.', margin, 10)
  }
  for (const m of opts.members) {
    ensure(60)
    y -= 6
    text(`${m.name}${m.gphcNumber ? `, GPhC ${m.gphcNumber}` : ''}`, margin, 11, bold)
    const summary = `${m.counts.signed} signed, ${m.counts.updated} need re-signing after reissue, ${m.counts.unsigned} not signed, ${m.counts.awaitingCountersign} awaiting countersignature`
    const sw = regular.widthOfTextAtSize(summary, 8)
    text(summary, margin + width - sw, 8, regular, GREY)
    y -= 12
    text(`${m.role === 'pharmacy_admin' ? 'Pharmacy admin' : 'Pharmacist'}, home branch ${m.homePharmacyName}${m.alsoWorksAt.length ? `, also works at ${m.alsoWorksAt.join(', ')}` : ''}`, margin, 8, regular, GREY)
    y -= 12
    header()
    for (const r of m.rows) {
      ensure(14)
      text(clip(r.title, regular, 8.5, 290), cols.pgd, 8.5)
      text(r.version.version, cols.ver, 8.5)
      const label = r.state === 'signed' ? 'Signed' : r.state === 'updated' ? `Reissued since ${r.signedVersion}` : 'Not signed'
      text(label, cols.state, 8.5, r.state === 'signed' ? regular : bold, r.state === 'signed' ? BLACK : r.state === 'updated' ? AMBER : RED)
      text(r.state === 'signed' ? ukDateTime(r.signedAt) : '', cols.signed, 8.5)
      text(r.state === 'signed' ? (r.countersignedAt ? `${clip(r.countersignedName ?? '', regular, 8.5, 110)} ${ukDateTime(r.countersignedAt)}` : 'awaiting') : '', cols.counter, 8.5, regular, r.state === 'signed' && !r.countersignedAt ? AMBER : BLACK)
      y -= 12
    }
    y -= 6
  }
  footer()
  return doc.save()
}

function wrapText(s: string, font: PDFFont, size: number, max: number): string[] {
  const out: string[] = []
  let line = ''
  for (const w of pdfSafe(s).split(/\s+/)) {
    const next = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(next, size) <= max) line = next
    else { if (line) out.push(line); line = w }
  }
  if (line) out.push(line)
  return out
}
