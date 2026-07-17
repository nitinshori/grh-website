import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, addResource } from '@/lib/pharmacy-plus'
import { verifyAdminKey } from '@/lib/pharmacy-plus-access'
import type { PharmacyPlusResource, ResourceCategory } from '@/types/pharmacy-plus'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES: ResourceCategory[] = ['PGD', 'Video', 'Training', 'Compliance', 'SOP']

// File validation: allow-list of content types and a max size.
const MAX_FILE_BYTES = 200 * 1024 * 1024 // 200 MB (accommodates training videos)
const ALLOWED_FILE_TYPES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
])

export async function POST(request: NextRequest) {
  try {
    // Auth check (constant-time; fails closed if key unset)
    if (!verifyAdminKey(request.headers.get('x-admin-key'))) {
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

    // Validate file type and size before uploading.
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || 'unknown'}` },
        { status: 415 }
      )
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB.` },
        { status: 413 }
      )
    }

    // Upload file to Vercel Blob (filename is sanitised inside uploadFile)
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
