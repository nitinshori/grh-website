import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPatientForm } from '@/data/patient-forms'
import { getPharmacyPgdSlugs } from '@/lib/pgd-queries'
import { EPGD_SEGMENT_ALIASES, WITHDRAWN_SLUGS } from '@/lib/pgd-access'
import { renderPatientFormPdf } from '@/lib/patient-form-pdf'
import { hasRecordRole } from '@/lib/consultation-attachments'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/patient-forms/[slug]/pdf: the blank patient form as an A4 PDF.
 *
 * Signed in as pharmacist, pharmacy_admin or super_admin, and the current pharmacy holds the PGD (approved
 * assignment, or an alias of it). super_admin: every form.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  if (!hasRecordRole(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug } = await ctx.params
  const form = getPatientForm(slug)
  if (!form || WITHDRAWN_SLUGS.has(form.slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (session.user.role !== 'super_admin') {
    const held = new Set(session.user.pharmacyId ? await getPharmacyPgdSlugs(session.user.pharmacyId) : [])
    const candidates = [form.slug, ...(EPGD_SEGMENT_ALIASES[form.slug] ?? [])]
    if (!candidates.some((s) => held.has(s))) {
      return NextResponse.json({ error: 'Your pharmacy does not have this PGD.' }, { status: 403 })
    }
  }

  const bytes = await renderPatientFormPdf(form)
  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="patient-form-${form.slug}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
