import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pharmacies, users, pharmacyPgds } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

/**
 * GET /api/seed-moins?key=grh2026
 * One-time setup: runs consultation_records migration + seeds Moin's Chemist
 * Remove this route after use.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('key') !== 'grh2026') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results: string[] = []

  try {
    // ── Step 1: Run consultation_records migration ──────────────
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consultation_outcome') THEN
            CREATE TYPE consultation_outcome AS ENUM ('completed', 'referred', 'not_supplied');
          END IF;
        END $$
      `)
      results.push('Created consultation_outcome enum')
    } catch (e: any) {
      results.push(`Enum: ${e.message}`)
    }

    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS consultation_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          consultation_id UUID REFERENCES pgd_consultations(id) ON DELETE SET NULL,
          pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          pgd_slug VARCHAR(255) NOT NULL,
          patient_first_name VARCHAR(100) NOT NULL,
          patient_last_name VARCHAR(100) NOT NULL,
          patient_dob VARCHAR(10) NOT NULL,
          patient_nhs_number VARCHAR(20),
          patient_phone VARCHAR(50),
          patient_email VARCHAR(255),
          patient_address TEXT,
          patient_gp_name VARCHAR(255),
          patient_gp_practice VARCHAR(255),
          clinical_data TEXT NOT NULL,
          outcome consultation_outcome NOT NULL DEFAULT 'completed',
          medicine_supplied VARCHAR(255),
          medicine_dose VARCHAR(255),
          medicine_duration VARCHAR(100),
          medicine_quantity VARCHAR(50),
          pharmacist_name VARCHAR(255) NOT NULL,
          pharmacist_gphc VARCHAR(50) NOT NULL,
          consultation_date TIMESTAMP NOT NULL,
          completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `)
      results.push('Created consultation_records table')
    } catch (e: any) {
      results.push(`Table: ${e.message}`)
    }

    // Create indexes
    const indexes = [
      { name: 'idx_consultation_records_pharmacy', sql: sql`CREATE INDEX IF NOT EXISTS idx_consultation_records_pharmacy ON consultation_records(pharmacy_id)` },
      { name: 'idx_consultation_records_user', sql: sql`CREATE INDEX IF NOT EXISTS idx_consultation_records_user ON consultation_records(user_id)` },
      { name: 'idx_consultation_records_patient_name', sql: sql`CREATE INDEX IF NOT EXISTS idx_consultation_records_patient_name ON consultation_records(patient_last_name, patient_first_name)` },
      { name: 'idx_consultation_records_patient_nhs', sql: sql`CREATE INDEX IF NOT EXISTS idx_consultation_records_patient_nhs ON consultation_records(patient_nhs_number) WHERE patient_nhs_number IS NOT NULL` },
      { name: 'idx_consultation_records_pgd_slug', sql: sql`CREATE INDEX IF NOT EXISTS idx_consultation_records_pgd_slug ON consultation_records(pgd_slug)` },
      { name: 'idx_consultation_records_date', sql: sql`CREATE INDEX IF NOT EXISTS idx_consultation_records_date ON consultation_records(consultation_date DESC)` },
    ]
    for (const idx of indexes) {
      try {
        await db.execute(idx.sql)
        results.push(`Created index ${idx.name}`)
      } catch (e: any) {
        results.push(`Index ${idx.name}: ${e.message}`)
      }
    }

    // ── Step 2: Seed Moin's Chemist ─────────────────────────────

    // Check if Moin's already exists
    const existing = await db.select().from(pharmacies).where(eq(pharmacies.slug, 'moins-chemist')).limit(1)

    let pharmacyId: string

    if (existing.length > 0) {
      pharmacyId = existing[0].id
      results.push(`Moin's Chemist already exists (${pharmacyId})`)
    } else {
      const [pharmacy] = await db.insert(pharmacies).values({
        name: "Moin's Chemist",
        slug: 'moins-chemist',
        groupSlug: 'moins',
        address: 'Moin\'s Chemist, High Street, Wales',
        phone: '',
        email: 'moinschemist@email.com',
        brandColor: '#25b4b4',
        brandName: "Moin's Chemist",
        isActive: true,
      }).returning({ id: pharmacies.id })
      pharmacyId = pharmacy.id
      results.push(`Created Moin's Chemist pharmacy (${pharmacyId})`)
    }

    // Check if pharmacist user exists
    const existingUser = await db.select().from(users).where(eq(users.email, 'moin@moinschemist.co.uk')).limit(1)

    if (existingUser.length > 0) {
      results.push(`Pharmacist user already exists (${existingUser[0].id})`)
    } else {
      const passwordHash = await bcrypt.hash('MoinsDemo2026!', 12)
      const [user] = await db.insert(users).values({
        email: 'moin@moinschemist.co.uk',
        passwordHash,
        firstName: 'Moin',
        lastName: 'Ahmed',
        role: 'pharmacist',
        pharmacyId,
        isActive: true,
      }).returning({ id: users.id })
      results.push(`Created pharmacist: moin@moinschemist.co.uk / MoinsDemo2026! (${user.id})`)
    }

    // ── Step 3: Assign PGDs to Moin's Chemist ───────────────────
    // Assign a representative set of PGDs
    const pgdSlugs = [
      'uti', 'acne', 'flu', 'cold-sores', 'sore-throat', 'eczema',
      'impetigo', 'erectile-dysfunction', 'period-delay', 'shingles',
      'ear-infection', 'wegovy', 'mounjaro', 'orlistat',
      'smoking-nrt', 'smoking-varenicline', 'alcohol-reduction',
      'hypertension', 'contraception-pop', 'gonorrhoea-treatment',
      'chlamydia', 'hair-loss-male', 'acid-reflux', 'migraine',
      'hay-fever', 'travel-core', 'malaria-prophylaxis',
    ]

    let assigned = 0
    for (const slug of pgdSlugs) {
      try {
        await db.insert(pharmacyPgds).values({
          pharmacyId,
          pgdSlug: slug,
        }).onConflictDoNothing()
        assigned++
      } catch {
        // Already assigned
      }
    }
    results.push(`Assigned ${assigned} PGDs to Moin's Chemist`)

    return NextResponse.json({
      success: true,
      results,
      login: {
        url: 'https://getrealhealthpgd.co.uk/login',
        email: 'moin@moinschemist.co.uk',
        password: 'MoinsDemo2026!',
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      results,
    }, { status: 500 })
  }
}
