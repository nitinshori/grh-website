// Shared types and constants for the Junior Travel Vaccines ePGD, kept out of
// the client so the printed summary can import them without a cycle.

export const PGD_VERSION = "Junior Travel Vaccines PGD v007, issued 11 September 2026";

export type ConsentBasis = "parental" | "gillick" | "self" | "";
export type ExclusionReferral = "" | "gp-informed" | "gp-referred" | "specialist-travel-clinic" | "urgent-same-day" | "declined";

export interface DoseEntry {
  doseNumber: string;
  previousDoseDate: string;
  batchNumber: string;
  expiryDate: string;
  site: string;
}

export interface Clinical {
  destination: string;
  departureDate: string;
  itinerary: string;
  recommendedForDestination: boolean;
  routineUpToDate: boolean;
  catchUpPlanDiscussed: boolean;
  selected: string[];
  doses: Record<string, DoseEntry>;
  twinrixCoAdminReason: string;
  anaphylaxisComponent: boolean;
  acuteFebrileIllness: boolean;
  immunosuppressed: boolean;
  pregnant: boolean;
  bleedingDisorder: boolean;
  postExposure: boolean;
  clinicalUncertainty: boolean;
  chronicConditionOrRemote: boolean;
  parentPresent: boolean;
  parentPresentDetail: string;
  consentBasis: ConsentBasis;
  consentDetail: string;
  allergies: string;
  anaphylaxisKit: boolean;
  observationCompleted: boolean;
  scheduleAdvice: boolean;
  sideEffectAdvice: boolean;
  bitesAndFoodAdvice: boolean;
  rabiesAdvice: boolean;
  adverseReaction: boolean;
  adverseReactionDetails: string;
  gpInformed: boolean;
  exclusionAdvice: string;
  exclusionReferral: ExclusionReferral;
}

export const EXCLUSION_REFERRAL_LABEL: Record<ExclusionReferral, string> = {
  "": "Not recorded",
  "gp-informed": "GP informed",
  "gp-referred": "Referred to GP",
  "specialist-travel-clinic": "Referred to a specialist travel health clinic",
  "urgent-same-day": "Urgent same-day medical assessment arranged",
  "declined": "Parent or young person declined; advice given",
};
