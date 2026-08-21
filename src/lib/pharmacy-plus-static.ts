import type { PharmacyPlusResource } from '@/types/pharmacy-plus'

// ─────────────────────────────────────────────────────────────────────────
// PPH resource hub: documents held in the repo.
//
// The hub was originally fed only by uploads into Vercel Blob through its
// admin page. Every other document on this platform is served from
// public/, added by committing the file, which is how the whole PGD
// catalogue works. Feeding the hub the same way means a new signed PPH
// version is published by committing it, exactly like a master, with no
// separate upload step and no admin key involved.
//
// Blob uploads still work and still appear in the hub; these entries are
// merged in alongside them.
//
// To add a document: drop the PDF in public/pph-documents/ and add an
// entry below. Keep the id stable, it is what the download route uses.
// ─────────────────────────────────────────────────────────────────────────

interface StaticResourceInput {
  id: string
  name: string
  description: string
  category: PharmacyPlusResource['category']
  /** File name inside public/pph-documents/ */
  file: string
  /** Approximate size in bytes, for display only. */
  fileSize: number
  /** ISO date the version was signed. */
  signedAt: string
}

const STATIC_RESOURCES: StaticResourceInput[] = [
  {
    id: 'pph-mounjaro-v002',
    name: 'Mounjaro (tirzepatide) PGD v002',
    description: 'Signed 30 Jul 2026. PPH clinical review: gallbladder disease moved to exclusions, endocrinological obesity excluded, HRT, warfarin, aspiration and tachycardia cautions added.',
    category: 'PGD',
    file: 'PPH-Mounjaro-PGD-v002.pdf',
    fileSize: 190000,
    signedAt: '2026-07-30',
  },
  {
    id: 'pph-wegovy-injection-v002',
    name: 'Wegovy (semaglutide) Injection PGD v002',
    description: 'Signed 30 Jul 2026. 7.2 mg pen separated out, progression to 7.2 mg limited to a starting BMI of 30 or above, NAION caution added.',
    category: 'PGD',
    file: 'PPH-Wegovy-Injection-PGD-v002.pdf',
    fileSize: 195000,
    signedAt: '2026-07-30',
  },
  {
    id: 'pph-wegovy-tablets-v003',
    name: 'Wegovy (semaglutide) Tablets PGD v003',
    description: 'Signed 30 Jul 2026. Aligned with the injection PGD, upper age 85, missed dose and re-titration wording added.',
    category: 'PGD',
    file: 'PPH-Wegovy-Tablets-PGD-v003.pdf',
    fileSize: 188000,
    signedAt: '2026-07-30',
  },
  {
    id: 'pph-b12-folate-v004',
    name: 'B12 and Folate PGD v004',
    description: 'Signed 6 Aug 2026. Hydroxocobalamin injection, cyanocobalamin tablets and folic acid in one document, with blood interpretation guidance.',
    category: 'PGD',
    file: 'PPH-B12-Folate-PGD-v004.pdf',
    fileSize: 210000,
    signedAt: '2026-08-06',
  },
  {
    id: 'pph-flu-v003',
    name: 'Seasonal Influenza PGD v003, 2026/27',
    description: 'Signed 6 Aug 2026. Four vaccines: IIVc from 2 years, aIIV from 50, IIVr from 18, IIVe 18 to 64, with 2026/27 strains.',
    category: 'PGD',
    file: 'PPH-Flu-PGD-v003-2026-27.pdf',
    fileSize: 195000,
    signedAt: '2026-08-06',
  },
  {
    id: 'pph-covid-v003',
    name: 'COVID-19 PGD v003, 2026/27',
    description: 'Signed 6 Aug 2026. Comirnaty first line with Spikevax and Nuvaxovid as alternatives, 12 years and over.',
    category: 'PGD',
    file: 'PPH-COVID-PGD-v003-2026-27.pdf',
    fileSize: 185000,
    signedAt: '2026-08-06',
  },
  {
    id: 'pph-menb-v002',
    name: 'Meningitis B PGD v002 (Bexsero and Trumenba)',
    description: 'Signed 14 Aug 2026. Covers both licensed MenB vaccines: Bexsero from 2 months and Trumenba from 10 years, each with its own schedule.',
    category: 'PGD',
    file: 'PPH-MenB-PGD-v002.pdf',
    fileSize: 190000,
    signedAt: '2026-08-14',
  },
  {
    id: 'pph-foundayo-v002',
    name: 'Foundayo (orforglipron) PGD v002',
    description: 'Signed 21 Aug 2026. Reconciled against the UK SPC: corrected pregnancy interval (3 weeks), oral contraceptive interaction added for initiation and every dose increase, hypotension caution, and simvastatin, rosuvastatin, topotecan and OATP1B interaction handling.',
    category: 'PGD',
    file: 'PPH-Foundayo-PGD-v002.pdf',
    fileSize: 200000,
    signedAt: '2026-08-21',
  },
]

/** Hub entries for the documents held in the repo. */
export function getStaticResources(): PharmacyPlusResource[] {
  return STATIC_RESOURCES.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    fileName: r.file,
    // Served straight from public/, so the download route can redirect to it
    // without minting a signed blob URL.
    blobUrl: `/pph-documents/${r.file}`,
    fileSize: r.fileSize,
    fileType: 'pdf',
    uploadedAt: `${r.signedAt}T00:00:00.000Z`,
    downloads: 0,
    isExternal: false,
  }))
}

/** True when this id belongs to a repo-held document rather than a blob. */
export function isStaticResource(id: string): boolean {
  return STATIC_RESOURCES.some((r) => r.id === id)
}

export function getStaticResourceById(id: string): PharmacyPlusResource | null {
  return getStaticResources().find((r) => r.id === id) ?? null
}
