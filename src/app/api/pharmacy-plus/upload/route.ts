import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, addResource } from '@/lib/pharmacy-plus'
import type { PharmacyPlusResource, ResourceCategory } from '@/types/pharmacy-plus'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES: ResourceCategory[] = ['PGD', 'Video', 'Training', 'Compliance', 'SOP']

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const adminKey = request.headers.get('x-admin-key')
    if (!adminKey || adminKey !== process.env.PHARMACY_PLUS_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string | null
    const category = formData.get('category') as ResourceCategory | null
    const description = (formData.get('description') as string) || ''
    const externalUrl = formData.get('externalUrl') as string | null

    if (!name || !category) {
      return NextResponse.json({ error: 'Missing required fields: name, category' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 })
    }

    // External link mode — no file upload, just store the URL
    if (externalUrl) {
      const resource: PharmacyPlusResource = {
        id: crypto.randomUUID(),
        name,
        description,
        category,
        fileName: '',
        blobUrl: externalUrl,
        fileSize: 0,
        fileType: 'external/link',
        uploadedAt: new Date().toISOString(),
        downloads: 0,
        isExternal: true,
      }

      await addResource(resource)
      return NextResponse.json({ success: true, resourceId: resource.id }, { status: 201 })
    }

    // File upload mode
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Missing required field: file (or provide externalUrl for links)' }, { status: 400 })
    }

    // Upload file to Vercel Blob
    const { url, size } = await uploadFile(file)

    // Create resource metadata
    const resource: PharmacyPlusResource = {
      id: crypto.randomUUID(),
      name,
      description,
      category,
      fileName: file.name,
      blobUrl: url,
      fileSize: size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
      downloads: 0,
      isExternal: false,
    }

    // Add to manifest
    await addResource(resource)

    return NextResponse.json({ success: true, resourceId: resource.id }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
