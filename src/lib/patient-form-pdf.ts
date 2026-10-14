import 'server-only'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { pdfSafe } from '@/lib/invoice-pdf'
import type { PatientFormConfig } from '@/data/patient-forms'

/**
 * Renders a blank patient form (src/data/patient-forms.ts) as an A4
 * portrait PDF, with the same sections as PatientFormSheet: patient
 * details, Yes / No / Not sure tick boxes, medicines box, consent and
 * signature, and the "For pharmacy use only" box. Flows over as many pages
 * as it needs. Helvetica is WinAnsi only, so every string goes through
 * pdfSafe().
 */

const A4: [number, number] = [595.28, 841.89]
const M = 40 // margin
const W = A4[0] - M * 2
const BLACK = rgb(0, 0, 0)
const GREY = rgb(0.35, 0.35, 0.35)
const LIGHT = rgb(0.75, 0.75, 0.75)

const BOX_COL_W = 44 // width of each answer column
const ANSWER_W = BOX_COL_W * 3
const BOX = 11 // tick box size

export async function renderPatientFormPdf(form: PatientFormConfig): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(pdfSafe(`${form.title}: patient form`))
  doc.setAuthor('Get Real Health')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  let page: PDFPage = doc.addPage(A4)
  let y = A4[1] - M
  const bottom = M + 24 // room for the footer

  const newPage = () => {
    page = doc.addPage(A4)
    y = A4[1] - M
  }
  const ensure = (h: number) => {
    if (y - h < bottom) newPage()
  }

  const wrap = (text: string, f: PDFFont, size: number, maxWidth: number): string[] => {
    const out: string[] = []
    // Split first: pdfSafe() turns newlines into '?'.
    for (const raw of text.split(/\r?\n/)) {
      const words = pdfSafe(raw).split(/\s+/).filter(Boolean)
      let line = ''
      for (let w of words) {
        // A single word wider than the line is broken by characters.
        while (f.widthOfTextAtSize(w, size) > maxWidth && w.length > 1) {
          if (line) {
            out.push(line)
            line = ''
          }
          let n = w.length - 1
          while (n > 1 && f.widthOfTextAtSize(w.slice(0, n), size) > maxWidth) n--
          out.push(w.slice(0, n))
          w = w.slice(n)
        }
        const next = line ? `${line} ${w}` : w
        if (f.widthOfTextAtSize(next, size) <= maxWidth) line = next
        else {
          if (line) out.push(line)
          line = w
        }
      }
      out.push(line)
    }
    return out
  }

  const lineH = (size: number) => size * 1.3

  /** Draw wrapped text at the cursor; returns nothing, moves y down. */
  const para = (text: string, opts: { size?: number; f?: PDFFont; x?: number; width?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const size = opts.size ?? 10
    const f = opts.f ?? font
    const x = opts.x ?? M
    const lines = wrap(text, f, size, opts.width ?? W)
    for (const l of lines) {
      ensure(lineH(size))
      page.drawText(l, { x, y: y - size, size, font: f, color: opts.color ?? BLACK })
      y -= lineH(size)
    }
  }

  const textHeight = (text: string, f: PDFFont, size: number, width: number) => wrap(text, f, size, width).length * lineH(size)

  /** "Label: ______" writing line. */
  const field = (label: string, x: number, width: number, atY: number, size = 10) => {
    const safe = pdfSafe(label)
    page.drawText(safe, { x, y: atY - size - 6, size, font: bold })
    const lx = x + bold.widthOfTextAtSize(safe, size) + 4
    page.drawLine({ start: { x: lx, y: atY - size - 8 }, end: { x: x + width, y: atY - size - 8 }, thickness: 0.6, color: GREY })
  }
  const FIELD_H = 24

  /** A row of fields sharing the width (weights are relative widths). */
  const fieldRow = (items: Array<{ label: string; weight?: number }>, x0 = M, width = W) => {
    ensure(FIELD_H)
    const gap = 14
    const total = items.reduce((s, i) => s + (i.weight ?? 1), 0)
    const usable = width - gap * (items.length - 1)
    let x = x0
    for (const i of items) {
      const w = (usable * (i.weight ?? 1)) / total
      field(i.label, x, w, y)
      x += w + gap
    }
    y -= FIELD_H
  }

  const writingLines = (count: number, x0 = M, width = W) => {
    for (let i = 0; i < count; i++) {
      ensure(22)
      page.drawLine({ start: { x: x0, y: y - 20 }, end: { x: x0 + width, y: y - 20 }, thickness: 0.6, color: GREY })
      y -= 22
    }
  }

  const tickBox = (x: number, topY: number) => {
    page.drawRectangle({ x, y: topY - BOX, width: BOX, height: BOX, borderColor: BLACK, borderWidth: 1.2 })
  }

  const sectionHeading = (text: string, keepWith = 40) => {
    ensure(28 + keepWith)
    y -= 10
    page.drawText(pdfSafe(text), { x: M, y: y - 12, size: 12, font: bold })
    y -= 16
    page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 1.5, color: BLACK })
    y -= 6
  }

  const answerHeader = () => {
    ensure(14)
    const x0 = M + W - ANSWER_W
    ;['Yes', 'No', 'Not sure'].forEach((h, i) => {
      const tw = bold.widthOfTextAtSize(h, 8)
      page.drawText(h, { x: x0 + i * BOX_COL_W + (BOX_COL_W - tw) / 2, y: y - 9, size: 8, font: bold, color: GREY })
    })
    y -= 13
  }

  // ── Header ────────────────────────────────────────────────────────
  fieldRow([{ label: 'Pharmacy:', weight: 2.2 }, { label: 'Date:', weight: 1 }])
  y -= 4
  para(form.title, { size: 18, f: bold })
  y -= 2
  para(`Patient questionnaire. ${form.ageNote}`, { size: 10, f: bold })
  if (form.intro) para(form.intro, { size: 10 })
  para('Tick one box for each question. If you are not sure, tick "Not sure" and the pharmacist will talk it through with you.', { size: 8.5, color: GREY })

  // ── About you ────────────────────────────────────────────────────
  sectionHeading('About you', FIELD_H * 7)
  fieldRow([{ label: 'Full name:' }])
  fieldRow([{ label: 'Date of birth:' }, { label: 'Phone:' }])
  fieldRow([{ label: 'Address:' }])
  fieldRow([{ label: ' ', weight: 2.2 }, { label: 'Postcode:', weight: 1 }])
  fieldRow([{ label: 'Email:' }])
  fieldRow([{ label: 'GP practice:' }])
  fieldRow([{ label: 'NHS number (if known):' }])

  // ── PGD questions ────────────────────────────────────────────────
  let n = 0
  const qWidth = W - ANSWER_W - 10
  for (const section of form.sections) {
    sectionHeading(section.heading)
    if (section.intro) para(section.intro, { size: 8.5, color: GREY })
    const hasYesNo = section.questions.some((q) => q.type !== 'text')
    if (hasYesNo) answerHeader()
    for (const q of section.questions) {
      n += 1
      const qText = `${n}. ${q.text}`
      if (q.type === 'text') {
        const h = textHeight(qText, bold, 10, W) + (q.help ? textHeight(q.help, font, 8.5, W) : 0) + 22 * (q.lines ?? 1) + 6
        ensure(Math.min(h, 200))
        y -= 3
        para(qText, { size: 10, f: bold })
        if (q.help) para(q.help, { size: 8.5, color: GREY })
        writingLines(q.lines ?? 1)
        y -= 3
      } else {
        const h = textHeight(qText, bold, 10, qWidth) + (q.help ? textHeight(q.help, font, 8.5, qWidth) : 0) + 8
        if (y - h < bottom) {
          newPage()
          answerHeader()
        }
        const top = y
        y -= 4
        para(qText, { size: 10, f: bold, width: qWidth })
        if (q.help) para(q.help, { size: 8.5, color: GREY, width: qWidth })
        const x0 = M + W - ANSWER_W
        for (let i = 0; i < 3; i++) tickBox(x0 + i * BOX_COL_W + (BOX_COL_W - BOX) / 2, top - 4)
        y -= 4
        page.drawLine({ start: { x: M, y }, end: { x: M + W, y }, thickness: 0.4, color: LIGHT })
      }
    }
  }

  // ── Medicines ────────────────────────────────────────────────────
  sectionHeading('Medicines you take', 150)
  para('Please list every medicine you take, including ones you buy yourself, herbal remedies, inhalers, injections and contraception.', { size: 8.5, color: GREY })
  {
    const boxH = 4 * 22 + 8
    ensure(boxH + 4)
    const top = y - 2
    page.drawRectangle({ x: M, y: top - boxH, width: W, height: boxH, borderColor: BLACK, borderWidth: 1.5 })
    y = top - 2
    writingLines(4, M + 6, W - 12)
    y = top - boxH - 6
  }
  para('Is there anything else you would like the pharmacist to know?', { size: 10, f: bold })
  writingLines(2)

  // ── Consent ──────────────────────────────────────────────────────
  sectionHeading('Your agreement', textHeight(form.consent, font, 10, W) + FIELD_H + 10)
  para(form.consent, { size: 10 })
  y -= 4
  fieldRow([{ label: 'Signature:', weight: 2.2 }, { label: 'Date:', weight: 1 }])
  if (form.guardianLine) {
    ensure(14 + FIELD_H * 2)
    y -= 4
    para('Parent or guardian (only if the patient is under 16)', { size: 8.5, f: bold })
    fieldRow([{ label: 'Name:' }, { label: 'Relationship:' }])
    fieldRow([{ label: 'Signature:' }, { label: 'Date:' }])
  }
  if (form.under16Note) para(form.under16Note, { size: 8.5, color: GREY })

  // ── For pharmacy use only ────────────────────────────────────────
  // Drawn twice: once to measure (on a scratch page that is then removed),
  // once for real, so the bordered box can be kept on one page.
  const pad = 10
  const inner = W - pad * 2
  const drawPharmacyBox = () => {
    const x0 = M + pad
    para('FOR PHARMACY USE ONLY', { size: 12, f: bold, x: x0, width: inner })
    para('This form does not make the clinical decision. Enter the answers into the ePGD tool, which applies the PGD.', { size: 8.5, color: GREY, x: x0, width: inner })
    y -= 4
    fieldRow([{ label: 'Pharmacist name:' }, { label: 'GPhC number:' }], x0, inner)
    y -= 4
    para('Pharmacist checks', { size: 10, f: bold, x: x0, width: inner })
    for (const c of form.pharmacyChecks) {
      const top = y
      para(c, { size: 9.5, x: x0 + BOX + 8, width: inner - BOX - 8 })
      tickBox(x0, top - 1)
      y -= 3
    }
    y -= 4
    para('Decision', { size: 10, f: bold, x: x0, width: inner })
    const labelsRow = (labels: string[]) => {
      let x = x0
      for (const l of labels) {
        tickBox(x, y - 1)
        page.drawText(pdfSafe(l), { x: x + BOX + 5, y: y - 10, size: 9.5, font })
        x += BOX + 5 + font.widthOfTextAtSize(pdfSafe(l), 9.5) + 18
      }
      y -= 18
    }
    labelsRow([form.isVaccine ? 'Vaccine given' : 'Supplied', 'Referred', 'Not suitable', 'Patient declined'])
    fieldRow([{ label: 'Referred to / reason:' }], x0, inner)
    fieldRow([{ label: 'Product:' }, { label: 'Dose / quantity:' }], x0, inner)
    fieldRow([{ label: 'Batch number:' }, { label: 'Expiry date:' }], x0, inner)
    if (form.isVaccine) {
      page.drawText('Site:', { x: x0, y: y - 10, size: 9.5, font: bold })
      let x = x0 + 32
      for (const l of ['Left upper arm', 'Right upper arm', 'Other: ____________']) {
        tickBox(x, y - 1)
        page.drawText(l, { x: x + BOX + 5, y: y - 10, size: 9.5, font })
        x += BOX + 5 + font.widthOfTextAtSize(l, 9.5) + 18
      }
      y -= 20
    }
    fieldRow([{ label: 'Pharmacist signature:', weight: 2.2 }, { label: 'Date:', weight: 1 }], x0, inner)
    labelsRow(['Entered into the ePGD tool'])
    para(`Questions based on the signed PGD document ${form.pgdDocument}. Get Real Health patient questionnaire.`, { size: 7.5, color: GREY, x: x0, width: inner })
  }

  {
    // Measure on a scratch page with an unlimited cursor.
    const realPage = page
    const realY = y
    const scratch = doc.addPage(A4)
    page = scratch
    y = 100_000
    const startY = y
    drawPharmacyBox()
    const boxH = startY - y + pad * 2
    doc.removePage(doc.getPageCount() - 1)
    page = realPage
    y = realY - 14
    if (boxH <= A4[1] - M - bottom) ensure(boxH)
    const top = y
    y -= pad
    const pageBefore = page
    drawPharmacyBox()
    if (page === pageBefore) {
      page.drawRectangle({ x: M, y: y - pad, width: W, height: top - (y - pad), borderColor: BLACK, borderWidth: 2.2 })
    }
  }

  // ── Footer on every page ─────────────────────────────────────────
  const pages = doc.getPages()
  pages.forEach((p, i) => {
    const t = pdfSafe(`${form.title}: patient questionnaire. Page ${i + 1} of ${pages.length}`)
    p.drawText(t, { x: M, y: M - 14, size: 7.5, font, color: GREY })
  })

  return doc.save()
}
