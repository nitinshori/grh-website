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

// Empty: the flu and COVID 2026/27 drafts were agreed and signed on
// 30 Jul 2026 and are now the live masters (flu-2026-27.pdf and
// covid-2026-27.pdf).
export const PGD_DRAFTS: PgdDraft[] = []
