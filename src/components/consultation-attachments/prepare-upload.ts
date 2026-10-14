import { ATTACHMENT_PDF_LIMIT_BYTES, ATTACHMENT_PICK_LIMIT_BYTES } from '@/lib/paper-consultations-shared'

/**
 * Get a picked file ready to upload in one request under Vercel's 4.5 MB
 * body limit. Photos (JPG, PNG, HEIC where the browser can read it) are
 * redrawn as JPEG, longest side at most 2000 px, which brings a 10 MB phone
 * photo down to well under 1 MB and keeps a page of handwriting readable.
 * PDFs are sent as they are, up to 4 MB.
 */

const UPLOAD_LIMIT = 4 * 1024 * 1024

export type Prepared = { ok: true; file: File } | { ok: false; error: string }

function isPdf(f: File) {
  return f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
}
function isImage(f: File) {
  return f.type.startsWith('image/') || /\.(jpe?g|png|heic|heif)$/i.test(f.name)
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // fall through to <img>, which some browsers decode more widely
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function toJpeg(src: ImageBitmap | HTMLImageElement, maxSide: number, quality: number): Promise<Blob | null> {
  const w0 = 'naturalWidth' in src ? src.naturalWidth : src.width
  const h0 = 'naturalHeight' in src ? src.naturalHeight : src.height
  const scale = Math.min(1, maxSide / Math.max(w0, h0))
  const w = Math.max(1, Math.round(w0 * scale))
  const h = Math.max(1, Math.round(h0 * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(src, 0, 0, w, h)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

export async function prepareUpload(file: File): Promise<Prepared> {
  if (file.size > ATTACHMENT_PICK_LIMIT_BYTES) {
    return { ok: false, error: 'That file is too large. Please use a file under 10 MB.' }
  }
  if (isPdf(file)) {
    if (file.size > ATTACHMENT_PDF_LIMIT_BYTES) {
      return { ok: false, error: 'That PDF is too large. Please use a PDF under 4 MB, or upload photos of the pages instead.' }
    }
    return { ok: true, file }
  }
  if (!isImage(file)) {
    return { ok: false, error: 'Please upload a photo (JPG, PNG or HEIC) or a PDF.' }
  }

  let src: ImageBitmap | HTMLImageElement
  try {
    src = await decode(file)
  } catch {
    // Typically HEIC in a browser that cannot read it. Small enough to send
    // as it is? Then the server stores the original.
    if (file.size <= UPLOAD_LIMIT) return { ok: true, file }
    return { ok: false, error: 'This browser cannot read that photo. Please save it as a JPG and try again.' }
  }

  for (const [side, q] of [[2000, 0.85], [1600, 0.75], [1200, 0.7]] as const) {
    const blob = await toJpeg(src, side, q)
    if (blob && blob.size <= UPLOAD_LIMIT) {
      const base = file.name.replace(/\.[^.]+$/, '') || 'paper-form'
      return { ok: true, file: new File([blob], `${base}.jpg`, { type: 'image/jpeg' }) }
    }
  }
  return { ok: false, error: 'We could not make that photo small enough to upload. Please try another photo.' }
}
