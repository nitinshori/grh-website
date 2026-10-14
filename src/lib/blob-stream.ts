import 'server-only'
import { get } from '@vercel/blob'

/**
 * Stream a file from the project's Vercel Blob store, which is configured
 * as PRIVATE (found 7 Oct 2026: every signed-PGD upload had failed with
 * "Cannot use public access on a private store"). Private blobs cannot be
 * linked to directly, so every document goes out through an authenticated
 * route that calls this.
 */
export async function streamPrivateBlob(
  url: string,
  filename: string,
  contentType = 'application/pdf',
  opts: { sandbox?: boolean; download?: boolean } = {},
): Promise<Response> {
  const result = await get(url, { access: 'private', useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new Response('Document not found in storage', { status: 404 })
  }
  const safeName = filename.replace(/[^\w.() -]+/g, '_').slice(0, 150) || 'document.pdf'
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Disposition': `${opts.download ? 'attachment' : 'inline'}; filename="${safeName}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  }
  // CSP sandbox stops Chrome's built-in PDF viewer, so callers turn it on
  // only for files that are not PDFs (uploaded images).
  if (opts.sandbox) headers['Content-Security-Policy'] = 'sandbox'
  return new Response(result.stream, { status: 200, headers })
}

/** Path of the authenticated download route for an uploaded PGD document. */
export function pgdDocumentFilePath(id: string): string {
  return `/api/pgd-documents/${id}/file`
}
