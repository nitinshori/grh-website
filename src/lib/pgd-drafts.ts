// ── pgd-drafts.ts ──────────────────────────────────────────────
// Unsigned PGD drafts awaiting clinical review by Nitin and Chris.
//
// These are deliberately NOT in PGD_MASTER_FILES and NOT assigned to any
// pharmacy: they must never reach a pharmacy dashboard, the training
// pages or the PGD catalogue, because an unsigned PGD is not lawfully
// valid and cannot be worked to. They are served from
// /pgd-documents/drafts/ and surfaced only in the GRH clinician view of
// the clinical sign-off register.
//
// When a draft is agreed and signed, move the file to the master
// location, add it to PGD_MASTER_FILES, and delete the entry here.

export interface PgdDraft {
  /** Slug of the PGD this draft will replace or create. */
  slug: string
  title: string
  version: string
  url: string
  /** What changed, for the reviewer. */
  summary: string
  /** Who asked for it and when. */
  raisedBy: string
}

export const PGD_DRAFTS: PgdDraft[] = [
  {
    slug: 'flu',
    title: 'Seasonal Influenza, 2026/27 season',
    version: 'v002 draft',
    url: '/pgd-documents/drafts/flu-2026-27-draft.pdf',
    summary:
      'Multi-vaccine reissue: IIVc from 2 years, aIIV from 50 years, IIVr from 18 years, IIVe 18 to 64 years. Replaces the Fluad-only v001. Adds 2026/27 strains for both egg-based and cell culture vaccines, egg allergy handling, and paediatric provisions including the two dose schedule under 9 years.',
    raisedBy: 'Jane Wilkins (PPH), 30 Jul 2026',
  },
  {
    slug: 'covid-booster',
    title: 'COVID-19 Vaccination, 2026/27 season',
    version: 'v002 draft',
    url: '/pgd-documents/drafts/covid-2026-27-draft.pdf',
    summary:
      'Reissue for autumn 2026: Comirnaty as vaccine of choice with Spikevax and Nuvaxovid as stock alternatives, 12 years and over unchanged. Removes expired KP.2 and LP.8.1 wording, adds the 3 month minimum interval, myocarditis and pericarditis exclusion, and NHS entitlement wording.',
    raisedBy: 'Jane Wilkins (PPH), 30 Jul 2026',
  },
]
