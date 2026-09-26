import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clinicians, pharmacies } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/me — return current user profile + clinician info for ePGD auto-fill
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user
  let gphcNumber = ''
  let pharmacyName = ''
  let pharmacyAddress = ''

  if (user.pharmacyId) {
    try {
      // Get pharmacy info including groupSlug for clinician lookup
      const [pharmacy] = await db
        .select({
          name: pharmacies.name,
          address: pharmacies.address,
          groupSlug: pharmacies.groupSlug,
        })
        .from(pharmacies)
        .where(eq(pharmacies.id, user.pharmacyId))
        .limit(1)

      if (pharmacy) {
        pharmacyName = pharmacy.name || ''
        pharmacyAddress = pharmacy.address || ''

        // Get clinician GPhC by matching name + pharmacy group
        if (pharmacy.groupSlug) {
          const [clinician] = await db
            .select({ gphcNumber: clinicians.gphcNumber })
            .from(clinicians)
            .where(
              and(
                eq(clinicians.name, user.name || ''),
                eq(clinicians.groupSlug, pharmacy.groupSlug)
              )
            )
            .limit(1)

          if (clinician?.gphcNumber) {
            gphcNumber = clinician.gphcNumber
          }
        }
      }
    } catch {
      // Tables may not exist for all setups
    }
  }

  return NextResponse.json({
    name: user.name || '',
    email: user.email || '',
    role: user.role || '',
    gphcNumber,
    pharmacyName,
    pharmacyAddress,
  })
}
