// Yellow fever ePGD: clinical state shared by the client and the printed record.

export const YF_PGD_VERSION = "Yellow fever vaccine (Stamaril) PGD v004, issued 11 September 2026";

export const STEP_LABELS = [
  "Centre & Patient",
  "Consent",
  "Travel Risk",
  "Contraindications",
  "Precautions",
  "Administration",
  "Certificate & Summary",
] as const;

export const STEP_PRECAUTIONS = 4;

export interface Clinical {
  // Designation
  yfvcDesignated: boolean;
  yfvcCode: string;
  administeringClinician: string;
  /** NaTHNaC conditions of designation: pharmacists only. Pharmacy technicians may not administer. */
  pharmacistNotTechnicianConfirmed: boolean;
  // Consent basis for under 16s (PGD v004 inclusion criterion)
  consentBasis: "parental" | "gillick" | "";
  consentGiverDetails: string;
  // Travel
  destination: string;
  departureDate: string;
  certificateRequired: "required" | "recommended" | "not-required" | "";
  lateTravelAdviceGiven: boolean;
  /** MMR given today or planned for today: never on the same day (stop). */
  mmrToday: boolean;
  /** MMR within 28 days either side: caution, needs a recorded reason (protection needed rapidly). */
  mmrWithin28Days: boolean;
  mmrWithin28DaysReason: string;
  // Absolute contraindications
  anaphylaxisPreviousYf: boolean;
  anaphylaxisComponent: boolean;
  eggAnaphylaxis: boolean;
  thymusDisorder: boolean;
  familyHistorySae: boolean;
  immunodeficiency: boolean;
  acuteFebrileIllness: boolean;
  pregnant: boolean; // PGD v004: exclusion (moved from cautions)
  // Precautions
  breastfeedingInfantUnder9m: boolean;
  hivPositive: boolean;
  lowDoseImmunomodulator: boolean;
  specialistAdviceObtained: boolean;
  specialistAdviceDetails: string;
  // Administration
  doseType: "first" | "reinforcing" | "booster" | "";
  reinforcingReason: string;
  batchNumber: string;
  expiryDate: string;
  route: "subcutaneous" | "intramuscular" | "";
  site: string;
  otherVaccinesSites: string;
  anaphylaxisKit: boolean;
  // Certificate and counselling
  observationCompleted: boolean;
  certificateIssued: boolean;
  certificateNumber: string;
  certificateValidFrom: string;
  /** Required when a certificate was not issued after vaccination. */
  certificateNotIssuedReason: string;
  validFromExplained: boolean;
  adverseEventAdvice: boolean;
  biteAvoidanceAdvice: boolean;
  avoidPregnancyAdvice: "given" | "not-applicable" | "";
  pilOffered: boolean;
  gpInformed: boolean;
  exemptionLetterDiscussed: boolean;
  // Excluded patient: the advice the document requires to be recorded
  exclusionExplained: boolean;
  alternativeProvisionAdvised: boolean;
}

export const emptyClinical: Clinical = {
  yfvcDesignated: false, yfvcCode: "", administeringClinician: "", pharmacistNotTechnicianConfirmed: false,
  consentBasis: "", consentGiverDetails: "",
  destination: "", departureDate: "", certificateRequired: "",
  lateTravelAdviceGiven: false, mmrToday: false, mmrWithin28Days: false, mmrWithin28DaysReason: "",
  anaphylaxisPreviousYf: false, anaphylaxisComponent: false, eggAnaphylaxis: false,
  thymusDisorder: false, familyHistorySae: false, immunodeficiency: false,
  acuteFebrileIllness: false, pregnant: false,
  breastfeedingInfantUnder9m: false, hivPositive: false,
  lowDoseImmunomodulator: false,
  specialistAdviceObtained: false, specialistAdviceDetails: "",
  doseType: "", reinforcingReason: "",
  batchNumber: "", expiryDate: "", route: "", site: "", otherVaccinesSites: "", anaphylaxisKit: false,
  observationCompleted: false,
  certificateIssued: false, certificateNumber: "", certificateValidFrom: "", certificateNotIssuedReason: "", validFromExplained: false,
  adverseEventAdvice: false, biteAvoidanceAdvice: false, avoidPregnancyAdvice: "",
  pilOffered: false, gpInformed: false, exemptionLetterDiscussed: false,
  exclusionExplained: false, alternativeProvisionAdvised: false,
};

/** Fresh copy so no shared default is ever mutated. */
export function createEmptyClinical(): Clinical {
  return { ...emptyClinical };
}

/**
 * Expiry is entered as MM/YYYY. Valid when well-formed and the last day of
 * that month is today or later.
 */
export function expiryMonthIsCurrent(expiry: string): boolean {
  const m = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(expiry.trim());
  if (!m) return false;
  const month = Number(m[1]);
  const year = Number(m[2]);
  const lastDay = new Date(year, month, 0); // day 0 of next month = last day of this month
  lastDay.setHours(23, 59, 59, 999);
  return lastDay.getTime() >= Date.now();
}
