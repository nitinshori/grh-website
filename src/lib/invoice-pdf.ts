import 'server-only'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { legal } from '@/lib/legal'

/**
 * Renders an invoice as a single A4 PDF with pdf-lib (pure JS, runs on
 * Vercel functions without a browser). Layout is deliberately plain: an
 * accounts department wants the number, the dates, who it is to, the
 * amount and how to pay, nothing else.
 *
 * No VAT line: Get Real Health Limited is not VAT registered (6 Oct 2026).
 * If that changes, add VAT here and in src/lib/invoices.ts together.
 */

export interface InvoicePdfInput {
  invoiceNumber: string
  issuedOn: string // YYYY-MM-DD
  dueOn: string
  periodStart: string
  periodEnd: string
  billToName: string
  billToAddress: string | null
  billToEmail: string | null
  pharmacyName: string
  description: string
  amountPence: number
  paymentMethod: 'direct_debit' | 'bank_transfer'
  status: 'issued' | 'paid' | 'void'
  paidAt: string | null // ISO datetime
  /** Charge date GoCardless will collect on, when known. */
  collectionDate?: string | null
}

const GREEN = rgb(0.075, 0.42, 0.33)
const GREY = rgb(0.4, 0.4, 0.4)
const BLACK = rgb(0.1, 0.1, 0.1)

export function gbp(pence: number): string {
  return '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function longDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) return iso
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Bank details for transfer invoices, set by Nitin in Vercel, never in code. */
export function bankDetailsLines(): string[] {
  const raw = process.env.INVOICE_BANK_DETAILS?.trim()
  if (!raw) return ['Bank details: please email info@getrealhealthpgd.co.uk and we will send them.']
  // Stored as "Account name: X; Sort code: 00-00-00; Account number: 12345678"
  return raw.split(/\s*;\s*|\n/).map((s) => s.trim()).filter(Boolean)
}

/**
 * The standard Helvetica can only encode WinAnsi. Anything else (Welsh
 * ŵ, a pasted zero-width space, an emoji in a trading name) would throw
 * from drawText and take the whole invoice run down, so strip accents
 * where possible and replace the rest.
 */
export function pdfSafe(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[​-‏⁠﻿]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number, maxLines = 12): string[] {
  const out: string[] = []
  for (const para of pdfSafe(text).split('\n')) {
    if (out.length >= maxLines) break
    const words = para.split(/\s+/).filter(Boolean)
    let line = ''
    for (const w of words) {
      const next = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next
      else { if (line) out.push(line); line = w }
    }
    // A single word wider than the column is cut rather than drawn off-page.
    while (line && font.widthOfTextAtSize(line, size) > maxWidth) line = line.slice(0, -1)
    out.push(line)
  }
  return out.slice(0, maxLines)
}

export async function renderInvoicePdf(inv: InvoicePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Invoice ${inv.invoiceNumber}`)
  doc.setAuthor(legal.companyName)
  const page = doc.addPage([595.28, 841.89]) // A4 portrait, points
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const margin = 50
  const width = page.getWidth() - margin * 2
  let y = page.getHeight() - margin

  const text = (s: string, x: number, size = 10, font: PDFFont = regular, color = BLACK) => {
    page.drawText(pdfSafe(s), { x, y, size, font, color })
  }
  const para = (s: string, x: number, size = 10, font: PDFFont = regular, color = BLACK, maxWidth = width, maxLines = 12) => {
    for (const line of wrap(s, font, size, maxWidth, maxLines)) {
      text(line, x, size, font, color)
      y -= size * 1.4
    }
  }
  const rule = (p: PDFPage) => {
    p.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: 0.6, color: rgb(0.8, 0.8, 0.8) })
    y -= 14
  }

  // Header
  text(legal.tradingName, margin, 20, bold, GREEN)
  const label = inv.status === 'void' ? 'VOID' : inv.status === 'paid' ? 'INVOICE (PAID)' : 'INVOICE'
  const labelW = bold.widthOfTextAtSize(label, 16)
  text(label, margin + width - labelW, 16, bold, inv.status === 'void' ? rgb(0.7, 0.1, 0.1) : BLACK)
  y -= 16
  text(legal.companyName, margin, 9, regular, GREY)
  y -= 12
  for (const line of wrap(legal.registeredOffice, regular, 9, width * 0.6)) {
    text(line, margin, 9, regular, GREY)
    y -= 12
  }
  text('info@getrealhealthpgd.co.uk', margin, 9, regular, GREY)
  y -= 22
  rule(page)

  // Meta block (right) and bill-to (left)
  const topY = y
  const metaX = margin + width * 0.6
  const meta: Array<[string, string]> = [
    ['Invoice number', inv.invoiceNumber],
    ['Invoice date', longDate(inv.issuedOn)],
    ['Due date', inv.paymentMethod === 'direct_debit' ? 'Collected by Direct Debit' : longDate(inv.dueOn)],
    ['Period', `${longDate(inv.periodStart)} to ${longDate(inv.periodEnd)}`],
  ]
  for (const [k, v] of meta) {
    text(k, metaX, 9, regular, GREY)
    y -= 12
    for (const line of wrap(v, bold, 10, width * 0.4)) {
      text(line, metaX, 10, bold)
      y -= 13
    }
    y -= 4
  }
  const metaBottom = y
  y = topY
  text('Invoice to', margin, 9, regular, GREY)
  y -= 13
  para(inv.billToName, margin, 11, bold, BLACK, width * 0.55, 2)
  if (inv.billToAddress) para(inv.billToAddress, margin, 10, regular, BLACK, width * 0.55, 6)
  if (inv.billToEmail) para(inv.billToEmail, margin, 10, regular, GREY, width * 0.55, 1)
  y = Math.min(y, metaBottom) - 18
  rule(page)

  // Line items
  const colAmount = margin + width
  text('Description', margin, 9, bold, GREY)
  const amtHdr = 'Amount'
  text(amtHdr, colAmount - bold.widthOfTextAtSize(amtHdr, 9), 9, bold, GREY)
  y -= 16
  const descLines = wrap(inv.description, regular, 10, width * 0.75)
  const amt = gbp(inv.amountPence)
  text(amt, colAmount - regular.widthOfTextAtSize(amt, 10), 10)
  for (const line of descLines) {
    text(line, margin, 10)
    y -= 14
  }
  y -= 6
  rule(page)
  const totalLabel = 'Total due'
  const totalX = colAmount - bold.widthOfTextAtSize(amt, 13)
  text(totalLabel, totalX - 90, 11, bold)
  text(amt, totalX, 13, bold)
  y -= 14
  text('No VAT is charged: Get Real Health Limited is not VAT registered.', margin, 8.5, regular, GREY)
  y -= 30

  // Payment
  text('How to pay', margin, 11, bold, GREEN)
  y -= 16
  if (inv.status === 'void') {
    para('This invoice has been cancelled and no payment is due against it.', margin, 10)
  } else if (inv.paymentMethod === 'direct_debit') {
    para(
      inv.status === 'paid' && inv.paidAt
        ? `Paid by Direct Debit on ${longDate(inv.paidAt)}. No action is needed.`
        : `This invoice is settled by Direct Debit through GoCardless${inv.collectionDate ? `, collected on or around ${longDate(inv.collectionDate)}` : ''}. No action is needed; it will show on your bank statement as GoCardless or Get Real Health.`,
      margin, 10,
    )
  } else if (inv.status === 'paid') {
    para(`Paid${inv.paidAt ? ` on ${longDate(inv.paidAt)}` : ''}. Thank you.`, margin, 10)
  } else {
    para(`Please pay by bank transfer by ${longDate(inv.dueOn)}, quoting ${inv.invoiceNumber} as the reference.`, margin, 10)
    y -= 4
    for (const line of bankDetailsLines()) {
      text(line, margin, 10, bold)
      y -= 14
    }
    y -= 6
    para('Prefer not to pay invoices by hand? Reply to the invoice email and we will send a secure Direct Debit link; future months are then collected automatically.', margin, 9.5, regular, GREY)
  }

  // Footer
  y = margin + 28
  rule(page)
  const footer = `${legal.companyName}. Company number ${legal.companyNumber}, registered in ${legal.jurisdiction}. Registered office: ${legal.registeredOffice}. Independent Medical Agency registered with the Care Quality Commission.`
  for (const line of wrap(footer, regular, 7.5, width)) {
    text(line, margin, 7.5, regular, GREY)
    y -= 10
  }

  return doc.save()
}
