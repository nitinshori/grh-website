import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clinicalSignoffs } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { ALL_PGDS } from '@/lib/pgd-access'
import { PGD_MASTER_FILES } from '@/lib/pgd-document-manifest'
import { modules } from '@/data/training-modules'

export const metadata = { title: 'Clinical Sign-off | Get Real Health' }
export const dynamic = 'force-dynamic'

// ── Clinical sign-off register ──────────────────────────────────────────
// Built for Chris: every PGD document, ePGD tool and training module on
// the platform, each digitally signed off one by one. Every sign-off is
// recorded with name, timestamp, declaration and network fingerprint.
// Access: super_admin, or any email listed in the SIGNOFF_REVIEWERS env
// var (comma-separated) — add Chris's login email there in Vercel.

const DECLARATIONS: Record<string, string> = {
  pgd_document:
    'I have reviewed this Patient Group Direction document and confirm I am satisfied with its clinical content and approve it for use under the Get Real Health PGD service.',
  epgd_tool:
    'I have reviewed this ePGD consultation tool and confirm its inclusion/exclusion criteria and clinical safeguards reflect the signed PGD, and approve it for use.',
  training_module:
    'I have reviewed this training module and confirm its clinical content is accurate and consistent with the signed PGD, and approve it for use.',
}

function allowed(session: { user?: { role?: string; email?: string | null } } | null) {
  if (!session?.user) return false
  if (session.user.role === 'super_admin') return true
  const reviewers = (process.env.SIGNOFF_REVIEWERS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return !!session.user.email && reviewers.includes(session.user.email.toLowerCase())
}

async function signOff(formData: FormData) {
  'use server'
  const session = await auth()
  if (!allowed(session)) redirect('/login')
  const itemType = String(formData.get('itemType') ?? '')
  const itemSlug = String(formData.get('itemSlug') ?? '')
  const itemTitle = String(formData.get('itemTitle') ?? '')
  const itemVersion = String(formData.get('itemVersion') ?? '') || null
  if (!DECLARATIONS[itemType] || !itemSlug) return
  const h = await headers()
  await db.insert(clinicalSignoffs).values({
    itemType,
    itemSlug,
    itemTitle: itemTitle || null,
    itemVersion,
    signedByUserId: session!.user!.id ?? null,
    signedByName: session!.user!.name ?? session!.user!.email ?? 'Unknown',
    signedByRole: session!.user!.role === 'super_admin' ? 'Super Admin' : 'Clinical Reviewer',
    declaration: DECLARATIONS[itemType],
    ipAddress: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: h.get('user-agent'),
  })
  revalidatePath('/clinical-sign-off')
}

interface Item {
  slug: string
  title: string
  subtitle: string
  version: string | null
  viewHref: string
}

function Section({
  heading,
  blurb,
  itemType,
  items,
  latest,
}: {
  heading: string
  blurb: string
  itemType: string
  items: Item[]
  latest: Map<string, { signedByName: string; signedAt: Date }>
}) {
  const done = items.filter((i) => latest.has(`${itemType}:${i.slug}`)).length
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-lg font-bold text-navy-900">{heading}</h2>
        <span
          className={`text-sm font-semibold ${done === items.length ? 'text-emerald-600' : 'text-gray-500'}`}
        >
          {done} / {items.length} signed off
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{blurb}</p>
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {items.map((i) => {
          const s = latest.get(`${itemType}:${i.slug}`)
          return (
            <div
              key={i.slug}
              className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{i.title}</p>
                <p className="text-xs text-gray-500">
                  {i.subtitle}
                  {i.version ? ` · ${i.version}` : ''}
                </p>
              </div>
              <a
                href={i.viewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Review →
              </a>
              {s ? (
                <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  ✓ {s.signedByName} · {s.signedAt.toISOString().slice(0, 10)}
                </span>
              ) : (
                <form action={signOff}>
                  <input type="hidden" name="itemType" value={itemType} />
                  <input type="hidden" name="itemSlug" value={i.slug} />
                  <input type="hidden" name="itemTitle" value={i.title} />
                  <input type="hidden" name="itemVersion" value={i.version ?? ''} />
                  <button
                    type="submit"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-navy-900 text-white hover:bg-navy-800"
                  >
                    Sign off
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default async function ClinicalSignOffPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!allowed(session)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Clinical Sign-off</h1>
          <p className="text-sm text-gray-600">
            This area is restricted to clinical reviewers. Ask Get Real Health
            to add your account.
          </p>
        </div>
      </div>
    )
  }

  const rows = await db
    .select({
      itemType: clinicalSignoffs.itemType,
      itemSlug: clinicalSignoffs.itemSlug,
      signedByName: clinicalSignoffs.signedByName,
      signedAt: clinicalSignoffs.signedAt,
    })
    .from(clinicalSignoffs)
    .orderBy(desc(clinicalSignoffs.signedAt))

  // latest sign-off per item
  const latest = new Map<string, { signedByName: string; signedAt: Date }>()
  for (const r of rows) {
    const k = `${r.itemType}:${r.itemSlug}`
    if (!latest.has(k)) latest.set(k, { signedByName: r.signedByName, signedAt: r.signedAt })
  }

  const documents: Item[] = ALL_PGDS.filter((p) => PGD_MASTER_FILES[p.slug]).map((p) => ({
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    version: PGD_MASTER_FILES[p.slug],
    viewHref: `/pgd-documents/${encodeURIComponent(PGD_MASTER_FILES[p.slug])}`,
  }))

  const tools: Item[] = ALL_PGDS.map((p) => ({
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    version: 'consistency review Jul 2026',
    viewHref: `/for-pharmacies/epgd/${p.slug}`,
  }))

  const training: Item[] = modules.map((m) => ({
    slug: m.slug,
    title: m.title,
    subtitle: m.pgdSlugs?.join(', ') ?? '',
    version: `v${m.version}`,
    viewHref: `/for-pharmacies/dashboard/training/${m.slug}`,
  }))

  const total = documents.length + tools.length + training.length
  const done = latest.size

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            Clinical governance
          </p>
          <h1 className="text-2xl font-bold text-navy-900">Clinical Sign-off Register</h1>
          <p className="text-sm text-gray-600 mt-2">
            Review and digitally sign off each PGD document, ePGD tool and
            training module. Each sign-off is recorded with your name, a
            declaration, and a timestamp — {done} of {total} items currently
            signed off. Signing as{' '}
            <span className="font-semibold">{session.user.name ?? session.user.email}</span>.
          </p>
        </header>

        <Section
          heading="PGD Documents"
          blurb="The signed master documents as published on the platform. Review the PDF, then sign off."
          itemType="pgd_document"
          items={documents}
          latest={latest}
        />
        <Section
          heading="ePGD Tools"
          blurb="The online consultation tools. Open each tool, check the criteria and stops, then sign off."
          itemType="epgd_tool"
          items={tools}
          latest={latest}
        />
        <Section
          heading="Training Modules"
          blurb="The pharmacist training modules with assessments. Review the content, then sign off."
          itemType="training_module"
          items={training}
          latest={latest}
        />
      </div>
    </div>
  )
}
