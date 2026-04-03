import { NextRequest, NextResponse } from 'next/server'
import { deleteResource } from '@/lib/pharmacy-plus'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const adminKey = request.headers.get('x-admin-key')
    if (!adminKey || adminKey !== process.env.PHARMACY_PLUS_ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const removed = await deleteResource(id)
    if (!removed) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: removed.name })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
