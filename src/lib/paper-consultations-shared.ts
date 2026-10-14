/**
 * Client-safe constants for paper consultations (migration 077).
 */

export const PAPER_OUTCOMES = ['supplied', 'administered', 'referred', 'not_supplied'] as const
export type PaperOutcome = (typeof PAPER_OUTCOMES)[number]

export const PAPER_OUTCOME_LABELS: Record<PaperOutcome, string> = {
  supplied: 'Supplied',
  administered: 'Administered',
  referred: 'Referred',
  not_supplied: 'Not supplied',
}

export function paperOutcomeLabel(o: string): string {
  return (PAPER_OUTCOME_LABELS as Record<string, string>)[o] ?? o
}

export const PAPER_CONSULTATION_NOTE =
  'Paper consultations are not checked against the PGD by the tool. The pharmacist is responsible for confirming every inclusion and exclusion criterion on the paper form.'

/** Largest file a pharmacist may pick, before the browser compresses it. */
export const ATTACHMENT_PICK_LIMIT_BYTES = 10 * 1024 * 1024
/** Largest PDF we can upload as it is (Vercel request body limit). */
export const ATTACHMENT_PDF_LIMIT_BYTES = 4 * 1024 * 1024
