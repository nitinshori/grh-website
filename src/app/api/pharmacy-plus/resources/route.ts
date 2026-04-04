import { NextResponse } from 'next/server'
import { getAllResources, readManifest } from '@/lib/pharmacy-plus'
import { list } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const debug = url.searchParams.get('debug') === '1'

  try {
    if (debug) {
      // Debug mode: show raw blob list and manifest
      const { blobs } = await list({ prefix: 'pharmacy-plus/' })
      const manifest = await readManifest()
      return NextResponse.json({
        blobCount: blobs.length,
        blobs: blobs.map(b => ({ pathname: b.pathname, url: b.url, downloadUrl: b.downloadUrl, size: b.size })),
        manifest,
        hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 12) + '...',
      })
    }

    const resources = await getAllResources()
    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error fetching resources:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to fetch resources', detail: message }, { status: 500 })
  }
}
