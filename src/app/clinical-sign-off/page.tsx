import type { Session } from 'next-auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { and, desc, eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { clinicalSignoffs, pharmacyPgdDocuments, pharmacies } from '@/lib/db/schema'
import { ALL_PGDS } from '@/lib/pgd-access'
import { PGD_MASTER_FILES } from '@/lib/pgd-document-manifest'
import { getPharmacyPgdSlugs, getPharmacyNonApprovedSlugs } from '@/lib/pgd-queries'
import { getPgdDocumentUrl } from '@/lib/pgd-documents'
import { PGD_DRAFTS } from '@/lib/pgd-drafts'
import { modules } from '@/data/training-modules'

export const metadata = { title: 'Clinical Sign-off | Get Real Health' }
export const dynamic = 'force-dynamic'

// ── Clinical sign-off register ──────────────────────────────────────────
// GRH clinicians see one row per PGD, with its document, ePGD tool and
// training module side by side — sign each off in place. Pharmacy clinical
// leads see a simple list of their pharmacy's own uploaded PGD documents.
// Every sign-off records name, role, scope, timestamp + network fingerprint.

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
  session: Session | null
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

type Latest = Map<string, { signedByName: string; signedAt: Date; itemVersion: string | null }>

// One sign-off cell: a Review link + Sign-off button, or a signed tick, or
// a dash when the aspect doesn't exist for this PGD.
function Cell({
  itemType,
  slug,
  title,
  version,
  viewHref,
  latest,
}: {
  itemType: string
  slug: string | null
  title: string
  version: string | null
  viewHref: string | null
  latest: Latest
}) {
  if (!slug || !viewHref) {
    return <span className="text-xs text-gray-300">—</span>
  }
  const s = latest.get(`${itemType}:${slug}`)
  // A sign-off only stands for the version that was signed. Where the item
  // has since been reissued (new document version), the previous signature
  // is shown but the item is presented for re-signing.
  const superseded =
    !!s && !!version && !!s.itemVersion && s.itemVersion !== version
  return (
    <div className="flex flex-col items-start gap-1">
      <a
        href={viewHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-semibold text-teal-700 hover:underline"
      >
        Review →
      </a>
      {s && superseded && (
        <span className="text-[10px] text-amber-700 leading-tight">
          Updated since {s.signedByName.split(' ')[0]} signed{' '}
          {s.signedAt.toISOString().slice(0, 10)}
        </span>
      )}
      {s && !superseded ? (
        <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 leading-tight">
          ✓ {s.signedByName.split(' ')[0]} · {s.signedAt.toISOString().slice(0, 10)}
        </span>
      ) : (
        <form action={signOff}>
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="itemSlug" value={slug} />
          <input type="hidden" name="itemTitle" value={title} />
          <input type="hidden" name="itemVersion" value={version ?? ''} />
          <button
            type="submit"
            className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-navy-900 text-white hover:bg-navy-800"
          >
            Sign off
          </button>
        </form>
      )}
    </div>
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

  const rows = await db
    .select({
      itemType: clinicalSignoffs.itemType,
      itemSlug: clinicalSignoffs.itemSlug,
      signedByName: clinicalSignoffs.signedByName,
      signedAt: clinicalSignoffs.signedAt,
      itemVersion: clinicalSignoffs.itemVersion,
    })
    .from(clinicalSignoffs)
    .where(eq(clinicalSignoffs.scope, viewer.scope))
    .orderBy(desc(clinicalSignoffs.signedAt))

  const latest: Latest = new Map()
  for (const r of rows) {
    const k = `${r.itemType}:${r.itemSlug}`
    if (!latest.has(k))
      latest.set(k, { signedByName: r.signedByName, signedAt: r.signedAt, itemVersion: r.itemVersion })
  }

  // ── Pharmacy clinical lead: every approved PGD (pharmacy-specific
  // document where one exists, otherwise the GRH master) is signable;
  // non-approved PGDs are listed below for review only, moving up to
  // the signable list as they are amended and approved over time.
  if (viewer.kind === 'pharmacy') {
    const pgdBySlug = new Map(ALL_PGDS.map((p) => [p.slug, p]))
    const [approvedSlugs, nonApprovedSlugs, docs, phRows] = await Promise.all([
      getPharmacyPgdSlugs(viewer.pharmacyId),
      getPharmacyNonApprovedSlugs(viewer.pharmacyId),
      db
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
        .orderBy(desc(pharmacyPgdDocuments.uploadedAt)),
      db
        .select({ name: pharmacies.name })
        .from(pharmacies)
        .where(eq(pharmacies.id, viewer.pharmacyId))
        .limit(1),
    ])
    const pharmacyName = phRows[0]?.name ?? 'Your pharmacy'
    const ownDocBySlug = new Map<string, (typeof docs)[number]>()
    for (const d of docs) if (!ownDocBySlug.has(d.pgdSlug)) ownDocBySlug.set(d.pgdSlug, d)

    const byTitle = (a: string, b: string) =>
      (pgdBySlug.get(a)?.title ?? a).localeCompare(pgdBySlug.get(b)?.title ?? b)

    const approvedRows = [...approvedSlugs].sort(byTitle).map((slug) => {
      const own = ownDocBySlug.get(slug)
      return {
        slug,
        title: pgdBySlug.get(slug)?.title ?? slug,
        subtitle: pgdBySlug.get(slug)?.subtitle ?? '',
        viewHref: own?.documentUrl ?? getPgdDocumentUrl(slug),
        version: own ? `v${own.version}` : 'GRH master',
      }
    })
    const nonApprovedRows = [...nonApprovedSlugs].sort(byTitle).map((slug) => ({
      slug,
      title: pgdBySlug.get(slug)?.title ?? slug,
      subtitle: pgdBySlug.get(slug)?.subtitle ?? '',
      viewHref: ownDocBySlug.get(slug)?.documentUrl ?? getPgdDocumentUrl(slug),
    }))
    const signable = approvedRows.filter((r) => r.viewHref)
    const done = signable.filter((r) => latest.has(`pgd_document:${r.slug}`)).length

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
              Clinical governance · {pharmacyName}
            </p>
            <h1 className="text-2xl font-bold text-navy-900">Clinical Sign-off Register</h1>
            <p className="text-sm text-gray-600 mt-2">
              Review and digitally sign off every PGD approved for {pharmacyName} —{' '}
              {done} of {signable.length} signed off. Signing as{' '}
              <span className="font-semibold">{session.user.name ?? session.user.email}</span>{' '}
              ({viewer.roleLabel}).
            </p>
          </header>

          <h2 className="text-sm font-bold text-navy-900 mb-2">
            Approved PGDs ({approvedRows.length})
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-10">
            {approvedRows.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-500">
                No PGDs approved for your pharmacy yet.
              </p>
            )}
            {approvedRows.map((r) => (
              <div key={r.slug} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-500">{r.subtitle} · {r.version}</p>
                </div>
                {r.viewHref ? (
                  <Cell
                    itemType="pgd_document"
                    slug={r.slug}
                    title={r.title}
                    version={r.version}
                    viewHref={r.viewHref}
                    latest={latest}
                  />
                ) : (
                  <span className="text-[11px] text-gray-400">Document to follow</span>
                )}
              </div>
            ))}
          </div>

          <h2 className="text-sm font-bold text-navy-900 mb-1">
            Non approved PGDs ({nonApprovedRows.length})
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            Review only — not yet approved for {pharmacyName}. These become
            signable here once amended and approved.
          </p>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {nonApprovedRows.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-500">None.</p>
            )}
            {nonApprovedRows.map((r) => (
              <div key={r.slug} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-700">{r.title}</p>
                  <p className="text-xs text-gray-500">{r.subtitle}</p>
                </div>
                {r.viewHref ? (
                  <a
                    href={r.viewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-teal-700 hover:underline"
                  >
                    Review →
                  </a>
                ) : (
                  <span className="text-[11px] text-gray-400">Document to follow</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── GRH clinician: one row per PGD (document · tool · training) ──
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
  for (const u of uploaded) if (!uploadedBySlug.has(u.pgdSlug)) uploadedBySlug.set(u.pgdSlug, u.documentUrl)

  // training module matched to each PGD (a module can serve several PGDs)
  const moduleForPgd = new Map<string, (typeof modules)[number]>()
  const matchedModuleSlugs = new Set<string>()
  for (const p of ALL_PGDS) {
    const m = modules.find((mod) => mod.pgdSlugs?.includes(p.slug))
    if (m) {
      moduleForPgd.set(p.slug, m)
      matchedModuleSlugs.add(m.slug)
    }
  }
  const generalModules = modules.filter((m) => !matchedModuleSlugs.has(m.slug))

  const pgdRows = ALL_PGDS.map((p) => {
    const master = PGD_MASTER_FILES[p.slug]
    const docHref = master
      ? `/pgd-documents/${encodeURIComponent(master)}`
      : uploadedBySlug.get(p.slug) ?? null
    const mod = moduleForPgd.get(p.slug) ?? null
    return {
      pgd: p,
      docHref,
      docVersion: master ? master : docHref ? 'uploaded document' : null,
      mod,
    }
  })

  // counts (unique items)
  const docCount = pgdRows.filter((r) => r.docHref).length
  const total = docCount + ALL_PGDS.length + modules.length
  let done = 0
  for (const k of latest.keys()) done++ // every recorded latest item counts once

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-1">
            Clinical governance
          </p>
          <h1 className="text-2xl font-bold text-navy-900">Clinical Sign-off Register</h1>
          <p className="text-sm text-gray-600 mt-2">
            One row per PGD — review and sign off its document, ePGD tool and
            training in place. Each sign-off is recorded with your name, a
            declaration and a timestamp — {done} of {total} items signed off.
            Signing as{' '}
            <span className="font-semibold">{session.user.name ?? session.user.email}</span>{' '}
            ({viewer.roleLabel}).
          </p>
        </header>

        <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 min-w-[200px]">PGD</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">ePGD Tool</th>
                <th className="px-4 py-3">Training</th>
              </tr>
            </thead>
            <tbody>
              {pgdRows.map(({ pgd, docHref, docVersion, mod }) => (
                <tr key={pgd.slug} className="border-b border-gray-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{pgd.title}</p>
                    <p className="text-xs text-gray-500">{pgd.subtitle}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Cell
                      itemType="pgd_document"
                      slug={docHref ? pgd.slug : null}
                      title={pgd.title}
                      version={docVersion}
                      viewHref={docHref}
                      latest={latest}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Cell
                      itemType="epgd_tool"
                      slug={pgd.slug}
                      title={pgd.title}
                      version="consistency review Jul 2026"
                      viewHref={`/for-pharmacies/epgd/${pgd.slug}`}
                      latest={latest}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Cell
                      itemType="training_module"
                      slug={mod ? mod.slug : null}
                      title={mod ? mod.title : pgd.title}
                      version={mod ? `v${mod.version}` : null}
                      viewHref={mod ? `/for-pharmacies/dashboard/training/${mod.slug}` : null}
                      latest={latest}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {PGD_DRAFTS.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-navy-900 mb-2">
              Drafts awaiting review ({PGD_DRAFTS.length})
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Unsigned drafts, for review by Nitin and Chris only. These are not
              published to any pharmacy and cannot be worked to until signed.
            </p>
            <div className="bg-white border border-amber-300 rounded-xl divide-y divide-amber-100">
              {PGD_DRAFTS.map((d) => (
                <div key={d.url} className="px-4 py-3 flex flex-wrap items-start gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {d.title}{' '}
                      <span className="ml-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {d.version}
                      </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{d.summary}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Raised by {d.raisedBy}</p>
                  </div>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-teal-700 hover:underline whitespace-nowrap"
                  >
                    Review draft →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {generalModules.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-navy-900 mb-2">General training modules</h2>
            <p className="text-xs text-gray-500 mb-3">
              Training not tied to a single PGD. Review, then sign off.
            </p>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {generalModules.map((m) => (
                <div key={m.slug} className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-500">v{m.version}</p>
                  </div>
                  <Cell
                    itemType="training_module"
                    slug={m.slug}
                    title={m.title}
                    version={`v${m.version}`}
                    viewHref={`/for-pharmacies/dashboard/training/${m.slug}`}
                    latest={latest}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
