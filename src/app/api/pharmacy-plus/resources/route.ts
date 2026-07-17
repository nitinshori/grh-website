import { NextRequest, NextResponse } from 'next/server'
import { getAllResources } from '@/lib/pharmacy-plus'
import { isResourceReadAuthorised } from '@/lib/pharmacy-plus-access'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Require a valid HCP access cookie or admin key.
  if (!isResourceReadAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const resources = await getAllResources()
    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}
