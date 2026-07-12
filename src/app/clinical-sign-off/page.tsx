import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clinicalSignoffs, pharmacyPgdDocuments, pharmacies } from '@/lib/db/schema'
import { ALL_PGDS } from '@/lib/pgd-access'
import { PGD_MASTER_FILES } from '@/lib/pgd-document-manifest'
import { modules } from '@/data/training-modules'

export const metadata = { title: 'Clinical Sign-off | Get Real Health' }
export const dynamic = 'force-dynamic'

// ── Clinical sign-off register ──────────────────────────────────────────
// Scope-aware. GRH clinicians (Medical Director + Head Pharmacist) sign off
// the whole platform — every PGD document (master or uploaded), ePGD tool
// and training module. A pharmacy's own clinical lead (e.g. Janey at
// Pharmacy Plus Health) gets a page scoped to that pharmacy's uploaded PGD
// documents. Every sign-off is recorded with name, role, scope, timestamp
// and network fingerprint.
//
// Access: super_admin or any SIGNOFF_REVIEWERS email → GRH scope; any
// pharmacy_admin with a pharmacy → that pharmacy's scope.

const DECLARATIONS: Record<string, string> = {
  pgd_document:
    'I have reviewed this Patient Group Direction document and confirm I am satisfied with its clinical content and approve it for use.',
  epgd_tool:
    'I have reviewed this ePGD consultation tool and confirm its inclusion/exclusion criteria and clinical safeguards reflect the signed PGD, and approve it for use.',
  training_module:
    'I have reviewed this training module and confirm its clinical content is accurate and consistent with the signed PGD, and approve it for use.',
}

type Viewer =
  | { kind: 'grh'; scope: 'grh'; roleLabel: string }
  | { kind: 'pharmacy'; scope: string; pharmacyId: string; roleLabel: string }
  | null

async function getViewer(): Promise<{
  session: Awaited<ReturnType<typeof auth>>
  viewer: Viewer
}> {
  const session = await auth()
  if (!session?.user) return { session, viewer: null }
  const reviewers = (process.env.SIGNOFF_REVIEWERS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  const email = session.user.email?.toLowerCase() ?? ''
  if (session.user.role === 'super_admin') {
    return { session, viewer: { kind: 'grh', scope: 'grh', roleLabel: 'Medical Director' } }
  }
  if (email && reviewers.includes(email)) {
    return { session, viewer: { kind: 'grh', scope: 'grh', roleLabel: 'Clinical Reviewer' } }
  }
  if (session.user.pharmacyId && session.user.role === 'pharmacy_admin') {
    return {
      session,
      viewer: {
        kind: 'pharmacy',
        scope: `pharmacy:${session.user.pharmacyId}`,
        pharmacyId: session.user.pharmacyId,
        roleLabel: 'Pharmacy Clinical Lead',
      },
    }
  }
  return { session, viewer: null }
}

async function signOff(formData: FormData) {
  'use server'
  const { session, viewer } = await getViewer()
  if (!session?.user || !viewer) redirect('/login')
  const itemType = String(formData.get('itemType') ?? '')
  const itemSlug = String(formData.get('itemSlug') ?? '')
  const itemTitle = String(formData.get('itemTitle') ?? '')
  const itemVersion = String(formData.get('itemVersion') ?? '') || null
  if (!DECLARATIONS[itemType] || !itemSlug) return
  const h = await headers()
  await db.insert(clinicalSignoffs).values({
    scope: viewer.scope,
    pharmacyId: viewer.kind === 'pharmacy' ? viewer.pharmacyId : null,
    itemType,
    itemSlug,
    itemTitle: itemTitle || null,
    itemVersion,
    signedByUserId: session.user.id ?? null,
    signedByName: session.user.name ?? session.user.email ?? 'Unknown',
    signedByRole: viewer.roleLabel,
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
  if (items.length === 0) return null
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
            <div key={i.slug} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
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
  const { session, viewer } = await getViewer()
  if (!session?.user) redirect('/login')
  if (!viewer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Clinical Sign-off</h1>
          <p className="text-sm text-gray-600">
            This area is restricted to clinical reviewers. Ask Get Real Health
            to grant your account access.
          </p>
        </div>
      </div>
    )
  }

  // Latest sign-off per item, restricted to this viewer's scope.
  const rows = await db
    .select({
      itemType: clinicalSignoffs.itemType,
      itemSlug: clinicalSignoffs.itemSlug,
      signedByName: clinicalSignoffs.signedByName,
      signedAt: clinicalSignoffs.signedAt,
    })
    .from(clinicalSignoffs)
    .where(eq(clinicalSignoffs.scope, viewer.scope))
    .orderBy(desc(clinicalSignoffs.signedAt))

  const latest = new Map<string, { signedByName: string; signedAt: Date }>()
  for (const r of rows) {
    const k = `${r.itemType}:${r.itemSlug}`
    if (!latest.has(k)) latest.set(k, { signedByName: r.signedByName, signedAt: r.signedAt })
  }

  const pgdBySlug = new Map(ALL_PGDS.map((p) => [p.slug, p]))

  let documents: Item[] = []
  let tools: Item[] = []
  let training: Item[] = []

  if (viewer.kind === 'grh') {
    // All current uploaded documents across the platform, newest per slug,
    // so anything in the onsite storage (e.g. oral Wegovy) is sign-off-able
    // even before it becomes a static master.
    const uploaded = await db
      .select({
        pgdSlug: pharmacyPgdDocuments.pgdSlug,
        documentUrl: pharmacyPgdDocuments.documentUrl,
        uploadedAt: pharmacyPgdDocuments.uploadedAt,
      })
      .from(pharmacyPgdDocuments)
      .where(eq(pharmacyPgdDocuments.isCurrent, true))
      .orderBy(desc(pharmacyPgdDocuments.uploadedAt))
    const uploadedBySlug = new Map<string, string>()
    for (const u of uploaded) {
      if (!uploadedBySlug.has(u.pgdSlug)) uploadedBySlug.set(u.pgdSlug, u.documentUrl)
    }

    documents = ALL_PGDS.map((p) => {
      const master = PGD_MASTER_FILES[p.slug]
      const href = master
        ? `/pgd-documents/${encodeURIComponent(master)}`
        : uploadedBySlug.get(p.slug) ?? null
      if (!href) return null
      return {
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        version: master ? master : 'uploaded document',
        viewHref: href,
      }
    }).filter((x): x is Item => x !== null)

    tools = ALL_PGDS.map((p) => ({
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle,
      version: 'consistency review Jul 2026',
      viewHref: `/for-pharmacies/epgd/${p.slug}`,
    }))

    training = modules.map((m) => ({
      slug: m.slug,
      title: m.title,
      subtitle: m.pgdSlugs?.join(', ') ?? '',
      version: `v${m.version}`,
      viewHref: `/for-pharmacies/dashboard/training/${m.slug}`,
    }))
  } else {
    // Pharmacy clinical lead: only this pharmacy's own uploaded PGD docs.
    const docs = await db
      .select({
        pgdSlug: pharmacyPgdDocuments.pgdSlug,
        documentUrl: pharmacyPgdDocuments.documentUrl,
        filename: pharmacyPgdDocuments.filename,
        version: pharmacyPgdDocuments.version,
      })
      .from(pharmacyPgdDocuments)
      .where(
        and(
          eq(pharmacyPgdDocuments.pharmacyId, viewer.pharmacyId),
          eq(pharmacyPgdDocuments.isCurrent, true),
        ),
      )
      .orderBy(desc(pharmacyPgdDocuments.uploadedAt))
    documents = docs.map((d) => {
      const p = pgdBySlug.get(d.pgdSlug)
      return {
        slug: d.pgdSlug,
        title: p?.title ?? d.pgdSlug,
        subtitle: p?.subtitle ?? (d.filename ?? ''),
        version: `v${d.version}`,
        viewHref: d.documentUrl,
      }
    })
  }

  const total = documents.length + tools.length + training.length
  const done =
    documents.filter((i) => latest.has(`pgd_document:${i.slug}`)).length +
    tools.filter((i) => latest.has(`epgd_tool:${i.slug}`)).length +
    training.filter((i) => latest.has(`training_module:${i.slug}`)).length

  let pharmacyName = ''
  if (viewer.kind === 'pharmacy') {
    const [ph] = await db
      .select({ name: pharmacies.name })
      .from(pharmacies)
      .where(eq(pharmacies.id, viewer.pharmacyId))
      .limit(1)
    pharmacyName = ph?.name ?? ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            Clinical governance{pharmacyName ? ` · ${pharmacyName}` : ''}
          </p>
          <h1 className="text-2xl font-bold text-navy-900">Clinical Sign-off Register</h1>
          <p className="text-sm text-gray-600 mt-2">
            {viewer.kind === 'grh'
              ? 'Review and digitally sign off each PGD document, ePGD tool and training module. '
              : `Review and digitally sign off ${pharmacyName}'s PGD documents. `}
            Each sign-off is recorded with your name, a declaration and a
            timestamp — {done} of {total} items currently signed off. Signing as{' '}
            <span className="font-semibold">{session.user.name ?? session.user.email}</span>{' '}
            ({viewer.roleLabel}).
          </p>
        </header>

        <Section
          heading="PGD Documents"
          blurb={
            viewer.kind === 'grh'
              ? 'Signed master documents and any uploaded PGDs in the platform store. Review the PDF, then sign off.'
              : 'Your pharmacy’s signed PGD documents. Review the PDF, then sign off.'
          }
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
