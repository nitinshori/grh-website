import 'server-only'
import { get } from '@vercel/blob'

/**
 * Stream a file from the project's Vercel Blob store, which is configured
 * as PRIVATE (found 7 Oct 2026: every signed-PGD upload had failed with
 * "Cannot use public access on a private store"). Private blobs cannot be
 * linked to directly, so every document goes out through an authenticated
 * route that calls this.
 */
export async function streamPrivateBlob(url: string, filename: string, contentType = 'application/pdf'): Promise<Response> {
  const result = await get(url, { access: 'private', useCache: false })
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new Response('Document not found in storage', { status: 404 })
  }
  const safeName = filename.replace(/[^\w.() -]+/g, '_').slice(0, 150) || 'document.pdf'
  return new Response(result.stream, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}

/** Path of the authenticated download route for an uploaded PGD document. */
export function pgdDocumentFilePath(id: string): string {
  return `/api/pgd-documents/${id}/file`
}
