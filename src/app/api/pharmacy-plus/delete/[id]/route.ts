import { NextRequest, NextResponse } from 'next/server'
import { deleteResource } from '@/lib/pharmacy-plus'
import { verifyAdminKey } from '@/lib/pharmacy-plus-access'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check (constant-time; fails closed if key unset)
    if (!verifyAdminKey(request.headers.get('x-admin-key'))) {
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
