import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

/**
 * Temporary migration endpoint — creates the pgd_consultations table.
 * DELETE THIS FILE after running once in production.
 *
 * Usage: GET /api/migrate-analytics?key=grh-setup-2026
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('key') !== 'grh-setup-2026') {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pgd_consultations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pgd_slug VARCHAR(255) NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    // Add useful indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pgd_consultations_pharmacy
        ON pgd_consultations(pharmacy_id, started_at DESC)
    `)

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pgd_consultations_slug
        ON pgd_consultations(pgd_slug, started_at DESC)
    `)

    return NextResponse.json({
      success: true,
      message: 'pgd_consultations table created with indexes',
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', detail: String(error) },
      { status: 500 }
    )
  }
}
