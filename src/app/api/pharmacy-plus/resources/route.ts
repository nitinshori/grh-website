import { NextRequest, NextResponse } from 'next/server'
import { getAllResources } from '@/lib/pharmacy-plus'
import { getStaticResources } from '@/lib/pharmacy-plus-static'
import { isResourceReadAuthorised } from '@/lib/pharmacy-plus-access'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Require a valid HCP access cookie or admin key.
  if (!isResourceReadAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Documents committed to the repo are merged with anything uploaded
    // through the admin page, newest first, so both routes to publishing
    // appear in one list.
    const uploaded = await getAllResources()
    const resources = [...getStaticResources(), ...uploaded].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )
    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}
