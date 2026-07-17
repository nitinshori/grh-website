import { NextRequest, NextResponse } from 'next/server'
import { incrementDownloads, getSignedDownloadUrl } from '@/lib/pharmacy-plus'
import { isResourceReadAuthorised } from '@/lib/pharmacy-plus-access'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require a valid HCP access cookie or admin key before minting a signed URL.
  if (!isResourceReadAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const resource = await incrementDownloads(id)
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // External links: redirect directly
    if (resource.isExternal) {
      return NextResponse.redirect(resource.blobUrl, 302)
    }

    // Private blob files: generate a signed download URL
    const signedUrl = await getSignedDownloadUrl(resource.blobUrl)
    return NextResponse.redirect(signedUrl, 302)
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
