import { NextRequest, NextResponse } from 'next/server'
import { incrementDownloads } from '@/lib/pharmacy-plus'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const resource = await incrementDownloads(id)
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Redirect to the URL (works for both Blob URLs and external links)
    return NextResponse.redirect(resource.blobUrl, 302)
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
