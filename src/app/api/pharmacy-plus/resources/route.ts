import { NextResponse } from 'next/server'
import { getAllResources } from '@/lib/pharmacy-plus'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const resources = await getAllResources()
    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 })
  }
}
