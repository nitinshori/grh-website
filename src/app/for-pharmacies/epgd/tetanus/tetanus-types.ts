// Tetanus, Diphtheria and Polio ePGD: clinical state shared by the client and the printed record.

export const PGD_VERSION = "Tetanus, Diphtheria and Polio (Revaxis, Td/IPV) PGD v009, issued 11 September 2026";

export const STEP_LABELS = [
  "Patient Details",
  "Consent",
  "Indication",
  "History & Exclusions",
  "Administration",
  "Counselling & Summary",
] as const;

export type Indication = "adolescent-booster" | "incomplete-history" | "travel" | "wound" | "";
export type LastDose = "over-10" | "5-to-10" | "under-5" | "under-12-months" | "unknown" | "";
export type Priming = "adequate" | "incomplete" | "";
export type ConsentBasis = "gillick" | "parental" | "";
export type Route = "intramuscular" | "deep-subcutaneous" | "";

export interface Clinical {
  indication: Indication;
  destination: string;
  lastDose: LastDose;
  lastDoseDate: string;
  dosesReceived: string;
  dosesSource: string;
  primaryCourseContinuation: boolean;
  /** For the 12-month exception: the date of the prior primary-course dose given under this PGD (about a month ago). */
  priorPrimaryDoseDate: string;
  consentBasis: ConsentBasis;
  parentName: string;
  woundProne: boolean;
  woundHighRisk: boolean;
  priming: Priming;
  woundAssessmentNote: string;
  outbreakContact: boolean;
  anaphylaxisPreviousDose: boolean;
  anaphylaxisComponent: boolean;
  acuteFebrileIllness: boolean;
  pregnant: boolean;
  neurologicalDeterioration: boolean;
  neuroComplicationsPrevious: boolean;
  immunosuppressed: boolean;
  bleedingDisorder: boolean;
  allergies: string;
  batchNumber: string;
  expiryDate: string;
  route: Route;
  site: string;
  anaphylaxisKit: boolean;
  offLabelExplained: boolean;
  immunoglobulinReferralArranged: boolean;
  observationCompleted: boolean;
  courseAdvice: boolean;
  sideEffectAdvice: boolean;
  woundAdvice: boolean;
  recordAdvice: boolean;
  // Excluded patient: the advice and referral the document requires to be recorded
  exclusionExplained: boolean;
  referralArranged: boolean;
  referralDetails: string;
  gpInformed: boolean;
}

export const emptyClinical: Clinical = {
  indication: "", destination: "", lastDose: "", lastDoseDate: "", dosesReceived: "", dosesSource: "",
  primaryCourseContinuation: false, priorPrimaryDoseDate: "", consentBasis: "", parentName: "",
  woundProne: false, woundHighRisk: false, priming: "", woundAssessmentNote: "", outbreakContact: false,
  anaphylaxisPreviousDose: false, anaphylaxisComponent: false, acuteFebrileIllness: false,
  pregnant: false, neurologicalDeterioration: false, neuroComplicationsPrevious: false,
  immunosuppressed: false, bleedingDisorder: false,
  allergies: "", batchNumber: "", expiryDate: "", route: "", site: "", anaphylaxisKit: false,
  offLabelExplained: false, immunoglobulinReferralArranged: false, observationCompleted: false,
  courseAdvice: false, sideEffectAdvice: false, woundAdvice: false, recordAdvice: false,
  exclusionExplained: false, referralArranged: false, referralDetails: "", gpInformed: false,
};

/** Fresh copy so no shared default is ever mutated. */
export function createEmptyClinical(): Clinical {
  return { ...emptyClinical };
}

export const WITHIN_10_YEARS: LastDose[] = ["under-12-months", "under-5", "5-to-10"];

/**
 * Expiry is entered as MM/YYYY. Valid when well-formed and the last day of
 * that month is today or later.
 */
export function expiryMonthIsCurrent(expiry: string): boolean {
  const m = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(expiry.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = Number(m[2]);
  const lastDay = new Date(year, month, 0);
  lastDay.setHours(23, 59, 59, 999);
  return lastDay.getTime() >= Date.now();
}

/** Whole days between a YYYY-MM-DD date and today; null if unreadable. */
export function daysSince(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - d.getTime()) / 86400000);
}
